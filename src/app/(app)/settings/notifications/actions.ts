"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/data";
import { notify, wrapHtml, para, esc, SITE } from "@/lib/notify";

const PAGE = "/settings/notifications";
const KEYS = ["rent_due_soon", "rent_due_today", "rent_late", "lease_ending", "repair_updates", "document_sent", "payment_receipt", "sms_enabled"] as const;

export async function saveNotificationSettings(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const row: Record<string, boolean | string> = { account_id: account.id };
  for (const k of KEYS) row[k] = formData.get(k) === "on";
  const { error } = await supabase.from("notification_settings").upsert(row, { onConflict: "account_id" });
  if (error) redirect(`${PAGE}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(PAGE);
  redirect(`${PAGE}?saved=1`);
}

export async function sendTestEmail() {
  const { supabase, account, user } = await requireAccount();
  if (!user.email) redirect(`${PAGE}?error=${encodeURIComponent("Your login has no email address.")}`);
  const subject = "Test from TenantSpark";
  const text = `This is what tenants and you will get from ${account.name}'s TenantSpark account. If you can read this, email is working.\n\n${SITE}`;
  const html = wrapHtml(subject, para(esc(`This is what tenants and you will get from ${account.name}'s TenantSpark account. If you can read this, email is working.`)), esc("Sent from Settings, Notifications."));
  const r = await notify(supabase, { accountId: account.id, kind: "test", dedupeKey: `test:${user.id}:${Date.now()}`, email: user.email, message: { subject, text, html } });
  const status = r[0]?.split(":")[1] ?? "skipped";
  revalidatePath(PAGE);
  redirect(`${PAGE}?test=${status}`);
}
