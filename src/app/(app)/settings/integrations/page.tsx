import Link from "next/link";
import { requireAccount } from "@/lib/data";
import { Button, Card, Field, Notice, PageHeader, Pill } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { SettingsTabs } from "@/components/settings-tabs";
import { EVENT_TYPES } from "@/lib/api/objects";
import { createApiKey, removeWebhook, revokeApiKey } from "./actions";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ new?: string; error?: string; revoked?: string }> }) {
  const sp = await searchParams;
  const { supabase, account } = await requireAccount();
  const [{ data: keys }, { data: hooks }, { data: recent }] = await Promise.all([
    supabase.from("api_keys").select("id, name, prefix, last_used_at, revoked_at, created_at").eq("account_id", account.id).is("revoked_at", null).order("created_at"),
    supabase.from("webhook_subscriptions").select("id, url, event_type, source, created_at").eq("account_id", account.id).eq("active", true).order("created_at"),
    supabase.from("events").select("id, type, created_at").eq("account_id", account.id).order("created_at", { ascending: false }).limit(8),
  ]);
  const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Never");
  const configured = Boolean(process.env.SUPABASE_SECRET_KEY);

  return (
    <>
      <PageHeader title="Integrations" subtitle="Connect TenantSpark to Zapier and other tools." />
      <SettingsTabs />

      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}
      {sp.revoked ? <Notice tone="success">Key revoked. Anything using it stopped working.</Notice> : null}
      {!configured ? <Notice>The API isn&apos;t switched on for this server yet. Keys you make here will work once it is.</Notice> : null}

      {sp.new ? (
        <Card className="p-6 flex flex-col gap-3 border-spark">
          <h2 className="font-display font-semibold text-xl">Your new API key</h2>
          <p className="text-[15px] text-ink-2">Copy it now. For your safety we don&apos;t keep a copy, so this is the only time you&apos;ll see it.</p>
          <code className="block text-[14px] break-all px-3.5 py-3 rounded-lg bg-page border border-line">{sp.new}</code>
          <div><CopyButton text={sp.new} label="Copy key" /></div>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-6 items-start">
        <div className="flex-[3_1_460px] min-w-0 flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-display font-semibold text-xl">Zapier</h2>
              <p className="text-[15px] text-ink-2 leading-relaxed">
                Zapier connects TenantSpark to Gmail, Slack, Google Sheets, QuickBooks, Trello, Mailchimp and thousands more. When rent is paid, a tenant sends a repair request, or a lease gets signed, Zapier can do the next thing for you.
              </p>
            </div>
            <ol className="flex flex-col gap-2 text-[15px] text-ink-2 list-decimal pl-5">
              <li>Make an API key below and copy it.</li>
              <li>In Zapier, add TenantSpark as an app and paste the key when it asks.</li>
              <li>Pick a trigger (like &quot;Rent paid&quot;) and what should happen next.</li>
            </ol>
            <p className="text-[13px] text-muted">Building something yourself? <Link href="/developers" className="font-semibold text-link">API docs</Link>.</p>
          </Card>

          <Card>
            <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-3">
              <h2 className="font-display font-semibold text-xl">API keys</h2>
            </div>
            {(keys ?? []).length === 0 ? (
              <p className="px-6 pb-4 text-[15px] text-muted">No keys yet.</p>
            ) : (
              <ul>
                {(keys ?? []).map((k) => (
                  <li key={k.id} className="px-6 py-3.5 border-t border-line-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">{k.name}</span>
                      <span className="text-[13px] text-muted"><code>{k.prefix}…</code> · Last used {when(k.last_used_at)}</span>
                    </div>
                    <form action={revokeApiKey}>
                      <input type="hidden" name="id" value={k.id} />
                      <Button type="submit" variant="secondary">Revoke</Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form action={createApiKey} className="px-6 py-5 border-t border-line flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]"><Field label="Name" name="name" placeholder="Zapier" /></div>
              <Button type="submit">Make a key</Button>
            </form>
          </Card>

          <Card>
            <div className="px-6 pt-5 pb-3"><h2 className="font-display font-semibold text-xl">Webhooks</h2></div>
            {(hooks ?? []).length === 0 ? (
              <p className="px-6 pb-5 text-[15px] text-muted">Nothing is listening yet. Zapier adds one here when you turn on a zap.</p>
            ) : (
              <ul>
                {(hooks ?? []).map((h) => (
                  <li key={h.id} className="px-6 py-3.5 border-t border-line-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-semibold">{h.event_type === "*" ? "All events" : EVENT_TYPES[h.event_type]?.label ?? h.event_type} <Pill tone={h.source === "zapier" ? "blue" : "gray"}>{h.source === "zapier" ? "Zapier" : "API"}</Pill></span>
                      <span className="text-[13px] text-muted truncate">{h.url}</span>
                    </div>
                    <form action={removeWebhook}>
                      <input type="hidden" name="id" value={h.id} />
                      <Button type="submit" variant="secondary">Remove</Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="flex-[2_1_300px] min-w-0 p-6 flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-muted">Recent activity</h2>
          <p className="text-[13px] text-muted">What your integrations can react to.</p>
          {(recent ?? []).length === 0 ? (
            <p className="text-[15px] text-muted">Nothing yet.</p>
          ) : (
            <ul className="flex flex-col">
              {(recent ?? []).map((e) => (
                <li key={e.id} className="py-2 border-b border-line-2 last:border-0 flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{EVENT_TYPES[e.type]?.label ?? e.type}</span>
                  <span className="text-[12px] text-muted whitespace-nowrap">{when(e.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
