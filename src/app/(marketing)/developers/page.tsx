import Link from "next/link";
import { RESOURCES, EVENT_LIST, WEBHOOK_EXAMPLE, type Endpoint, type Param } from "@/lib/api/spec";
import { KeyBar, TryIt } from "@/components/developers/try-it";
import { DocsNav } from "@/components/developers/docs-nav";

export const metadata = {
  title: "API reference",
  description: "The TenantSpark REST API and webhooks: properties, units, tenants, leases, rent, payments, repairs, expenses and events.",
};

const BASE = "https://tenantspark.com";

const Code = ({ children, title }: { children: string; title?: string }) => (
  <div className="self-start w-full rounded-xl overflow-hidden border border-navy-3 bg-navy text-[12.5px] leading-[1.6]">
    {title ? <div className="px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55 border-b border-white/10">{title}</div> : null}
    <pre className="px-3.5 py-3 overflow-x-auto whitespace-pre text-[#dfe7f5]"><code>{children}</code></pre>
  </div>
);

const Method = ({ m, big = false }: { m: string; big?: boolean }) => (
  <span
    className={`inline-flex items-center rounded-md font-bold ${big ? "text-[12px] px-2 h-6" : "text-[11px] px-1.5 h-5"} ${
      m === "GET" ? "bg-green-bg text-green-ink" : m === "DELETE" ? "bg-red-bg text-red-ink" : "bg-blue-bg text-blue-ink"
    }`}
  >
    {m}
  </span>
);

function curlFor(e: Endpoint) {
  const q = (e.params ?? []).filter((p) => p.in === "query" && p.required);
  let path = e.path.replace(/\{(\w+)\}/g, "ID");
  if (q.length) path += `?${q.map((p) => `${p.name}=${p.name === "event" ? "rent.paid" : "VALUE"}`).join("&")}`;
  const lines = [`curl ${e.method === "GET" ? "" : `-X ${e.method} `}${BASE}${path} \\`, `  -H "Authorization: Bearer ts_live_..."`];
  if (e.body) {
    lines[lines.length - 1] += " \\";
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '${JSON.stringify(e.body)}'`);
  }
  return lines.join("\n");
}

function Params({ params, where, title }: { params: Param[]; where: Param["in"]; title: string }) {
  const list = params.filter((p) => p.in === where);
  if (!list.length) return null;
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-[12px] font-bold uppercase tracking-[0.06em] text-muted">{title}</h4>
      <dl className="divide-y divide-line-2 border-y border-line-2">
        {list.map((p) => (
          <div key={p.name} className="py-2 grid grid-cols-[minmax(0,150px)_1fr] gap-x-3 gap-y-0.5 text-[14px]">
            <dt className="flex flex-col">
              <code className="text-ink font-semibold break-all">{p.name}</code>
              <span className="text-[12px] text-muted">{p.type}{p.required ? <span className="text-red-ink font-semibold"> required</span> : null}</span>
            </dt>
            <dd className="text-ink-2 m-0">{p.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function EndpointBlock({ e }: { e: Endpoint }) {
  const params = e.params ?? [];
  return (
    <article id={e.id} className="scroll-mt-8 grid gap-6 lg:grid-cols-2 py-8 border-t border-line">
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex flex-col gap-2">
          <h3 className="text-[20px] font-semibold leading-tight">
            <a href={`#${e.id}`} className="hover:underline">{e.title}</a>
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Method m={e.method} big />
            <code className="text-[14px] text-ink break-all">{e.path}</code>
          </div>
          <p className="text-[15px] text-ink-2 leading-relaxed m-0">{e.description}</p>
        </div>
        <Params params={params} where="path" title="Path" />
        <Params params={params} where="query" title="Query" />
        <Params params={params} where="body" title="Body (JSON)" />
        <TryIt method={e.method} path={e.path} params={params} body={e.body} />
      </div>
      <div className="flex flex-col gap-3 min-w-0 lg:sticky lg:top-6 lg:self-start">
        <Code title="Request">{curlFor(e)}</Code>
        <Code title={`Response ${e.method === "POST" ? "201" : "200"}`}>{JSON.stringify(e.response, null, 2)}</Code>
      </div>
    </article>
  );
}

const GUIDE = [
  { id: "intro", title: "Getting started" },
  { id: "auth", title: "Authentication" },
  { id: "format", title: "Responses and errors" },
  { id: "lists", title: "Lists and filtering" },
];
const WEBHOOK_GUIDE = [
  { id: "webhooks-how", title: "How webhooks work" },
  { id: "webhooks-verify", title: "Verifying signatures" },
  { id: "event-types", title: "Event types" },
];

export default function DevelopersPage() {
  const navGroups = [
    { id: "guide", title: "Guide", items: GUIDE },
    ...RESOURCES.map((r) => ({ id: r.id, title: r.title, items: r.endpoints.map((e) => ({ id: e.id, method: e.method, title: e.title })) })),
    { id: "webhooks-guide", title: "Webhooks guide", items: WEBHOOK_GUIDE },
  ];

  return (
    <div className="bg-white">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-10 lg:py-14 grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-3">
            <DocsNav groups={navGroups} />
          </aside>

          <div className="min-w-0 flex flex-col">
            <header id="guide" className="scroll-mt-8 flex flex-col gap-4 pb-8">
              <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-link">Developers</p>
              <h1 className="font-display font-semibold text-[38px] sm:text-[48px] leading-[1.05] tracking-[-0.3px]">API reference</h1>
              <p className="text-[17px] text-ink-2 leading-relaxed max-w-[640px] m-0">
                Everything in TenantSpark is reachable over a plain REST API, and anything that happens can be pushed to a URL you choose.
                Zapier runs on this same API. Read along, or paste a key and run the examples against your account.
              </p>
              <KeyBar />
            </header>

            <section id="intro" className="scroll-mt-8 grid gap-6 lg:grid-cols-2 py-8 border-t border-line">
              <div className="flex flex-col gap-3 text-[15px] text-ink-2 leading-relaxed">
                <h2 className="text-[24px] font-semibold text-ink leading-tight">Getting started</h2>
                <p className="m-0">Base URL: <code className="text-ink">{BASE}/api/v1</code>. HTTPS only.</p>
                <ol className="list-decimal pl-5 flex flex-col gap-1.5 m-0">
                  <li>Make a key under <Link href="/settings/integrations" className="font-semibold text-link">Settings, Integrations</Link>. You see it once, so copy it then.</li>
                  <li>Call <code className="text-ink">GET /api/v1/me</code> to check it works.</li>
                  <li>Read data with the GET endpoints, write with POST, and subscribe to webhooks for anything you want to react to.</li>
                </ol>
                <p className="m-0">Keys belong to one account and see everything a landlord on that account sees. Revoke a key any time from the same screen.</p>
              </div>
              <Code title="First request">{`curl ${BASE}/api/v1/me \\
  -H "Authorization: Bearer ts_live_..."`}</Code>
            </section>

            <section id="auth" className="scroll-mt-8 grid gap-6 lg:grid-cols-2 py-8 border-t border-line">
              <div className="flex flex-col gap-3 text-[15px] text-ink-2 leading-relaxed">
                <h2 className="text-[24px] font-semibold text-ink leading-tight">Authentication</h2>
                <p className="m-0">Send your key in the <code className="text-ink">Authorization</code> header on every request as a bearer token. Keys start with <code className="text-ink">ts_live_</code>.</p>
                <p className="m-0">A missing or bad key gets a <code className="text-ink">401</code>. Do not put keys in a browser or a mobile app that other people use; keep them on your server.</p>
              </div>
              <Code title="Header">{`Authorization: Bearer ts_live_4f1c...`}</Code>
            </section>

            <section id="format" className="scroll-mt-8 grid gap-6 lg:grid-cols-2 py-8 border-t border-line">
              <div className="flex flex-col gap-3 text-[15px] text-ink-2 leading-relaxed">
                <h2 className="text-[24px] font-semibold text-ink leading-tight">Responses and errors</h2>
                <p className="m-0">Everything is JSON. Lists come back as <code className="text-ink">{`{ "data": [...] }`}</code>, one object as <code className="text-ink">{`{ "data": {...} }`}</code>.</p>
                <ul className="list-disc pl-5 flex flex-col gap-1.5 m-0">
                  <li>Money is in dollars as a number: <code className="text-ink">1250.5</code>.</li>
                  <li>Dates are <code className="text-ink">YYYY-MM-DD</code>. Times are ISO 8601 in UTC.</li>
                  <li>Ids are UUIDs.</li>
                  <li>Related objects are nested, so a payment carries its tenant, unit and property. No second call needed.</li>
                </ul>
                <p className="m-0">Errors use normal HTTP codes: <code className="text-ink">400</code> for a bad request, <code className="text-ink">401</code> for a bad key, <code className="text-ink">404</code> when the id is not on your account, <code className="text-ink">503</code> if the server itself is misconfigured. The body always explains.</p>
              </div>
              <Code title="Error">{`{
  "error": {
    "message": "amount must be a positive number"
  }
}`}</Code>
            </section>

            <section id="lists" className="scroll-mt-8 grid gap-6 lg:grid-cols-2 py-8 border-t border-line">
              <div className="flex flex-col gap-3 text-[15px] text-ink-2 leading-relaxed">
                <h2 className="text-[24px] font-semibold text-ink leading-tight">Lists and filtering</h2>
                <p className="m-0">Every list is newest first and takes two common parameters:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1.5 m-0">
                  <li><code className="text-ink">limit</code>: how many to return. Default 50, max 200.</li>
                  <li><code className="text-ink">since</code>: an ISO time. Only records created after it. The easy way to sync: remember the newest <code className="text-ink">created_at</code> you have seen and pass it next time.</li>
                </ul>
                <p className="m-0">Most lists also take filters such as <code className="text-ink">status</code> or <code className="text-ink">property_id</code>. Each endpoint below lists its own.</p>
              </div>
              <Code title="Example">{`curl "${BASE}/api/v1/payments?status=succeeded&since=2026-11-01T00:00:00Z&limit=100" \\
  -H "Authorization: Bearer ts_live_..."`}</Code>
            </section>

            {RESOURCES.map((r) => (
              <section key={r.id} id={r.id} className="scroll-mt-8 pt-10">
                <div className="flex flex-col gap-2 pb-2">
                  <h2 className="font-display font-semibold text-[30px] leading-tight">{r.title}</h2>
                  <p className="text-[16px] text-ink-2 leading-relaxed max-w-[640px] m-0">{r.description}</p>
                </div>
                {r.endpoints.map((e) => (
                  <EndpointBlock key={e.id} e={e} />
                ))}
              </section>
            ))}

            <section id="webhooks-guide" className="scroll-mt-8 pt-10">
              <div className="flex flex-col gap-2 pb-2">
                <h2 className="font-display font-semibold text-[30px] leading-tight">Webhooks guide</h2>
                <p className="text-[16px] text-ink-2 leading-relaxed max-w-[640px] m-0">Get told when something happens instead of asking. Subscribe with <a href="#create-hook" className="font-semibold text-link">POST /api/v1/hooks</a> or from Settings, Integrations.</p>
              </div>

              <div id="webhooks-how" className="scroll-mt-8 grid gap-6 lg:grid-cols-2 py-8 border-t border-line">
                <div className="flex flex-col gap-3 text-[15px] text-ink-2 leading-relaxed">
                  <h3 className="text-[20px] font-semibold text-ink leading-tight">How webhooks work</h3>
                  <ul className="list-disc pl-5 flex flex-col gap-1.5 m-0">
                    <li>We POST JSON to your URL within a few seconds of the event.</li>
                    <li>The body is the event: <code className="text-ink">id</code>, <code className="text-ink">type</code>, <code className="text-ink">created_at</code>, and the full object under its own key (<code className="text-ink">charge</code>, <code className="text-ink">payment</code>, <code className="text-ink">repair</code>, <code className="text-ink">tenant</code>, <code className="text-ink">lease</code>, <code className="text-ink">document</code> or <code className="text-ink">expense</code>). Same shape as the API returns.</li>
                    <li>Headers: <code className="text-ink">X-TenantSpark-Event</code> (the type), <code className="text-ink">X-TenantSpark-Signature</code>, <code className="text-ink">X-TenantSpark-Delivery</code> (unique per attempt).</li>
                    <li>Reply with any 2xx within 10 seconds. Do the slow work after you reply.</li>
                    <li>Anything else is retried once a day for up to 3 days. Use the event <code className="text-ink">id</code> to ignore a repeat.</li>
                    <li>Reply <code className="text-ink">410</code> and the subscription is removed.</li>
                    <li>Need something to test with? <a href="#sample-hook" className="font-semibold text-link">GET /api/v1/hooks/sample</a> returns real recent payloads.</li>
                  </ul>
                </div>
                <Code title="Delivery body">{JSON.stringify(WEBHOOK_EXAMPLE, null, 2)}</Code>
              </div>

              <div id="webhooks-verify" className="scroll-mt-8 grid gap-6 lg:grid-cols-2 py-8 border-t border-line">
                <div className="flex flex-col gap-3 text-[15px] text-ink-2 leading-relaxed">
                  <h3 className="text-[20px] font-semibold text-ink leading-tight">Verifying signatures</h3>
                  <p className="m-0">When you subscribe you get a <code className="text-ink">secret</code> once. Each delivery is signed with it: <code className="text-ink">X-TenantSpark-Signature: sha256=HEX</code>, where HEX is the HMAC-SHA256 of the raw request body.</p>
                  <p className="m-0">Compute the same HMAC over the raw bytes (before any JSON parsing) and compare with a constant-time check. Reject anything that does not match.</p>
                </div>
                <Code title="Node.js">{`import { createHmac, timingSafeEqual } from "node:crypto";

export function verify(rawBody, header, secret) {
  const expected = "sha256=" +
    createHmac("sha256", secret).update(rawBody).digest("hex");
  return header.length === expected.length &&
    timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

// Express example
app.post("/hooks/tenantspark",
  express.raw({ type: "application/json" }),
  (req, res) => {
    if (!verify(req.body, req.get("X-TenantSpark-Signature"), SECRET)) {
      return res.sendStatus(401);
    }
    const event = JSON.parse(req.body);
    res.sendStatus(200);           // reply first
    handle(event);                 // then do the work
  });`}</Code>
              </div>

              <div id="event-types" className="scroll-mt-8 flex flex-col gap-3 py-8 border-t border-line">
                <h3 className="text-[20px] font-semibold text-ink leading-tight">Event types</h3>
                <p className="text-[15px] text-ink-2 m-0">Subscribe to one of these, or <code className="text-ink">*</code> for all. The object column is the key the payload is under.</p>
                <div className="rounded-xl border border-line overflow-hidden">
                  <table className="w-full text-[14px]">
                    <thead className="bg-page text-left text-[12px] uppercase tracking-[0.06em] text-muted">
                      <tr><th className="px-3.5 py-2 font-semibold">Type</th><th className="px-3.5 py-2 font-semibold hidden sm:table-cell">Object</th><th className="px-3.5 py-2 font-semibold">When</th></tr>
                    </thead>
                    <tbody className="divide-y divide-line-2">
                      {EVENT_LIST.map((ev) => (
                        <tr key={ev.type}>
                          <td className="px-3.5 py-2 align-top"><code className="text-ink">{ev.type}</code></td>
                          <td className="px-3.5 py-2 align-top text-muted hidden sm:table-cell"><code>{ev.object}</code></td>
                          <td className="px-3.5 py-2 align-top text-ink-2">{ev.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="pt-8 pb-4 border-t border-line flex flex-col gap-2 text-[15px] text-ink-2 leading-relaxed">
              <h2 className="text-[20px] font-semibold text-ink">Limits and help</h2>
              <p className="m-0">A few requests a second per key is fine. If you need bulk, use <code className="text-ink">since</code> and sync in pages. Questions, or an endpoint you need: <a href="mailto:hello@tenantspark.com" className="font-semibold text-link">hello@tenantspark.com</a>. Prefer no code? <Link href="/integrations" className="font-semibold text-link">Zapier connects the same events to 8,000 apps</Link>.</p>
            </section>
          </div>
        </div>
    </div>
  );
}
