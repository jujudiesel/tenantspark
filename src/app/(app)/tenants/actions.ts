"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount, str } from "@/lib/data";
import { siteUrl } from "@/lib/site";
import { adminClient } from "@/lib/supabase/admin";
import { sendInvite } from "@/lib/reminders";
import { loadSettings } from "@/lib/notify";

export async function createTenant(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const full_name = str(formData.get("full_name"));
  if (!full_name) redirect(`/tenants/new?error=${encodeURIComponent("The tenant needs a name.")}`);

  const { data, error } = await supabase
    .from("tenants")
    .insert({
      account_id: account.id,
      full_name,
      email: str(formData.get("email"))?.toLowerCase() ?? null,
      phone: str(formData.get("phone")),
      notes: str(formData.get("notes")),
    })
    .select("id")
    .single();
  if (error || !data) redirect(`/tenants/new?error=${encodeURIComponent(error?.message ?? "Could not save.")}`);

  revalidatePath("/tenants");
  const unit = str(formData.get("unit_id"));
  if (unit) redirect(`/leases/new?unit=${unit}&tenant=${data.id}`);
  redirect(`/tenants/${data.id}`);
}

export async function updateTenant(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  const full_name = str(formData.get("full_name"));
  if (!full_name) redirect(`/tenants/${id}/edit?error=${encodeURIComponent("The tenant needs a name.")}`);
  const { error } = await supabase
    .from("tenants")
    .update({
      full_name,
      email: str(formData.get("email"))?.toLowerCase() ?? null,
      phone: str(formData.get("phone")),
      notes: str(formData.get("notes")),
    })
    .eq("id", id)
    .eq("account_id", account.id);
  if (error) redirect(`/tenants/${id}/edit?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/tenants/${id}`);
  revalidatePath("/tenants");
  redirect(`/tenants/${id}`);
}

export async function deleteTenant(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  await supabase.from("tenants").delete().eq("id", id).eq("account_id", account.id);
  revalidatePath("/tenants");
  redirect("/tenants");
}

/** Makes sure the tenant has an invite token (regenerating a used/expired one is not allowed once they've signed up). */
export async function createInvite(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  const { data: tenant } = await supabase.from("tenants").select("id, user_id, invite_token, full_name, email, phone").eq("id", id).eq("account_id", account.id).maybeSingle();
  if (!tenant) redirect("/tenants");
  if (tenant.user_id) redirect(`/tenants/${id}`);
  const token = tenant.invite_token ?? crypto.randomUUID();
  await supabase.from("tenants").update({ invite_token: token, invited_at: new Date().toISOString() }).eq("id", id);

  // Email and text the link too, when sending is set up. The link stays on the page either way.
  let sent: string[] = [];
  try {
    const s = await loadSettings(supabase, account.id);
    sent = await sendInvite(supabase, { accountId: account.id, tenant: { ...tenant }, landlord: account.name, url: `${await siteUrl()}/invite/${token}`, sms: s.sms_enabled });
  } catch {
    // never block the invite on email
  }
  revalidatePath(`/tenants/${id}`);
  redirect(`/tenants/${id}?invite=1${sent.some((x) => x.endsWith(":sent")) ? "&emailed=1" : ""}`);
}

/**
 * Landlord sends a tenant a password reset.
 * With the admin key set we make a link the landlord can text or email themselves (shown once, good for an hour).
 * Without it we fall back to Supabase emailing the tenant directly.
 */
export async function sendTenantReset(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  const back = (q: string) => redirect(`/tenants/${id}?${q}`);
  const { data: tenant } = await supabase.from("tenants").select("id, email, user_id").eq("id", id).eq("account_id", account.id).maybeSingle();
  if (!tenant) redirect("/tenants");
  if (!tenant.user_id || !tenant.email) back(`error=${encodeURIComponent("This tenant hasn't signed up for the portal yet, so there's no password to reset. Send them the invite link instead.")}`);

  const base = await siteUrl();
  if (process.env.SUPABASE_SECRET_KEY) {
    const { data, error } = await adminClient().auth.admin.generateLink({ type: "recovery", email: tenant.email! });
    if (error || !data?.properties?.hashed_token) back(`error=${encodeURIComponent(error?.message ?? "Could not make a reset link.")}`);
    const link = `${base}/auth/callback?token_hash=${encodeURIComponent(data!.properties!.hashed_token)}&type=recovery&next=/reset`;
    back(`reset=link&link=${encodeURIComponent(link)}`);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(tenant.email!, { redirectTo: `${base}/auth/callback?next=/reset` });
  if (error) back(`error=${encodeURIComponent(error.message)}`);
  back("reset=email");
}
