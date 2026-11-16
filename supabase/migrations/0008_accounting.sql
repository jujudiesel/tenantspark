-- Accounting: categories, income/expense entries, repair costs flowing into the books.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')),
  name text not null,
  sort integer not null default 100,
  is_system boolean not null default false,   -- Rent, Late fees, Repairs: used by automatic entries, can't be deleted
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (account_id, kind, name)
);
create index categories_account_idx on public.categories (account_id, kind, sort);

-- Manual income and expenses. Online and recorded rent payments are NOT copied here; reports read them from payments.
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')),
  property_id uuid references public.properties (id) on delete set null,
  unit_id uuid references public.units (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  vendor text,                       -- who was paid, or who paid you
  amount_cents integer not null check (amount_cents > 0),
  entry_date date not null default current_date,
  memo text,
  receipt_path text,
  maintenance_request_id uuid unique references public.maintenance_requests (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ledger_entries_account_date_idx on public.ledger_entries (account_id, entry_date desc);
create index ledger_entries_property_idx on public.ledger_entries (property_id, entry_date);
create trigger ledger_entries_updated before update on public.ledger_entries
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.ledger_entries enable row level security;
create policy "members manage categories" on public.categories
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));
create policy "members manage ledger" on public.ledger_entries
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));

-- ---------- default categories ----------
-- Schedule E style expense lines, plus the income lines automatic entries use.
create or replace function public.ensure_categories(p_account uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.categories where account_id = p_account) then return; end if;
  insert into public.categories (account_id, kind, name, sort, is_system) values
    (p_account, 'income', 'Rent', 10, true),
    (p_account, 'income', 'Late fees', 20, true),
    (p_account, 'income', 'Application fees', 30, false),
    (p_account, 'income', 'Laundry and parking', 40, false),
    (p_account, 'income', 'Other income', 90, false),
    (p_account, 'expense', 'Repairs', 10, true),
    (p_account, 'expense', 'Cleaning and maintenance', 20, false),
    (p_account, 'expense', 'Utilities', 30, false),
    (p_account, 'expense', 'Insurance', 40, false),
    (p_account, 'expense', 'Property taxes', 50, false),
    (p_account, 'expense', 'Mortgage interest', 60, false),
    (p_account, 'expense', 'Management fees', 70, false),
    (p_account, 'expense', 'Legal and professional', 80, false),
    (p_account, 'expense', 'Advertising', 90, false),
    (p_account, 'expense', 'Supplies', 100, false),
    (p_account, 'expense', 'Auto and travel', 110, false),
    (p_account, 'expense', 'HOA dues', 120, false),
    (p_account, 'expense', 'Other expense', 900, false);
end;
$$;

-- Callable by a signed-in member for their own account.
create or replace function public.ensure_my_categories(p_account uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_member(p_account) then raise exception 'not a member'; end if;
  perform public.ensure_categories(p_account);
end;
$$;
grant execute on function public.ensure_my_categories(uuid) to authenticated;

-- New accounts get categories right away.
create or replace function public.trg_account_categories()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.ensure_categories(new.id);
  return null;
end; $$;
create trigger accounts_categories after insert on public.accounts
  for each row execute function public.trg_account_categories();

-- Existing accounts.
do $$
declare a record;
begin
  for a in select id from public.accounts loop
    perform public.ensure_categories(a.id);
  end loop;
end $$;

-- ---------- repair costs become expenses ----------
-- When a request is done or closed with a cost, keep one expense entry in step with it.
create or replace function public.trg_repair_expense()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cat uuid;
begin
  if new.status in ('done', 'closed') and coalesce(new.cost_cents, 0) > 0 then
    select id into cat from public.categories where account_id = new.account_id and kind = 'expense' and name = 'Repairs' limit 1;
    insert into public.ledger_entries (account_id, kind, property_id, unit_id, category_id, vendor, amount_cents, entry_date, memo, maintenance_request_id, created_by)
    values (new.account_id, 'expense', new.property_id, new.unit_id, cat, new.assigned_to, new.cost_cents, coalesce(new.done_at::date, current_date), new.title, new.id, new.created_by)
    on conflict (maintenance_request_id) do update
      set amount_cents = excluded.amount_cents,
          vendor = coalesce(excluded.vendor, public.ledger_entries.vendor),
          memo = excluded.memo,
          property_id = excluded.property_id,
          unit_id = excluded.unit_id;
  elsif coalesce(new.cost_cents, 0) = 0 or new.status not in ('done', 'closed') then
    delete from public.ledger_entries where maintenance_request_id = new.id;
  end if;
  return null;
end; $$;
create trigger maintenance_requests_expense after insert or update on public.maintenance_requests
  for each row execute function public.trg_repair_expense();

-- Backfill from repairs already done.
insert into public.ledger_entries (account_id, kind, property_id, unit_id, category_id, vendor, amount_cents, entry_date, memo, maintenance_request_id, created_by)
select m.account_id, 'expense', m.property_id, m.unit_id,
       (select id from public.categories c where c.account_id = m.account_id and c.kind = 'expense' and c.name = 'Repairs' limit 1),
       m.assigned_to, m.cost_cents, coalesce(m.done_at::date, m.updated_at::date), m.title, m.id, m.created_by
from public.maintenance_requests m
where m.status in ('done', 'closed') and coalesce(m.cost_cents, 0) > 0
on conflict (maintenance_request_id) do nothing;

-- ---------- receipts ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do nothing;
create policy "members manage receipts" on storage.objects
  for all using (bucket_id = 'receipts' and public.is_member((storage.foldername(name))[1]::uuid))
  with check (bucket_id = 'receipts' and public.is_member((storage.foldername(name))[1]::uuid));
