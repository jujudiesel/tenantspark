"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount, str } from "@/lib/data";

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
