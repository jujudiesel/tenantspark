-- TenantSpark core schema: accounts, members, properties, units, tenants, leases.
-- Every table carries account_id and is locked down with row level security so a
-- landlord can only ever see rows for accounts they belong to.

create extension if not exists "pgcrypto";

-- ---------- profiles (one per auth user) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

-- ---------- accounts (a landlord's business) ----------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.account_members (
  account_id uuid not null references public.accounts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (account_id, user_id)
);
create index account_members_user_idx on public.account_members (user_id);

-- Helper: is the current user a member of this account?
create or replace function public.is_member(acct uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.account_members m
    where m.account_id = acct and m.user_id = auth.uid()
  );
$$;

-- Helper: the current user's accounts
create or replace function public.my_account_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select account_id from public.account_members where user_id = auth.uid();
$$;

-- ---------- properties ----------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  zip text not null,
  property_type text not null default 'single_family'
    check (property_type in ('single_family', 'multi_family', 'condo', 'townhouse', 'commercial', 'other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index properties_account_idx on public.properties (account_id);

-- ---------- units ----------
create table public.units (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  label text not null,
  bedrooms numeric(3,1),
  bathrooms numeric(3,1),
  square_feet integer,
  market_rent_cents integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, label)
);
create index units_account_idx on public.units (account_id);
create index units_property_idx on public.units (property_id);

-- ---------- tenants ----------
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  notes text,
  invite_token uuid default gen_random_uuid(),
  invited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tenants_account_idx on public.tenants (account_id);
create index tenants_user_idx on public.tenants (user_id);

-- ---------- leases ----------
create table public.leases (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  unit_id uuid not null references public.units (id) on delete cascade,
  start_date date not null,
  end_date date,
  rent_cents integer not null check (rent_cents >= 0),
  deposit_cents integer not null default 0 check (deposit_cents >= 0),
  rent_due_day smallint not null default 1 check (rent_due_day between 1 and 28),
  status text not null default 'active' check (status in ('draft', 'active', 'ended')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leases_account_idx on public.leases (account_id);
create index leases_unit_idx on public.leases (unit_id);

create table public.lease_tenants (
  lease_id uuid not null references public.leases (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  is_primary boolean not null default false,
  primary key (lease_id, tenant_id)
);

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_updated before update on public.properties
  for each row execute function public.set_updated_at();
create trigger units_updated before update on public.units
  for each row execute function public.set_updated_at();
create trigger tenants_updated before update on public.tenants
  for each row execute function public.set_updated_at();
create trigger leases_updated before update on public.leases
  for each row execute function public.set_updated_at();

-- ---------- new user: profile + account + membership ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_account uuid;
  company text;
  is_tenant boolean;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);

  is_tenant := coalesce((new.raw_user_meta_data ->> 'role') = 'tenant', false);

  if not is_tenant then
    company := nullif(trim(new.raw_user_meta_data ->> 'company_name'), '');
    if company is null then
      company := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'My') || '''s rentals';
    end if;

    insert into public.accounts (name, created_by) values (company, new.id)
    returning id into new_account;

    insert into public.account_members (account_id, user_id, role)
    values (new_account, new.id, 'owner');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.account_members enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;
alter table public.lease_tenants enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "members read accounts" on public.accounts
  for select using (public.is_member(id));
create policy "owners update accounts" on public.accounts
  for update using (
    exists (select 1 from public.account_members m
            where m.account_id = id and m.user_id = auth.uid() and m.role = 'owner')
  );

create policy "members read memberships" on public.account_members
  for select using (public.is_member(account_id));

create policy "members manage properties" on public.properties
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));

create policy "members manage units" on public.units
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));

create policy "members manage tenants" on public.tenants
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));
create policy "tenant reads own record" on public.tenants
  for select using (user_id = auth.uid());

create policy "members manage leases" on public.leases
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));
create policy "tenant reads own leases" on public.leases
  for select using (
    exists (select 1 from public.lease_tenants lt
            join public.tenants t on t.id = lt.tenant_id
            where lt.lease_id = id and t.user_id = auth.uid())
  );

create policy "members manage lease_tenants" on public.lease_tenants
  for all using (
    exists (select 1 from public.leases l where l.id = lease_id and public.is_member(l.account_id))
  ) with check (
    exists (select 1 from public.leases l where l.id = lease_id and public.is_member(l.account_id))
  );
create policy "tenant reads own lease_tenants" on public.lease_tenants
  for select using (
    exists (select 1 from public.tenants t where t.id = tenant_id and t.user_id = auth.uid())
  );
