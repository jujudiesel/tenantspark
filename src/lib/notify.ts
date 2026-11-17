import { Resend } from "resend";

/**
 * Sending email and text. Both are optional: with no keys set, sends are logged as "skipped"
 * so the app keeps working and nothing is lost when the keys arrive later.
 */

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Db = { from: (table: string) => Any };

export const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://tenantspark.com";
const FROM = process.env.EMAIL_FROM || "TenantSpark <notifications@tenantspark.com>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "hello@tenantspark.com";

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);
export const smsConfigured = () => Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);

export type Message = { subject: string; text: string; html?: string; sms?: string };

/** Minimal HTML wrapper so emails look like us without a template system. */
export function wrapHtml(subject: string, bodyHtml: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fa;font-family:-apple-system,Segoe UI,Inter,Arial,sans-serif;color:#0e1730">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 0 14px 0;font-weight:800;font-size:18px;letter-spacing:-0.2px">Tenant<span style="color:#0b6fd6">Spark</span></td></tr>
<tr><td style="background:#fff;border:1px solid #e3e8f0;border-radius:14px;padding:28px 28px 24px">
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.25">${esc(subject)}</h1>
<div style="font-size:16px;line-height:1.55;color:#3d4760">${bodyHtml}</div>
</td></tr>
<tr><td style="padding:14px 6px 0;font-size:12px;line-height:1.5;color:#5b6477">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
export const para = (...lines: string[]) => lines.map((l) => `<p style="margin:0 0 12px">${l}</p>`).join("");
export const button = (href: string, label: string) =>
  `<p style="margin:18px 0 6px"><a href="${href}" style="display:inline-block;background:#0e1730;color:#fff;text-decoration:none;font-weight:600;padding:13px 22px;border-radius:10px">${esc(label)}</a></p>`;

export async function sendEmail(to: string, m: Message) {
  if (!emailConfigured()) return { status: "skipped" as const, error: "email not configured" };
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: FROM, to, replyTo: REPLY_TO, subject: m.subject, text: m.text, html: m.html });
    if (error) return { status: "failed" as const, error: error.message };
    return { status: "sent" as const, error: null };
  } catch (e) {
    return { status: "failed" as const, error: e instanceof Error ? e.message : "send failed" };
  }
}

async function sendSms(to: string, body: string) {
  if (!smsConfigured()) return { status: "skipped" as const, error: "sms not configured" };
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM!, Body: body }),
    });
    if (!res.ok) return { status: "failed" as const, error: `Twilio ${res.status}` };
    return { status: "sent" as const, error: null };
  } catch (e) {
    return { status: "failed" as const, error: e instanceof Error ? e.message : "send failed" };
  }
}

export function normalizePhone(p: string | null | undefined) {
  if (!p) return null;
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return p.startsWith("+") ? p : null;
}

/**
 * Sends one message to one person over email (always, if they have an address) and SMS (if enabled and they have a phone).
 * dedupeKey makes repeated calls safe: the second one does nothing.
 */
export async function notify(
  db: Db,
  opts: { accountId: string; tenantId?: string | null; kind: string; dedupeKey: string; email?: string | null; phone?: string | null; sms?: boolean; message: Message },
) {
  const results: string[] = [];
  const tryLog = async (channel: "email" | "sms", recipient: string, r: { status: string; error: string | null }, bodyText: string) => {
    const { error } = await db.from("notifications").insert({
      account_id: opts.accountId,
      tenant_id: opts.tenantId ?? null,
      channel,
      kind: opts.kind,
      recipient,
      subject: opts.message.subject,
      body: bodyText,
      status: r.status,
      error: r.error,
      dedupe_key: `${opts.dedupeKey}:${channel}`,
    });
    return !error; // unique violation means it already went
  };

  if (opts.email) {
    const { data: existing } = await db.from("notifications").select("id").eq("dedupe_key", `${opts.dedupeKey}:email`).maybeSingle();
    if (!existing) {
      const r = await sendEmail(opts.email, opts.message);
      await tryLog("email", opts.email, r, opts.message.text);
      results.push(`email:${r.status}`);
    }
  }
  const phone = normalizePhone(opts.phone);
  if (opts.sms && phone && opts.message.sms) {
    const { data: existing } = await db.from("notifications").select("id").eq("dedupe_key", `${opts.dedupeKey}:sms`).maybeSingle();
    if (!existing) {
      const r = await sendSms(phone, opts.message.sms);
      await tryLog("sms", phone, r, opts.message.sms);
      results.push(`sms:${r.status}`);
    }
  }
  return results;
}

/** Account notification settings with defaults when the row doesn't exist yet. */
export async function loadSettings(db: Db, accountId: string) {
  const { data } = await db.from("notification_settings").select("*").eq("account_id", accountId).maybeSingle();
  return {
    rent_due_soon: true,
    rent_due_today: true,
    rent_late: true,
    lease_ending: true,
    repair_updates: true,
    document_sent: true,
    payment_receipt: true,
    sms_enabled: true,
    ...(data ?? {}),
  } as Record<string, boolean>;
}

/** Owners and managers on an account, with email. */
export async function landlordContacts(db: Db, accountId: string): Promise<{ email: string; name: string | null }[]> {
  const { data } = await db.from("account_members").select("user_id, role, profiles(email, full_name)").eq("account_id", accountId);
  return ((data ?? []) as Any[])
    .filter((m) => m.role !== "viewer" && m.profiles?.email)
    .map((m) => ({ email: m.profiles.email as string, name: (m.profiles.full_name as string | null) ?? null }));
}
