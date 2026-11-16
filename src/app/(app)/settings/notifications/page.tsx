import { requireAccount } from "@/lib/data";
import { Button, Card, Notice, PageHeader, Pill } from "@/components/ui";
import { SettingsTabs } from "@/components/settings-tabs";
import { emailConfigured, loadSettings, smsConfigured } from "@/lib/notify";
import { saveNotificationSettings, sendTestEmail } from "./actions";

export const metadata = { title: "Notifications" };

const ROWS: [string, string, string][] = [
  ["rent_due_soon", "Rent due in 3 days", "Tenant gets a heads-up with the amount and a pay link."],
  ["rent_due_today", "Rent due today", "Same, on the due date."],
  ["rent_late", "Rent is late", "After your grace period, then once a week until it's paid."],
  ["payment_receipt", "Payment receipts", "Tenant gets a receipt. You get a note that rent came in."],
  ["repair_updates", "Repair updates", "Tenant hears when you schedule, post an update or finish. You hear when they send or reply."],
  ["document_sent", "Documents to sign", "Tenant gets the link the moment you send a lease."],
  ["lease_ending", "Lease ending", "Both of you, 60 and 30 days before the end date."],
];

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; test?: string }> }) {
  const sp = await searchParams;
  const { supabase, account, user } = await requireAccount();
  const s = await loadSettings(supabase, account.id);
  const { data: recent } = await supabase.from("notifications").select("id, channel, kind, recipient, subject, status, created_at").eq("account_id", account.id).order("created_at", { ascending: false }).limit(15);
  const email = emailConfigured();
  const sms = smsConfigured();
  const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <>
      <PageHeader title="Notifications" subtitle="What TenantSpark sends to tenants and to you." />
      <SettingsTabs />
      {sp.saved ? <Notice tone="success">Saved.</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}
      {sp.test === "sent" ? <Notice tone="success">Test email sent to {user.email}.</Notice> : sp.test === "failed" ? <Notice tone="error">The test email failed. Check the sender setup.</Notice> : sp.test === "skipped" ? <Notice>Email isn&apos;t switched on for this server yet, so nothing went out. The settings below are saved and will apply once it is.</Notice> : null}
      {!email ? <Notice>Email sending isn&apos;t set up on this server yet. Reminders are recorded but not delivered until it is.</Notice> : null}

      <div className="flex flex-wrap gap-6 items-start">
        <Card className="flex-[3_1_460px] min-w-0">
          <form action={saveNotificationSettings}>
            <div className="px-6 pt-5 pb-2"><h2 className="font-display font-semibold text-xl">Reminders</h2></div>
            <ul>
              {ROWS.map(([k, label, body]) => (
                <li key={k} className="px-6 py-3.5 border-t border-line-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name={k} defaultChecked={Boolean(s[k])} className="mt-1 w-5 h-5 accent-navy" />
                    <span className="flex flex-col gap-0.5"><span className="text-[15px] font-semibold">{label}</span><span className="text-[13px] text-muted">{body}</span></span>
                  </label>
                </li>
              ))}
              <li className="px-6 py-3.5 border-t border-line-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="sms_enabled" defaultChecked={Boolean(s.sms_enabled)} className="mt-1 w-5 h-5 accent-navy" />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">Also text tenants who have a phone number {sms ? <Pill tone="green">On</Pill> : <Pill tone="gray">Not set up yet</Pill>}</span>
                    <span className="text-[13px] text-muted">Short version of each reminder by SMS. Email always goes out.</span>
                  </span>
                </label>
              </li>
            </ul>
            <div className="px-6 py-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Card>

        <div className="flex-[2_1_300px] min-w-0 flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-3">
            <h2 className="text-[15px] font-semibold text-muted">Sender</h2>
            <p className="text-[15px] text-ink-2">Emails come from <strong className="font-semibold text-ink">notifications@tenantspark.com</strong> with your company name in the body. Replies go to hello@tenantspark.com for now.</p>
            <form action={sendTestEmail}><Button type="submit" variant="secondary">Send me a test email</Button></form>
          </Card>
          <Card>
            <div className="px-6 pt-5 pb-2"><h2 className="text-[15px] font-semibold text-muted">Recently sent</h2></div>
            {(recent ?? []).length === 0 ? <p className="px-6 pb-5 text-[15px] text-muted">Nothing yet.</p> : (
              <ul>
                {(recent ?? []).map((n) => (
                  <li key={n.id} className="px-6 py-2.5 border-t border-line-2 flex flex-col gap-0.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold truncate">{n.subject ?? n.kind}</span>
                      <Pill tone={n.status === "sent" ? "green" : n.status === "failed" ? "red" : "gray"}>{n.status}</Pill>
                    </div>
                    <span className="text-[12px] text-muted">{n.channel === "sms" ? "Text" : "Email"} to {n.recipient} · {when(n.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
