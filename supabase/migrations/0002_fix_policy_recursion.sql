-- The leases and lease_tenants policies referred to each other, which Postgres rejects
-- as infinite recursion. Security definer helpers break the loop.

create or replace function public.lease_account(l uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select account_id from public.leases where id = l;
$$;

create or replace function public.tenant_is_me(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.tenants where id = t and user_id = auth.uid());
$$;

create or replace function public.lease_has_me(l uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.lease_tenants lt
    join public.tenants t on t.id = lt.tenant_id
    where lt.lease_id = l and t.user_id = auth.uid()
  );
$$;

drop policy if exists "tenant reads own leases" on public.leases;
create policy "tenant reads own leases" on public.leases
  for select using (public.lease_has_me(id));

drop policy if exists "members manage lease_tenants" on public.lease_tenants;
create policy "members manage lease_tenants" on public.lease_tenants
  for all using (public.is_member(public.lease_account(lease_id)))
  with check (public.is_member(public.lease_account(lease_id)));

drop policy if exists "tenant reads own lease_tenants" on public.lease_tenants;
create policy "tenant reads own lease_tenants" on public.lease_tenants
  for select using (public.tenant_is_me(tenant_id));
