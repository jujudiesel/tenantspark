"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount, str } from "@/lib/data";
import { newApiKey } from "@/lib/api/auth";

const PAGE = "/settings/integrations";

export async function createApiKey(formData: FormData) {
  const { supabase, account, user } = await requireAccount();
  const name = str(formData.get("name")) ?? "Zapier";
  const { key, prefix, key_hash } = newApiKey();
  const { error } = await supabase.from("api_keys").insert({ account_id: account.id, name, prefix, key_hash, created_by: user.id });
  if (error) redirect(`${PAGE}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(PAGE);
  // The full key is shown once, on the next page load, and never stored.
  redirect(`${PAGE}?new=${encodeURIComponent(key)}`);
}

export async function revokeApiKey(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id).eq("account_id", account.id);
  await supabase.from("webhook_subscriptions").update({ active: false }).eq("api_key_id", id).eq("account_id", account.id);
  revalidatePath(PAGE);
  redirect(`${PAGE}?revoked=1`);
}

export async function removeWebhook(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  await supabase.from("webhook_subscriptions").update({ active: false }).eq("id", id).eq("account_id", account.id);
  revalidatePath(PAGE);
  redirect(PAGE);
}
