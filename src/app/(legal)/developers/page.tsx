import Link from "next/link";
import { EVENT_TYPES } from "@/lib/api/objects";

export const metadata = { title: "API docs", description: "TenantSpark REST API and webhooks." };

const Code = ({ children }: { children: string }) => (
  <pre className="text-[13px] leading-relaxed px-4 py-3 rounded-lg bg-page border border-line overflow-x-auto whitespace-pre"><code>{children}</code></pre>
);

const endpoints: { method: string; path: string; what: string; params?: string }[] = [
  { method: "GET", path: "/api/v1/me", what: "Your account and counts." },
  { method: "GET", path: "/api/v1/properties", what: "Properties." },
  { method: "GET", path: "/api/v1/units", what: "Units.", params: "property_id" },
  { method: "GET", path: "/api/v1/tenants", what: "Tenants with their current unit." },
  { method: "POST", path: "/api/v1/tenants", what: "Add a tenant.", params: "name (required), email, phone, notes" },
  { method: "GET", path: "/api/v1/leases", what: "Leases with tenants, unit and property.", params: "status, unit_id" },
  { method: "GET", path: "/api/v1/charges", what: "Rent charges with balance.", params: "status (due|partial|paid|void), lease_id, period_start (YYYY-MM-01)" },
  { method: "GET", path: "/api/v1/payments", what: "Payments, online and recorded.", params: "status, method, lease_id, tenant_id" },
  { method: "POST", path: "/api/v1/payments", what: "Record a cash, check or other payment.", params: "charge_id or lease_id, amount (dollars), method (cash|check|other), paid_on (YYYY-MM-DD), note" },
  { method: "GET", path: "/api/v1/maintenance", what: "Repair requests.", params: "status, urgency, property_id, unit_id" },
  { method: "POST", path: "/api/v1/maintenance", what: "Open a repair request.", params: "title (required), unit_id or property_id, description, location, urgency, assigned_to, permission_to_enter" },
  { method: "GET", path: "/api/v1/events", what: "Recent events with their objects. For polling.", params: "type, since (ISO time)" },
  { method: "GET", path: "/api/v1/hooks", what: "Your webhook subscriptions." },
  { method: "POST", path: "/api/v1/hooks", what: "Subscribe a URL to an event.", params: "url (https), event (an event type, or * for all)" },
  { method: "DELETE", path: "/api/v1/hooks/:id", what: "Unsubscribe." },
  { method: "GET", path: "/api/v1/hooks/sample", what: "Example payloads for an event, from your real data.", params: "event" },
];

export default function DevelopersPage() {
  return (
    <>
      <h1>API and webhooks</h1>
      <p>
        Everything in TenantSpark is reachable over a plain REST API, and anything that happens can be sent to a URL you choose.
        Zapier uses this same API. Make a key under <Link href="/settings/integrations" className="font-semibold text-link">Settings, Integrations</Link>.
      </p>

      <h2>Authentication</h2>
      <p>Send your key in the Authorization header. Every request must use HTTPS.</p>
      <Code>{`curl https://tenantspark.com/api/v1/me \\
  -H "Authorization: Bearer ts_live_..."`}</Code>
      <p>Responses are JSON. Lists come back as <code>{`{ "data": [...] }`}</code>, single objects as <code>{`{ "data": {...} }`}</code>, errors as <code>{`{ "error": { "message": "..." } }`}</code>. Money is in dollars (<code>1250.5</code>), dates are <code>YYYY-MM-DD</code>, times are ISO 8601.</p>
      <p>Lists take <code>?limit=</code> (default 50, max 200) and <code>?since=</code> (ISO time) to get only newer records. Newest first.</p>

      <h2>Endpoints</h2>
      <div className="flex flex-col divide-y divide-line-2 border-y border-line-2">
        {endpoints.map((e) => (
          <div key={e.method + e.path} className="py-3 flex flex-col gap-1">
            <div className="flex items-baseline gap-3">
              <span className={`text-[12px] font-bold w-14 ${e.method === "GET" ? "text-green-ink" : e.method === "DELETE" ? "text-red-ink" : "text-link"}`}>{e.method}</span>
              <code className="text-[14px] text-ink">{e.path}</code>
            </div>
            <p className="pl-[68px] text-[15px] m-0">{e.what}{e.params ? <span className="text-muted"> Params: {e.params}.</span> : null}</p>
          </div>
        ))}
      </div>

      <h2>Webhooks</h2>
      <p>Subscribe a URL and we POST to it when something happens. Each delivery looks like this:</p>
      <Code>{`{
  "id": "evt_uuid",
  "type": "rent.paid",
  "created_at": "2026-11-16T17:03:11Z",
  "charge": {
    "id": "...", "description": "November 2026 rent", "period": "2026-11",
    "due_date": "2026-11-01", "amount": 1200, "late_fee": 0, "paid": 1200, "balance": 0,
    "status": "paid", "lease_id": "...",
    "unit": { "id": "...", "label": "Unit 2" },
    "property": { "id": "...", "name": "14 Fix St" },
    "tenants": [{ "id": "...", "name": "Dana Ortiz", "email": "dana@example.com", "primary": true }]
  }
}`}</Code>
      <p>
        The object key matches the event: <code>tenant</code>, <code>lease</code>, <code>document</code>, <code>charge</code>, <code>payment</code> or <code>repair</code>.
        Deliveries carry <code>X-TenantSpark-Event</code> and <code>X-TenantSpark-Signature: sha256=&lt;HMAC-SHA256 of the raw body, keyed with your subscription secret&gt;</code>. Reply with any 2xx within 10 seconds. We retry failed deliveries for up to 3 days. Reply 410 and we remove the subscription.
      </p>

      <h2>Event types</h2>
      <div className="flex flex-col divide-y divide-line-2 border-y border-line-2">
        {Object.entries(EVENT_TYPES).map(([type, def]) => (
          <div key={type} className="py-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
            <code className="text-[14px] text-ink w-52">{type}</code>
            <span className="text-[15px]">{def.description}</span>
          </div>
        ))}
      </div>

      <h2>Limits</h2>
      <p>Be reasonable: a few requests a second is fine. Keys can be revoked any time from Settings. Questions: hello@tenantspark.com.</p>
    </>
  );
}
