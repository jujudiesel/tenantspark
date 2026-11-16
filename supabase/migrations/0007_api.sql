-- Public API keys, outbound events, and webhook subscriptions (Zapier and anyone else).

-- ---------- API keys ----------
-- The key itself is shown once and never stored. We keep a sha256 of it.
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  prefix text not null,                 -- first characters, for display ("ts_live_a1b2…")
  key_hash text not null unique,        -- sha256 hex of the full key
  created_by uuid references auth.users (id) on delete set null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index api_keys_account_idx on public.api_keys (account_id);

-- ---------- outbound events ----------
-- One row per thing that happened. Written by triggers below. Delivered to subscriptions by the app.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  type text not null,                   -- tenant.created, rent.paid, repair.created ...
  object_type text not null,            -- tenant, lease, charge, payment, repair, document
  object_id uuid not null,
  created_at timestamptz not null default now()
);
create index events_account_idx on public.events (account_id, created_at desc);
create index events_type_idx on public.events (account_id, type, created_at desc);

-- ---------- webhook subscriptions ----------
create table public.webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  api_key_id uuid references public.api_keys (id) on delete cascade,
  url text not null,
  event_type text not null,             -- one type, or '*' for everything
  secret text not null,                 -- used to sign payloads (HMAC sha256)
  source text not null default 'api' check (source in ('api', 'zapier')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index webhook_subscriptions_account_idx on public.webhook_subscriptions (account_id, active);

create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.webhook_subscriptions (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  attempts integer not null default 0,
  status_code integer,
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (subscription_id, event_id)
);
create index webhook_deliveries_pending_idx on public.webhook_deliveries (delivered_at) where delivered_at is null;

-- ---------- RLS ----------
alter table public.api_keys enable row level security;
alter table public.events enable row level security;
alter table public.webhook_subscriptions enable row level security;
alter table public.webhook_deliveries enable row level security;

create policy "members manage api keys" on public.api_keys
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));
create policy "members read events" on public.events
  for select using (public.is_member(account_id));
create policy "members manage subscriptions" on public.webhook_subscriptions
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));
create policy "members read deliveries" on public.webhook_deliveries
  for select using (exists (select 1 from public.webhook_subscriptions s where s.id = subscription_id and public.is_member(s.account_id)));

-- ---------- event triggers ----------
-- Security definer so inserts work no matter who caused the change (landlord, tenant RPC, cron).
create or replace function public.emit_event(p_account uuid, p_type text, p_object_type text, p_object_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.events (account_id, type, object_type, object_id) values (p_account, p_type, p_object_type, p_object_id);
$$;

create or replace function public.trg_tenant_events()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.emit_event(new.account_id, 'tenant.created', 'tenant', new.id);
  elsif tg_op = 'UPDATE' and new.user_id is not null and old.user_id is null then
    perform public.emit_event(new.account_id, 'tenant.signed_up', 'tenant', new.id);
  end if;
  return null;
end; $$;
create trigger tenants_events after insert or update on public.tenants
  for each row execute function public.trg_tenant_events();

create or replace function public.trg_lease_events()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.emit_event(new.account_id, 'lease.created', 'lease', new.id);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'active' then perform public.emit_event(new.account_id, 'lease.started', 'lease', new.id); end if;
    if new.status = 'ended' then perform public.emit_event(new.account_id, 'lease.ended', 'lease', new.id); end if;
  end if;
  return null;
end; $$;
create trigger leases_events after insert or update on public.leases
  for each row execute function public.trg_lease_events();

create or replace function public.trg_document_events()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.status = 'signed' and old.status is distinct from 'signed' then
    perform public.emit_event(new.account_id, 'lease.signed', 'document', new.id);
  elsif tg_op = 'UPDATE' and new.status = 'sent' and old.status is distinct from 'sent' then
    perform public.emit_event(new.account_id, 'document.sent', 'document', new.id);
  end if;
  return null;
end; $$;
create trigger lease_documents_events after update on public.lease_documents
  for each row execute function public.trg_document_events();

create or replace function public.trg_charge_events()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.emit_event(new.account_id, 'rent.charged', 'charge', new.id);
  elsif tg_op = 'UPDATE' then
    if new.status = 'paid' and old.status is distinct from 'paid' then
      perform public.emit_event(new.account_id, 'rent.paid', 'charge', new.id);
    end if;
    if new.late_fee_cents > 0 and old.late_fee_cents = 0 then
      perform public.emit_event(new.account_id, 'rent.late_fee_added', 'charge', new.id);
    end if;
  end if;
  return null;
end; $$;
create trigger rent_charges_events after insert or update on public.rent_charges
  for each row execute function public.trg_charge_events();

create or replace function public.trg_payment_events()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT' and new.status = 'succeeded') or (tg_op = 'UPDATE' and new.status = 'succeeded' and old.status is distinct from 'succeeded') then
    perform public.emit_event(new.account_id, 'payment.received', 'payment', new.id);
  elsif tg_op = 'UPDATE' and new.status = 'failed' and old.status is distinct from 'failed' then
    perform public.emit_event(new.account_id, 'payment.failed', 'payment', new.id);
  end if;
  return null;
end; $$;
create trigger payments_events after insert or update on public.payments
  for each row execute function public.trg_payment_events();

create or replace function public.trg_repair_events()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.emit_event(new.account_id, 'repair.created', 'repair', new.id);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    perform public.emit_event(new.account_id, 'repair.updated', 'repair', new.id);
    if new.status in ('done', 'closed') then perform public.emit_event(new.account_id, 'repair.done', 'repair', new.id); end if;
  end if;
  return null;
end; $$;
create trigger maintenance_requests_events after insert or update on public.maintenance_requests
  for each row execute function public.trg_repair_events();

-- Rent that is past due (after the grace period) and still unpaid. Called by the daily job.
-- Emits rent.late once per charge.
create or replace function public.emit_late_rent_events(today date default current_date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  insert into public.events (account_id, type, object_type, object_id)
  select c.account_id, 'rent.late', 'charge', c.id
  from public.rent_charges c
  left join public.payment_settings s on s.account_id = c.account_id
  where c.status in ('due', 'partial')
    and c.due_date + coalesce(s.grace_days, 5) < today
    and not exists (select 1 from public.events e where e.object_id = c.id and e.type = 'rent.late');
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------- near-realtime delivery ----------
-- When an event lands, ping the app so it can send webhooks right away.
-- The app also sweeps undelivered events daily, so a missed ping is not lost.
create extension if not exists pg_net;

-- Secrets live here, not in migrations. Not exposed through the API.
create schema if not exists private;
create table if not exists private.config (
  key text primary key,
  value text not null
);
revoke all on schema private from public, anon, authenticated;
revoke all on private.config from public, anon, authenticated;
alter table private.config enable row level security;
-- After applying: insert into private.config (key, value) values ('dispatch_secret', '<same value as DISPATCH_SECRET on Vercel>'), ('app_url', 'https://tenantspark.com');

create or replace function public.trg_event_ping()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  v_url text;
  v_secret text;
begin
  select value into v_url from private.config where key = 'app_url';
  select value into v_secret from private.config where key = 'dispatch_secret';
  if v_url is null or v_secret is null then return null; end if;
  perform net.http_post(
    url := v_url || '/api/webhooks/dispatch',
    body := jsonb_build_object('event_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-tenantspark-dispatch', v_secret),
    timeout_milliseconds := 8000
  );
  return null;
end; $$;
create trigger events_ping after insert on public.events
  for each row execute function public.trg_event_ping();
