-- Reminders and notifications: what to send, and a log of what was sent.

create table public.notification_settings (
  account_id uuid primary key references public.accounts (id) on delete cascade,
  rent_due_soon boolean not null default true,      -- 3 days before
  rent_due_today boolean not null default true,
  rent_late boolean not null default true,          -- once late, then weekly
  lease_ending boolean not null default true,       -- 60 and 30 days out, tenant and landlord
  repair_updates boolean not null default true,     -- tenant: status and notes; landlord: new requests and tenant replies
  document_sent boolean not null default true,      -- tenant: something to sign
  payment_receipt boolean not null default true,    -- tenant: receipt; landlord: rent paid
  sms_enabled boolean not null default true,        -- texts to tenants with a phone, when SMS is configured
  updated_at timestamptz not null default now()
);
create trigger notification_settings_updated before update on public.notification_settings
  for each row execute function public.set_updated_at();
alter table public.notification_settings enable row level security;
create policy "members manage notification settings" on public.notification_settings
  for all using (public.is_member(account_id)) with check (public.is_member(account_id));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete set null,
  channel text not null check (channel in ('email', 'sms')),
  kind text not null,                 -- rent.due_soon, rent.late, repair.note, ...
  recipient text not null,
  subject text,
  body text,
  status text not null check (status in ('sent', 'skipped', 'failed')),
  error text,
  dedupe_key text unique,             -- stops the same reminder going twice
  created_at timestamptz not null default now()
);
create index notifications_account_idx on public.notifications (account_id, created_at desc);
create index notifications_tenant_idx on public.notifications (tenant_id, created_at desc);
alter table public.notifications enable row level security;
create policy "members read notifications" on public.notifications
  for select using (public.is_member(account_id));
create policy "members log notifications" on public.notifications
  for insert with check (public.is_member(account_id));

-- A landlord note the tenant can see is an event too (tenant replies as well, for the landlord).
create or replace function public.trg_note_events()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.author_role = 'landlord' and new.visible_to_tenant then
    perform public.emit_event(new.account_id, 'repair.note', 'repair', new.request_id);
  elsif new.author_role = 'tenant' then
    perform public.emit_event(new.account_id, 'repair.tenant_reply', 'repair', new.request_id);
  end if;
  return null;
end; $$;
create trigger maintenance_notes_events after insert on public.maintenance_notes
  for each row execute function public.trg_note_events();
