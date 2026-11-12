-- Tenant portal: invites, lease documents, e-signatures, and read access for tenants.

-- ---------- tenant can read the unit, property and account on their lease ----------
create or replace function public.unit_has_me(u uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.leases l
    join public.lease_tenants lt on lt.lease_id = l.id
    join public.tenants t on t.id = lt.tenant_id
    where l.unit_id = u and t.user_id = auth.uid()
  );
$$;

create or replace function public.property_has_me(p uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.units u where u.property_id = p and public.unit_has_me(u.id)
  );
$$;

create or replace function public.account_has_me(a uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenants t where t.account_id = a and t.user_id = auth.uid()
  );
$$;

create policy "tenant reads own unit" on public.units
  for select using (public.unit_has_me(id));
create policy "tenant reads own property" on public.properties
  for select using (public.property_has_me(id));
create policy "tenant reads landlord account" on public.accounts
  for select using (public.account_has_me(id));

-- ---------- invites ----------
-- Called by a freshly signed-up tenant to attach their login to the tenant record.
create or replace function public.accept_invite(token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  update public.tenants
  set user_id = auth.uid(), invite_token = null
  where invite_token = token and user_id is null
  returning id into tid;

  if tid is null then
    raise exception 'invite not found or already used';
  end if;

  return tid;
end;
$$;

-- Lets the invite page show the tenant's name and landlord before they sign up.
create or replace function public.invite_preview(token uuid)
returns table (full_name text, email text, landlord text)
language sql
stable
security definer
set search_path = public
as $$
  select t.full_name, t.email, a.name
  from public.tenants t
  join public.accounts a on a.id = t.account_id
  where t.invite_token = token and t.user_id is null;
$$;

grant execute on function public.accept_invite(uuid) to authenticated;
grant execute on function public.invite_preview(uuid) to anon, authenticated;

-- ---------- lease documents ----------
create table public.lease_documents (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  lease_id uuid not null references public.leases (id) on delete cascade,
  title text not null,
  storage_path text not null,
  signed_storage_path text,
  size_bytes integer,
  status text not null default 'draft' check (status in ('draft', 'sent', 'signed')),
  sent_at timestamptz,
  signed_at timestamptz,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lease_documents_lease_idx on public.lease_documents (lease_id);
create index lease_documents_account_idx on public.lease_documents (account_id);
create trigger lease_documents_updated before update on public.lease_documents
  for each row execute function public.set_updated_at();

create table public.lease_signatures (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.lease_documents (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  typed_name text not null,
  consented boolean not null default true,
  ip_address text,
  user_agent text,
  signed_at timestamptz not null default now(),
  unique (document_id, tenant_id)
);
create index lease_signatures_document_idx on public.lease_signatures (document_id);

alter table public.lease_documents enable row level security;
alter table public.lease_signatures enable row level security;

create policy "members manage lease documents" on public.lease_documents
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));
create policy "tenant reads own lease documents" on public.lease_documents
  for select using (public.lease_has_me(lease_id) and status <> 'draft');
-- Tenants record their signature through sign_document() below, never by direct insert.

create or replace function public.document_account(d uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select account_id from public.lease_documents where id = d;
$$;

create policy "members read signatures" on public.lease_signatures
  for select using (public.is_member(public.document_account(document_id)));
create policy "tenant reads own signatures" on public.lease_signatures
  for select using (public.tenant_is_me(tenant_id));

-- Tenant signs: checks they are on the lease, records the signature, and marks the
-- document signed once every tenant on the lease has signed.
create or replace function public.sign_document(doc uuid, typed text, ip text, agent text)
returns table (all_signed boolean, signature_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.lease_documents%rowtype;
  me uuid;
  sid uuid;
  needed integer;
  done integer;
begin
  select * into d from public.lease_documents where id = doc;
  if d.id is null then raise exception 'document not found'; end if;
  if d.status = 'draft' then raise exception 'document not sent'; end if;

  select t.id into me
  from public.tenants t
  join public.lease_tenants lt on lt.tenant_id = t.id
  where lt.lease_id = d.lease_id and t.user_id = auth.uid()
  limit 1;
  if me is null then raise exception 'you are not on this lease'; end if;

  if length(trim(typed)) < 2 then raise exception 'type your full name'; end if;

  insert into public.lease_signatures (document_id, tenant_id, user_id, typed_name, ip_address, user_agent)
  values (doc, me, auth.uid(), trim(typed), ip, agent)
  on conflict (document_id, tenant_id) do update set typed_name = excluded.typed_name
  returning id into sid;

  select count(*) into needed from public.lease_tenants where lease_id = d.lease_id;
  select count(*) into done from public.lease_signatures where document_id = doc;

  if done >= needed then
    update public.lease_documents set status = 'signed', signed_at = now() where id = doc;
    return query select true, sid;
  else
    return query select false, sid;
  end if;
end;
$$;
grant execute on function public.sign_document(uuid, text, text, text) to authenticated;

-- Lets the signing step write the stamped PDF even though tenants can't update documents.
create or replace function public.set_signed_path(doc uuid, path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.lease_has_me((select lease_id from public.lease_documents where id = doc)) then
    raise exception 'not your lease';
  end if;
  update public.lease_documents set signed_storage_path = path where id = doc and status = 'signed';
end;
$$;
grant execute on function public.set_signed_path(uuid, text) to authenticated;

-- ---------- storage bucket for lease files ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lease-files', 'lease-files', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

-- Paths look like <account_id>/<lease_id>/<file>. Landlords manage their account folder;
-- tenants read files for leases they are on and may write the signed copy.
create policy "members manage lease files" on storage.objects
  for all using (
    bucket_id = 'lease-files' and public.is_member((storage.foldername(name))[1]::uuid)
  ) with check (
    bucket_id = 'lease-files' and public.is_member((storage.foldername(name))[1]::uuid)
  );

create policy "tenant reads own lease files" on storage.objects
  for select using (
    bucket_id = 'lease-files' and public.lease_has_me((storage.foldername(name))[2]::uuid)
  );

create policy "tenant writes signed copy" on storage.objects
  for insert with check (
    bucket_id = 'lease-files'
    and public.lease_has_me((storage.foldername(name))[2]::uuid)
    and name like '%/signed-%'
  );
