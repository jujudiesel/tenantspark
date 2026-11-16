import type { adminClient } from "@/lib/supabase/admin";

type Db = ReturnType<typeof adminClient>;

const dollars = (cents: number | null | undefined) => (cents == null ? null : Math.round(cents) / 100);

// Column lists shared by list endpoints, event payloads and Zapier samples, so every object looks the same everywhere.
export const SELECT = {
  property: "id, name, address_line1, address_line2, city, state, zip, property_type, notes, created_at, units(id)",
  unit: "id, label, bedrooms, bathrooms, square_feet, market_rent_cents, notes, created_at, properties(id, name)",
  tenant: "id, full_name, email, phone, notes, user_id, invited_at, created_at, lease_tenants(is_primary, leases(id, status, units(id, label, properties(id, name))))",
  lease:
    "id, status, start_date, end_date, rent_cents, deposit_cents, rent_due_day, notes, created_at, units(id, label, properties(id, name, address_line1, city, state, zip)), lease_tenants(is_primary, tenants(id, full_name, email, phone))",
  charge:
    "id, period_start, due_date, amount_cents, late_fee_cents, paid_cents, status, description, created_at, leases(id, units(id, label, properties(id, name)), lease_tenants(is_primary, tenants(id, full_name, email)))",
  payment:
    "id, amount_cents, fee_cents, method, status, paid_at, note, failure_message, created_at, charge_id, tenants(id, full_name, email), leases(id, units(id, label, properties(id, name)))",
  repair:
    "id, title, description, location, urgency, status, permission_to_enter, assigned_to, scheduled_for, cost_cents, done_at, created_at, updated_at, tenants(id, full_name, email, phone), units(id, label), properties(id, name)",
  document: "id, title, status, sent_at, signed_at, created_at, leases(id, units(id, label, properties(id, name)), lease_tenants(is_primary, tenants(id, full_name, email)))",
} as const;

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const unitOf = (u: Any | null) => (u ? { id: u.id, label: u.label } : null);
const propertyOf = (p: Any | null) =>
  p ? { id: p.id, name: p.name, ...(p.address_line1 ? { address: `${p.address_line1}, ${p.city}, ${p.state} ${p.zip}` } : {}) } : null;
const tenantsOf = (lts: Any[] | null | undefined) =>
  (lts ?? [])
    .filter((lt) => lt.tenants)
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
    .map((lt) => ({ id: lt.tenants.id, name: lt.tenants.full_name, email: lt.tenants.email ?? null, phone: lt.tenants.phone ?? null, primary: Boolean(lt.is_primary) }));

export const shape = {
  property: (p: Any) => ({
    id: p.id,
    name: p.name,
    address: `${p.address_line1}${p.address_line2 ? `, ${p.address_line2}` : ""}, ${p.city}, ${p.state} ${p.zip}`,
    address_line1: p.address_line1,
    address_line2: p.address_line2 ?? null,
    city: p.city,
    state: p.state,
    zip: p.zip,
    type: p.property_type,
    unit_count: (p.units ?? []).length,
    notes: p.notes ?? null,
    created_at: p.created_at,
  }),
  unit: (u: Any) => ({
    id: u.id,
    label: u.label,
    bedrooms: u.bedrooms == null ? null : Number(u.bedrooms),
    bathrooms: u.bathrooms == null ? null : Number(u.bathrooms),
    square_feet: u.square_feet ?? null,
    market_rent: dollars(u.market_rent_cents),
    property: propertyOf(u.properties),
    notes: u.notes ?? null,
    created_at: u.created_at,
  }),
  tenant: (t: Any) => {
    const active = (t.lease_tenants ?? []).map((lt: Any) => lt.leases).find((l: Any) => l?.status === "active");
    return {
      id: t.id,
      name: t.full_name,
      email: t.email ?? null,
      phone: t.phone ?? null,
      portal: t.user_id ? "signed_up" : t.invited_at ? "invited" : "not_invited",
      lease_id: active?.id ?? null,
      unit: unitOf(active?.units ?? null),
      property: propertyOf(active?.units?.properties ?? null),
      notes: t.notes ?? null,
      created_at: t.created_at,
    };
  },
  lease: (l: Any) => ({
    id: l.id,
    status: l.status,
    start_date: l.start_date,
    end_date: l.end_date ?? null,
    rent: dollars(l.rent_cents),
    deposit: dollars(l.deposit_cents),
    rent_due_day: l.rent_due_day ?? 1,
    unit: unitOf(l.units),
    property: propertyOf(l.units?.properties ?? null),
    tenants: tenantsOf(l.lease_tenants),
    notes: l.notes ?? null,
    created_at: l.created_at,
  }),
  charge: (c: Any) => {
    const balance = c.amount_cents + c.late_fee_cents - c.paid_cents;
    return {
      id: c.id,
      description: c.description ?? null,
      period: c.period_start?.slice(0, 7) ?? null,
      due_date: c.due_date,
      amount: dollars(c.amount_cents),
      late_fee: dollars(c.late_fee_cents),
      paid: dollars(c.paid_cents),
      balance: dollars(Math.max(0, balance)),
      status: c.status,
      lease_id: c.leases?.id ?? null,
      unit: unitOf(c.leases?.units ?? null),
      property: propertyOf(c.leases?.units?.properties ?? null),
      tenants: tenantsOf(c.leases?.lease_tenants),
      created_at: c.created_at,
    };
  },
  payment: (p: Any) => ({
    id: p.id,
    amount: dollars(p.amount_cents),
    fee: dollars(p.fee_cents),
    method: p.method,
    status: p.status,
    paid_at: p.paid_at ?? null,
    note: p.note ?? null,
    failure_message: p.failure_message ?? null,
    charge_id: p.charge_id ?? null,
    lease_id: p.leases?.id ?? null,
    tenant: p.tenants ? { id: p.tenants.id, name: p.tenants.full_name, email: p.tenants.email ?? null } : null,
    unit: unitOf(p.leases?.units ?? null),
    property: propertyOf(p.leases?.units?.properties ?? null),
    created_at: p.created_at,
  }),
  repair: (r: Any) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    location: r.location ?? null,
    urgency: r.urgency,
    status: r.status,
    permission_to_enter: Boolean(r.permission_to_enter),
    assigned_to: r.assigned_to ?? null,
    scheduled_for: r.scheduled_for ?? null,
    cost: dollars(r.cost_cents),
    done_at: r.done_at ?? null,
    tenant: r.tenants ? { id: r.tenants.id, name: r.tenants.full_name, email: r.tenants.email ?? null, phone: r.tenants.phone ?? null } : null,
    unit: unitOf(r.units),
    property: propertyOf(r.properties),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }),
  document: (d: Any) => ({
    id: d.id,
    title: d.title,
    status: d.status,
    sent_at: d.sent_at ?? null,
    signed_at: d.signed_at ?? null,
    lease_id: d.leases?.id ?? null,
    unit: unitOf(d.leases?.units ?? null),
    property: propertyOf(d.leases?.units?.properties ?? null),
    tenants: tenantsOf(d.leases?.lease_tenants),
    created_at: d.created_at,
  }),
};

export const TABLE: Record<keyof typeof SELECT, string> = {
  property: "properties",
  unit: "units",
  tenant: "tenants",
  lease: "leases",
  charge: "rent_charges",
  payment: "payments",
  repair: "maintenance_requests",
  document: "lease_documents",
};

export type ObjectType = keyof typeof SELECT;

/** Loads one object in API shape. Null if it's gone or belongs to another account. */
export async function loadObject(db: Db, type: ObjectType, id: string, accountId?: string) {
  // Loose typing on purpose: the select strings are too varied for Supabase's inference to follow.
  const table = db.from(TABLE[type]) as unknown as { select: (s: string) => Any };
  let q = table.select(SELECT[type]).eq("id", id);
  if (accountId) q = q.eq("account_id", accountId);
  const { data } = (await q.maybeSingle()) as { data: Any | null };
  return data ? (shape[type] as (x: Any) => unknown)(data) : null;
}

export const EVENT_TYPES: Record<string, { object: ObjectType; label: string; description: string }> = {
  "tenant.created": { object: "tenant", label: "New tenant", description: "A tenant was added." },
  "tenant.signed_up": { object: "tenant", label: "Tenant joined the portal", description: "A tenant created their portal login." },
  "lease.created": { object: "lease", label: "New lease", description: "A lease was created." },
  "lease.started": { object: "lease", label: "Lease started", description: "A lease became active." },
  "lease.ended": { object: "lease", label: "Lease ended", description: "A lease was ended." },
  "lease.signed": { object: "document", label: "Lease signed", description: "Every tenant signed a lease document." },
  "document.sent": { object: "document", label: "Document sent for signature", description: "A document was sent to tenants to sign." },
  "rent.charged": { object: "charge", label: "Rent charged", description: "A rent charge was created." },
  "rent.paid": { object: "charge", label: "Rent paid in full", description: "A rent charge was paid off." },
  "rent.late": { object: "charge", label: "Rent late", description: "Rent is past due after the grace period." },
  "rent.late_fee_added": { object: "charge", label: "Late fee added", description: "A late fee was added to a charge." },
  "payment.received": { object: "payment", label: "Payment received", description: "A payment succeeded (online or recorded by hand)." },
  "payment.failed": { object: "payment", label: "Payment failed", description: "An online payment failed." },
  "repair.created": { object: "repair", label: "New repair request", description: "A repair request was opened." },
  "repair.updated": { object: "repair", label: "Repair status changed", description: "A repair request moved to a new status." },
  "repair.done": { object: "repair", label: "Repair done", description: "A repair request was marked done or closed." },
};
