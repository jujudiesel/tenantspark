/**
 * The API reference, as data. The /developers page renders this, and it's the one place to update
 * when an endpoint changes. Keep examples real: they're what people copy.
 */
import { EVENT_TYPES } from "./objects";

export type Param = { name: string; in: "query" | "path" | "body"; type: string; required?: boolean; description: string };
export type Endpoint = {
  id: string;
  method: "GET" | "POST" | "DELETE";
  path: string;
  title: string;
  description: string;
  params?: Param[];
  body?: Record<string, unknown>;
  response: unknown;
};
export type Resource = { id: string; title: string; description: string; endpoints: Endpoint[] };

const ids = {
  property: "0b2e9c2e-7d7b-4f2a-9b4e-1a2b3c4d5e01",
  unit: "0b2e9c2e-7d7b-4f2a-9b4e-1a2b3c4d5e02",
  tenant: "0b2e9c2e-7d7b-4f2a-9b4e-1a2b3c4d5e03",
  lease: "0b2e9c2e-7d7b-4f2a-9b4e-1a2b3c4d5e04",
  charge: "0b2e9c2e-7d7b-4f2a-9b4e-1a2b3c4d5e05",
  payment: "0b2e9c2e-7d7b-4f2a-9b4e-1a2b3c4d5e06",
  repair: "0b2e9c2e-7d7b-4f2a-9b4e-1a2b3c4d5e07",
  expense: "0b2e9c2e-7d7b-4f2a-9b4e-1a2b3c4d5e08",
  hook: "0b2e9c2e-7d7b-4f2a-9b4e-1a2b3c4d5e09",
  event: "0b2e9c2e-7d7b-4f2a-9b4e-1a2b3c4d5e10",
  category: "0b2e9c2e-7d7b-4f2a-9b4e-1a2b3c4d5e11",
};
const property = { id: ids.property, name: "1420 Maple St" };
const propertyFull = { id: ids.property, name: "1420 Maple St", address: "1420 Maple St, Detroit, MI 48202" };
const unit = { id: ids.unit, label: "Whole home" };
const tenants = [{ id: ids.tenant, name: "Dana Whitfield", email: "dana@example.com", phone: "313-555-0141", primary: true }];

const listParams: Param[] = [
  { name: "limit", in: "query", type: "integer", description: "How many to return. Default 50, max 200." },
  { name: "since", in: "query", type: "ISO 8601 time", description: "Only records created after this time." },
];
const filter = (name: string, description: string): Param => ({ name, in: "query", type: "string", description });

const examples = {
  property: { id: ids.property, name: "1420 Maple St", address: "1420 Maple St, Detroit, MI 48202", address_line1: "1420 Maple St", address_line2: null, city: "Detroit", state: "MI", zip: "48202", type: "single_family", unit_count: 1, notes: null, created_at: "2026-06-01T15:02:11Z" },
  unit: { id: ids.unit, label: "Whole home", bedrooms: 3, bathrooms: 1.5, square_feet: 1420, market_rent: 1400, property, notes: null, created_at: "2026-06-01T15:02:11Z" },
  tenant: { id: ids.tenant, name: "Dana Whitfield", email: "dana@example.com", phone: "313-555-0141", portal: "signed_up", lease_id: ids.lease, unit, property, notes: null, created_at: "2026-06-01T15:10:40Z" },
  lease: { id: ids.lease, status: "active", start_date: "2026-06-01", end_date: "2027-05-31", rent: 1400, deposit: 1400, rent_due_day: 1, unit, property: propertyFull, tenants, notes: null, created_at: "2026-06-01T15:12:00Z" },
  charge: { id: ids.charge, description: "November 2026 rent", period: "2026-11", due_date: "2026-11-01", amount: 1400, late_fee: 0, paid: 1400, balance: 0, status: "paid", lease_id: ids.lease, unit, property, tenants, created_at: "2026-11-01T11:00:02Z" },
  payment: { id: ids.payment, amount: 1400, fee: 0, method: "check", status: "succeeded", paid_at: "2026-11-03T12:00:00Z", note: "Check #1042", failure_message: null, charge_id: ids.charge, lease_id: ids.lease, tenant: { id: ids.tenant, name: "Dana Whitfield", email: "dana@example.com" }, unit, property, created_at: "2026-11-03T18:22:09Z" },
  repair: { id: ids.repair, title: "Kitchen faucet leaking", description: "Drips under the sink all day.", location: "Kitchen", urgency: "urgent", status: "scheduled", permission_to_enter: true, assigned_to: "Joe's Plumbing", scheduled_for: "2026-11-18", cost: null, done_at: null, tenant: { id: ids.tenant, name: "Dana Whitfield", email: "dana@example.com", phone: "313-555-0141" }, unit, property, created_at: "2026-11-15T20:41:33Z", updated_at: "2026-11-16T14:03:10Z" },
  expense: { id: ids.expense, kind: "expense", amount: 142.5, date: "2026-11-12", category: { id: ids.category, name: "Utilities" }, vendor: "DTE Energy", memo: "November gas", has_receipt: true, repair_id: null, unit: null, property, created_at: "2026-11-12T16:40:00Z" },
};

export const RESOURCES: Resource[] = [
  {
    id: "account",
    title: "Account",
    description: "Who the key belongs to.",
    endpoints: [
      { id: "get-me", method: "GET", path: "/api/v1/me", title: "Get your account", description: "The account the API key belongs to, with counts. Good first call to check a key.", response: { data: { id: "0b2e9c2e-7d7b-4f2a-9b4e-1a2b3c4d5e00", name: "Hale Properties", properties: 4, units: 4, tenants: 3, created_at: "2026-06-01T15:00:00Z" } } },
    ],
  },
  {
    id: "properties",
    title: "Properties",
    description: "Buildings and houses. Each one has one or more units.",
    endpoints: [
      { id: "list-properties", method: "GET", path: "/api/v1/properties", title: "List properties", description: "Every property on the account, newest first.", params: listParams, response: { data: [examples.property] } },
    ],
  },
  {
    id: "units",
    title: "Units",
    description: "A rentable space. A single-family house is one unit.",
    endpoints: [
      { id: "list-units", method: "GET", path: "/api/v1/units", title: "List units", description: "Units with their property.", params: [...listParams, filter("property_id", "Only units in this property.")], response: { data: [examples.unit] } },
    ],
  },
  {
    id: "tenants",
    title: "Tenants",
    description: "People who rent from you. A tenant's current unit comes from their active lease.",
    endpoints: [
      { id: "list-tenants", method: "GET", path: "/api/v1/tenants", title: "List tenants", description: "Tenants with portal status and their current lease, unit and property.", params: listParams, response: { data: [examples.tenant] } },
      { id: "create-tenant", method: "POST", path: "/api/v1/tenants", title: "Create a tenant", description: "Adds a tenant. Put them on a lease and invite them from the app, or wait for those endpoints.", params: [
        { name: "name", in: "body", type: "string", required: true, description: "Full name." },
        { name: "email", in: "body", type: "string", description: "Email address. Used for the portal invite." },
        { name: "phone", in: "body", type: "string", description: "Phone number." },
        { name: "notes", in: "body", type: "string", description: "Anything you want to remember." },
      ], body: { name: "Dana Whitfield", email: "dana@example.com", phone: "313-555-0141" }, response: { data: { ...examples.tenant, portal: "not_invited", lease_id: null, unit: null, property: null } } },
    ],
  },
  {
    id: "leases",
    title: "Leases",
    description: "Who lives where, for how much, and for how long.",
    endpoints: [
      { id: "list-leases", method: "GET", path: "/api/v1/leases", title: "List leases", description: "Leases with tenants, unit and property.", params: [...listParams, filter("status", "active, draft or ended."), filter("unit_id", "Only leases on this unit.")], response: { data: [examples.lease] } },
    ],
  },
  {
    id: "charges",
    title: "Rent charges",
    description: "One per lease per month. Balance is what's still owed, including late fees.",
    endpoints: [
      { id: "list-charges", method: "GET", path: "/api/v1/charges", title: "List rent charges", description: "Charges, newest due date first.", params: [...listParams, filter("status", "due, partial, paid or void."), filter("lease_id", "Only this lease."), filter("period_start", "A month, as YYYY-MM-01.")], response: { data: [examples.charge] } },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    description: "Money received against a charge: online through the portal, or recorded by hand.",
    endpoints: [
      { id: "list-payments", method: "GET", path: "/api/v1/payments", title: "List payments", description: "Payments with tenant, unit and property. fee is the convenience fee the tenant paid on top.", params: [...listParams, filter("status", "pending, succeeded, failed or refunded."), filter("method", "ach, card, cash, check or other."), filter("lease_id", "Only this lease."), filter("tenant_id", "Only this tenant.")], response: { data: [examples.payment] } },
      { id: "record-payment", method: "POST", path: "/api/v1/payments", title: "Record a payment", description: "Logs a payment made outside TenantSpark (cash, check, Venmo, anything). Online payments can only come through the tenant portal.", params: [
        { name: "charge_id", in: "body", type: "uuid", description: "The charge this pays. Or give lease_id and the oldest open charge is used." },
        { name: "lease_id", in: "body", type: "uuid", description: "Alternative to charge_id." },
        { name: "amount", in: "body", type: "number", required: true, description: "Dollars." },
        { name: "method", in: "body", type: "string", required: true, description: "cash, check or other." },
        { name: "paid_on", in: "body", type: "YYYY-MM-DD", description: "Defaults to today." },
        { name: "note", in: "body", type: "string", description: "Check number, who handed it over, etc." },
      ], body: { lease_id: ids.lease, amount: 1400, method: "check", paid_on: "2026-11-03", note: "Check #1042" }, response: { data: examples.payment } },
    ],
  },
  {
    id: "maintenance",
    title: "Repair requests",
    description: "Maintenance requests from tenants or logged by the landlord, tracked to done.",
    endpoints: [
      { id: "list-maintenance", method: "GET", path: "/api/v1/maintenance", title: "List repair requests", description: "Requests with tenant, unit and property.", params: [...listParams, filter("status", "new, scheduled, in_progress, done or closed."), filter("urgency", "routine, urgent or emergency."), filter("property_id", "Only this property."), filter("unit_id", "Only this unit.")], response: { data: [examples.repair] } },
      { id: "create-maintenance", method: "POST", path: "/api/v1/maintenance", title: "Open a repair request", description: "Creates a request. If the unit has a tenant on an active lease, they see it in their portal.", params: [
        { name: "title", in: "body", type: "string", required: true, description: "What's wrong, in a few words." },
        { name: "unit_id", in: "body", type: "uuid", description: "The unit. Required unless property_id is given." },
        { name: "property_id", in: "body", type: "uuid", description: "For common areas, when there's no unit." },
        { name: "description", in: "body", type: "string", description: "Details." },
        { name: "location", in: "body", type: "string", description: "Kitchen, Bathroom, Bedroom, Living room, Basement, Outside, Shared area, Somewhere else." },
        { name: "urgency", in: "body", type: "string", description: "routine (default), urgent or emergency." },
        { name: "assigned_to", in: "body", type: "string", description: "Who's handling it." },
        { name: "permission_to_enter", in: "body", type: "boolean", description: "Okay to enter when the tenant is out." },
      ], body: { title: "Kitchen faucet leaking", unit_id: ids.unit, urgency: "urgent", location: "Kitchen", description: "Drips under the sink all day." }, response: { data: { ...examples.repair, status: "new", assigned_to: null, scheduled_for: null } } },
    ],
  },
  {
    id: "expenses",
    title: "Expenses and income",
    description: "The books. Manual entries only; rent payments are under Payments. Repair costs show up here automatically when a request is marked done.",
    endpoints: [
      { id: "list-expenses", method: "GET", path: "/api/v1/expenses", title: "List entries", description: "Income and expense entries, newest date first.", params: [...listParams, filter("kind", "expense or income."), filter("property_id", "Only this property."), filter("unit_id", "Only this unit."), filter("category_id", "Only this category.")], response: { data: [examples.expense] } },
      { id: "create-expense", method: "POST", path: "/api/v1/expenses", title: "Record an expense or income", description: "Adds an entry to the books.", params: [
        { name: "amount", in: "body", type: "number", required: true, description: "Dollars." },
        { name: "kind", in: "body", type: "string", description: "expense (default) or income." },
        { name: "date", in: "body", type: "YYYY-MM-DD", description: "Defaults to today." },
        { name: "category", in: "body", type: "string", description: "Category name, like Utilities. Or pass category_id." },
        { name: "category_id", in: "body", type: "uuid", description: "From GET /api/v1/categories." },
        { name: "property_id", in: "body", type: "uuid", description: "Which property. Leave out for a portfolio-wide cost." },
        { name: "unit_id", in: "body", type: "uuid", description: "Which unit, if it's unit-specific." },
        { name: "vendor", in: "body", type: "string", description: "Who was paid (or who paid you)." },
        { name: "memo", in: "body", type: "string", description: "A note." },
      ], body: { amount: 142.5, date: "2026-11-12", category: "Utilities", property_id: ids.property, vendor: "DTE Energy", memo: "November gas" }, response: { data: { ...examples.expense, has_receipt: false } } },
      { id: "list-categories", method: "GET", path: "/api/v1/categories", title: "List categories", description: "Income and expense categories for this account. Matches the IRS Schedule E lines out of the box.", response: { data: [{ id: ids.category, kind: "expense", name: "Utilities", archived: false }, { id: "0b2e9c2e-7d7b-4f2a-9b4e-1a2b3c4d5e12", kind: "income", name: "Rent", archived: false }] } },
    ],
  },
  {
    id: "events",
    title: "Events",
    description: "Everything that happens, as a feed. Poll this, or subscribe with a webhook.",
    endpoints: [
      { id: "list-events", method: "GET", path: "/api/v1/events", title: "List events", description: "Recent events with the full object attached under its type (charge, payment, repair, ...).", params: [{ name: "limit", in: "query", type: "integer", description: "Default 25, max 100." }, filter("type", "One event type, like rent.paid."), { name: "since", in: "query", type: "ISO 8601 time", description: "Only events after this time." }], response: { data: [{ id: ids.event, type: "rent.paid", created_at: "2026-11-03T18:22:10Z", charge: examples.charge }] } },
    ],
  },
  {
    id: "webhooks",
    title: "Webhooks",
    description: "We POST to your URL when something happens. Each delivery is signed. Failed deliveries are retried daily for up to 3 days.",
    endpoints: [
      { id: "list-hooks", method: "GET", path: "/api/v1/hooks", title: "List subscriptions", description: "Active webhook subscriptions on this account.", response: { data: [{ id: ids.hook, url: "https://example.com/hooks/tenantspark", event_type: "rent.paid", source: "api", active: true, created_at: "2026-11-10T09:00:00Z" }] } },
      { id: "create-hook", method: "POST", path: "/api/v1/hooks", title: "Subscribe", description: "Subscribes a URL to one event type, or * for everything. The secret in the response signs every delivery: X-TenantSpark-Signature is sha256=HMAC-SHA256(raw body, secret). Reply 2xx within 10 seconds. Reply 410 to unsubscribe.", params: [
        { name: "url", in: "body", type: "https URL", required: true, description: "Where to POST." },
        { name: "event", in: "body", type: "string", required: true, description: "An event type, or *." },
      ], body: { url: "https://example.com/hooks/tenantspark", event: "rent.paid" }, response: { data: { id: ids.hook, url: "https://example.com/hooks/tenantspark", event_type: "rent.paid", created_at: "2026-11-10T09:00:00Z", secret: "whsec_8f2c…" } } },
      { id: "delete-hook", method: "DELETE", path: "/api/v1/hooks/{id}", title: "Unsubscribe", description: "Stops deliveries to that subscription.", params: [{ name: "id", in: "path", type: "uuid", required: true, description: "Subscription id." }], response: { data: { id: ids.hook, active: false } } },
      { id: "sample-hook", method: "GET", path: "/api/v1/hooks/sample", title: "Sample payloads", description: "Up to three real recent payloads for an event type, exactly as a webhook would deliver them. Zapier uses this for its test step.", params: [{ name: "event", in: "query", type: "string", required: true, description: "An event type." }], response: { data: [{ id: ids.event, type: "repair.created", created_at: "2026-11-15T20:41:34Z", repair: examples.repair }] } },
    ],
  },
];

export const EVENT_LIST = Object.entries(EVENT_TYPES).map(([type, d]) => ({ type, object: d.object, description: d.description }));

export const WEBHOOK_EXAMPLE = {
  id: ids.event,
  type: "rent.paid",
  created_at: "2026-11-03T18:22:10Z",
  charge: examples.charge,
};
