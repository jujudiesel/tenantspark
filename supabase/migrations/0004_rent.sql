-- Rent collection: Stripe connection per landlord, monthly charges, payments, autopay.

-- ---------- per-landlord payment settings and Stripe connection ----------
create table public.payment_settings (
  account_id uuid primary key references public.accounts (id) on delete cascade,
  stripe_account_id text unique,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  -- Convenience fees the tenant pays on top of rent. Platform keeps them.
  card_fee_bps integer not null default 300 check (card_fee_bps between 0 and 1000),
  ach_fee_cents integer not null default 195 check (ach_fee_cents between 0 and 2000),
  -- Late fees the landlord charges. Fixed amount, applied after grace days.
  late_fee_cents integer not null default 0 check (late_fee_cents >= 0),
  grace_days integer not null default 5 check (grace_days between 0 and 28),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger payment_settings_updated before update on public.payment_settings
  for each row execute function public.set_updated_at();

-- ---------- monthly rent charges, one per lease per month ----------
create table public.rent_charges (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  lease_id uuid not null references public.leases (id) on delete cascade,
  period_start date not null,                 -- first day of the month it covers
  due_date date not null,
  amount_cents integer not null check (amount_cents >= 0),
  late_fee_cents integer not null default 0 check (late_fee_cents >= 0),
  paid_cents integer not null default 0 check (paid_cents >= 0),
  status text not null default 'due' check (status in ('due', 'partial', 'paid', 'void')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lease_id, period_start)
);
create index rent_charges_account_idx on public.rent_charges (account_id, due_date);
create index rent_charges_lease_idx on public.rent_charges (lease_id);
create trigger rent_charges_updated before update on public.rent_charges
  for each row execute function public.set_updated_at();

-- ---------- payments against charges ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  lease_id uuid not null references public.leases (id) on delete cascade,
  charge_id uuid references public.rent_charges (id) on delete set null,
  tenant_id uuid references public.tenants (id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),      -- toward rent
  fee_cents integer not null default 0 check (fee_cents >= 0), -- convenience fee tenant paid
  method text not null check (method in ('ach', 'card', 'cash', 'check', 'other')),
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  stripe_payment_intent_id text unique,
  failure_message text,
  note text,
  recorded_by uuid references auth.users (id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_account_idx on public.payments (account_id, created_at desc);
create index payments_charge_idx on public.payments (charge_id);
create index payments_tenant_idx on public.payments (tenant_id);
create trigger payments_updated before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------- tenant saved payment method and autopay ----------
create table public.tenant_billing (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_payment_method_id text,
  method_type text check (method_type in ('ach', 'card')),
  method_label text,            -- "Chase ••1234" or "Visa ••4242"
  autopay boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tenant_billing_updated before update on public.tenant_billing
  for each row execute function public.set_updated_at();

-- ---------- keep charge totals in sync with payments ----------
create or replace function public.recompute_charge(c uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
  owed integer;
begin
  select coalesce(sum(amount_cents), 0) into total
  from public.payments where charge_id = c and status = 'succeeded';
  select amount_cents + late_fee_cents into owed from public.rent_charges where id = c;
  update public.rent_charges
  set paid_cents = total,
      status = case
        when status = 'void' then 'void'
        when total >= owed then 'paid'
        when total > 0 then 'partial'
        else 'due' end
  where id = c;
end;
$$;

grant execute on function public.recompute_charge(uuid) to authenticated;

create or replace function public.payments_recompute_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.charge_id is not null then perform public.recompute_charge(old.charge_id); end if;
    return old;
  end if;
  if new.charge_id is not null then perform public.recompute_charge(new.charge_id); end if;
  if tg_op = 'UPDATE' and old.charge_id is distinct from new.charge_id and old.charge_id is not null then
    perform public.recompute_charge(old.charge_id);
  end if;
  return new;
end;
$$;
create trigger payments_recompute after insert or update or delete on public.payments
  for each row execute function public.payments_recompute_trigger();

-- ---------- generate this month's charges for every active lease ----------
create or replace function public.generate_rent_charges(month_start date default date_trunc('month', current_date)::date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  insert into public.rent_charges (account_id, lease_id, period_start, due_date, amount_cents, description)
  select l.account_id, l.id, month_start,
         (month_start + (l.rent_due_day - 1))::date,
         l.rent_cents,
         to_char(month_start, 'FMMonth YYYY') || ' rent'
  from public.leases l
  where l.status = 'active'
    and l.start_date <= (month_start + interval '1 month - 1 day')::date
    and (l.end_date is null or l.end_date >= month_start)
  on conflict (lease_id, period_start) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Landlord can generate charges for their own account on demand (e.g. a new lease mid-month).
create or replace function public.generate_my_rent_charges(month_start date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  insert into public.rent_charges (account_id, lease_id, period_start, due_date, amount_cents, description)
  select l.account_id, l.id, month_start,
         (month_start + (l.rent_due_day - 1))::date,
         l.rent_cents,
         to_char(month_start, 'FMMonth YYYY') || ' rent'
  from public.leases l
  where l.status = 'active'
    and public.is_member(l.account_id)
    and l.start_date <= (month_start + interval '1 month - 1 day')::date
    and (l.end_date is null or l.end_date >= month_start)
  on conflict (lease_id, period_start) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;
grant execute on function public.generate_my_rent_charges(date) to authenticated;

-- ---------- apply late fees once the grace period passes ----------
create or replace function public.apply_late_fees(today date default current_date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.rent_charges c
  set late_fee_cents = s.late_fee_cents
  from public.payment_settings s
  where s.account_id = c.account_id
    and s.late_fee_cents > 0
    and c.late_fee_cents = 0
    and c.status in ('due', 'partial')
    and c.due_date + s.grace_days < today;
  get diagnostics n = row_count;
  -- status may change now that more is owed
  perform public.recompute_charge(id) from public.rent_charges where late_fee_cents > 0 and status = 'paid';
  return n;
end;
$$;

-- ---------- tenant-side helpers (security definer so tenants never write tables directly) ----------
create or replace function public.tenant_charge_access(c uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rent_charges rc where rc.id = c and public.lease_has_me(rc.lease_id)
  );
$$;

-- Tenant starts an online payment. Server code creates the Stripe PaymentIntent first, then records it here.
create or replace function public.start_tenant_payment(
  c uuid, amt integer, fee integer, pay_method text, intent_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  rc public.rent_charges%rowtype;
  me uuid;
  pid uuid;
begin
  select * into rc from public.rent_charges where id = c;
  if rc.id is null or not public.lease_has_me(rc.lease_id) then raise exception 'not your charge'; end if;
  if rc.status in ('paid', 'void') then raise exception 'already paid'; end if;
  if amt <= 0 or amt > (rc.amount_cents + rc.late_fee_cents - rc.paid_cents) then raise exception 'bad amount'; end if;
  if pay_method not in ('ach', 'card') then raise exception 'bad method'; end if;

  select t.id into me from public.tenants t
  join public.lease_tenants lt on lt.tenant_id = t.id
  where lt.lease_id = rc.lease_id and t.user_id = auth.uid() limit 1;

  insert into public.payments (account_id, lease_id, charge_id, tenant_id, amount_cents, fee_cents, method, status, stripe_payment_intent_id)
  values (rc.account_id, rc.lease_id, c, me, amt, fee, pay_method, 'pending', intent_id)
  returning id into pid;
  return pid;
end;
$$;
grant execute on function public.start_tenant_payment(uuid, integer, integer, text, text) to authenticated;

-- Called by the Stripe webhook (service role) or by the tenant after Stripe confirms.
create or replace function public.settle_payment(intent_id text, new_status text, failure text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_status not in ('pending', 'succeeded', 'failed', 'refunded') then raise exception 'bad status'; end if;
  update public.payments
  set status = new_status,
      failure_message = failure,
      paid_at = case when new_status = 'succeeded' then coalesce(paid_at, now()) else paid_at end
  where stripe_payment_intent_id = intent_id
    and (auth.uid() is null or tenant_id in (select id from public.tenants where user_id = auth.uid()));
end;
$$;
grant execute on function public.settle_payment(text, text, text) to authenticated, service_role;

create or replace function public.save_tenant_billing(
  customer_id text, pm_id text, pm_type text, pm_label text, auto boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.tenants%rowtype;
begin
  select * into t from public.tenants where user_id = auth.uid() limit 1;
  if t.id is null then raise exception 'not a tenant'; end if;
  insert into public.tenant_billing (tenant_id, account_id, stripe_customer_id, stripe_payment_method_id, method_type, method_label, autopay)
  values (t.id, t.account_id, customer_id, pm_id, pm_type, pm_label, auto)
  on conflict (tenant_id) do update set
    stripe_customer_id = coalesce(excluded.stripe_customer_id, public.tenant_billing.stripe_customer_id),
    stripe_payment_method_id = coalesce(excluded.stripe_payment_method_id, public.tenant_billing.stripe_payment_method_id),
    method_type = coalesce(excluded.method_type, public.tenant_billing.method_type),
    method_label = coalesce(excluded.method_label, public.tenant_billing.method_label),
    autopay = excluded.autopay;
end;
$$;
grant execute on function public.save_tenant_billing(text, text, text, text, boolean) to authenticated;

-- ---------- row level security ----------
alter table public.payment_settings enable row level security;
alter table public.rent_charges enable row level security;
alter table public.payments enable row level security;
alter table public.tenant_billing enable row level security;

create policy "members manage payment settings" on public.payment_settings
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));
create policy "tenant reads landlord fee settings" on public.payment_settings
  for select using (public.account_has_me(account_id));

create policy "members manage rent charges" on public.rent_charges
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));
create policy "tenant reads own charges" on public.rent_charges
  for select using (public.lease_has_me(lease_id));

create policy "members manage payments" on public.payments
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));
create policy "tenant reads own payments" on public.payments
  for select using (public.lease_has_me(lease_id));

create policy "members read tenant billing" on public.tenant_billing
  for select using (public.is_member(account_id));
create policy "tenant reads own billing" on public.tenant_billing
  for select using (public.tenant_is_me(tenant_id));
