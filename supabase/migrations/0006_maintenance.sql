-- Maintenance requests: tenants report problems, landlords track them to done.

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  unit_id uuid references public.units (id) on delete set null,
  lease_id uuid references public.leases (id) on delete set null,
  tenant_id uuid references public.tenants (id) on delete set null,
  title text not null,
  description text,
  location text,
  urgency text not null default 'routine' check (urgency in ('routine', 'urgent', 'emergency')),
  status text not null default 'new' check (status in ('new', 'scheduled', 'in_progress', 'done', 'closed')),
  permission_to_enter boolean not null default false,
  assigned_to text,
  scheduled_for date,
  cost_cents integer,
  done_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index maintenance_requests_account_idx on public.maintenance_requests (account_id, status, created_at desc);
create index maintenance_requests_tenant_idx on public.maintenance_requests (tenant_id);
create index maintenance_requests_lease_idx on public.maintenance_requests (lease_id);
create trigger maintenance_requests_updated before update on public.maintenance_requests
  for each row execute function public.set_updated_at();

create table public.maintenance_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  author_user_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  author_role text not null check (author_role in ('landlord', 'tenant', 'system')),
  body text not null,
  visible_to_tenant boolean not null default true,
  created_at timestamptz not null default now()
);
create index maintenance_notes_request_idx on public.maintenance_notes (request_id, created_at);

create table public.maintenance_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  storage_path text not null,
  content_type text not null,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index maintenance_photos_request_idx on public.maintenance_photos (request_id);

-- ---------- helpers ----------
create or replace function public.request_has_me(r uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.maintenance_requests m
    join public.tenants t on t.id = m.tenant_id
    where m.id = r and t.user_id = auth.uid()
  )
  or exists (
    select 1 from public.maintenance_requests m
    where m.id = r and m.lease_id is not null and public.lease_has_me(m.lease_id)
  );
$$;

create or replace function public.request_account(r uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select account_id from public.maintenance_requests where id = r;
$$;

-- Tenant files a request. Ties it to their active lease, unit and property.
create or replace function public.create_tenant_request(
  p_title text, p_description text, p_location text, p_urgency text, p_enter boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.tenants%rowtype;
  v_lease uuid;
  v_unit uuid;
  v_property uuid;
  rid uuid;
begin
  select * into t from public.tenants where user_id = auth.uid() limit 1;
  if t.id is null then raise exception 'not a tenant'; end if;
  if length(trim(coalesce(p_title, ''))) < 3 then raise exception 'say what is wrong'; end if;
  if p_urgency not in ('routine', 'urgent', 'emergency') then raise exception 'bad urgency'; end if;

  select ls.id, ls.unit_id, u.property_id into v_lease, v_unit, v_property
  from public.leases ls
  join public.lease_tenants lt on lt.lease_id = ls.id
  join public.units u on u.id = ls.unit_id
  where lt.tenant_id = t.id and ls.status = 'active'
  order by ls.start_date desc limit 1;
  if not found then raise exception 'no active lease'; end if;

  insert into public.maintenance_requests (account_id, property_id, unit_id, lease_id, tenant_id, title, description, location, urgency, permission_to_enter, created_by)
  values (t.account_id, v_property, v_unit, v_lease, t.id, trim(p_title), nullif(trim(coalesce(p_description, '')), ''), nullif(trim(coalesce(p_location, '')), ''), p_urgency, coalesce(p_enter, false), auth.uid())
  returning id into rid;

  insert into public.maintenance_notes (request_id, account_id, author_user_id, author_name, author_role, body, visible_to_tenant)
  values (rid, t.account_id, auth.uid(), t.full_name, 'tenant', 'Request sent.', true);
  return rid;
end;
$$;
grant execute on function public.create_tenant_request(text, text, text, text, boolean) to authenticated;

-- Tenant adds a comment to their own request.
create or replace function public.add_tenant_note(r uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.tenants%rowtype;
  nid uuid;
begin
  select * into t from public.tenants where user_id = auth.uid() limit 1;
  if t.id is null or not public.request_has_me(r) then raise exception 'not your request'; end if;
  if length(trim(coalesce(p_body, ''))) = 0 then raise exception 'empty note'; end if;
  insert into public.maintenance_notes (request_id, account_id, author_user_id, author_name, author_role, body, visible_to_tenant)
  values (r, t.account_id, auth.uid(), t.full_name, 'tenant', trim(p_body), true)
  returning id into nid;
  return nid;
end;
$$;
grant execute on function public.add_tenant_note(uuid, text) to authenticated;

-- Tenant records a photo they uploaded to storage.
create or replace function public.add_tenant_photo(r uuid, p_path text, p_type text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  if not public.request_has_me(r) then raise exception 'not your request'; end if;
  insert into public.maintenance_photos (request_id, account_id, storage_path, content_type, uploaded_by)
  values (r, public.request_account(r), p_path, p_type, auth.uid())
  returning id into pid;
  return pid;
end;
$$;
grant execute on function public.add_tenant_photo(uuid, text, text) to authenticated;

-- ---------- row level security ----------
alter table public.maintenance_requests enable row level security;
alter table public.maintenance_notes enable row level security;
alter table public.maintenance_photos enable row level security;

create policy "members manage requests" on public.maintenance_requests
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));
create policy "tenant reads own requests" on public.maintenance_requests
  for select using (public.request_has_me(id));

create policy "members manage notes" on public.maintenance_notes
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));
create policy "tenant reads visible notes" on public.maintenance_notes
  for select using (visible_to_tenant and public.request_has_me(request_id));

create policy "members manage photos" on public.maintenance_photos
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));
create policy "tenant reads own photos" on public.maintenance_photos
  for select using (public.request_has_me(request_id));

-- ---------- storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('maintenance-photos', 'maintenance-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

-- Paths: <account_id>/<request_id>/<file>
create policy "members manage maintenance photos" on storage.objects
  for all using (
    bucket_id = 'maintenance-photos' and public.is_member((storage.foldername(name))[1]::uuid)
  ) with check (
    bucket_id = 'maintenance-photos' and public.is_member((storage.foldername(name))[1]::uuid)
  );
create policy "tenant reads own request photos" on storage.objects
  for select using (
    bucket_id = 'maintenance-photos' and public.request_has_me((storage.foldername(name))[2]::uuid)
  );
create policy "tenant uploads own request photos" on storage.objects
  for insert with check (
    bucket_id = 'maintenance-photos' and public.request_has_me((storage.foldername(name))[2]::uuid)
  );
