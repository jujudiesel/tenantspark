"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount, dollarsToCents, num, str } from "@/lib/data";

function back(params: Record<string, string | null | undefined>, error: string) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  q.set("error", error);
  redirect(`/leases/new?${q.toString()}`);
}

export async function createLease(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const unit_id = str(formData.get("unit_id"));
  const tenantIds = formData.getAll("tenant_ids").map(String).filter(Boolean);
  const start_date = str(formData.get("start_date"));
  const end_date = str(formData.get("end_date"));
  const rent_cents = dollarsToCents(formData.get("rent"));
  const deposit_cents = dollarsToCents(formData.get("deposit")) ?? 0;
  const rent_due_day = num(formData.get("rent_due_day")) ?? 1;
  const ctx = { unit: unit_id, tenant: tenantIds[0] };

  if (!unit_id) back(ctx, "Pick a unit.");
  if (tenantIds.length === 0) back(ctx, "Pick at least one tenant.");
  if (!start_date) back(ctx, "Enter the lease start date.");
  if (rent_cents == null || rent_cents <= 0) back(ctx, "Enter the monthly rent.");
  if (end_date && end_date < start_date!) back(ctx, "The end date is before the start date.");

  // One active lease per unit. End the old one if the landlord said so.
  const { data: existing } = await supabase
    .from("leases")
    .select("id")
    .eq("unit_id", unit_id!)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (existing) {
    if (formData.get("replace_active") === "yes") {
      await supabase.from("leases").update({ status: "ended" }).eq("id", existing.id);
    } else {
      back(ctx, "This unit already has an active lease. End it first, or check the box to replace it.");
    }
  }

  const { data: lease, error } = await supabase
    .from("leases")
    .insert({
      account_id: account.id,
      unit_id: unit_id!,
      start_date: start_date!,
      end_date: end_date ?? null,
      rent_cents: rent_cents!,
      deposit_cents,
      rent_due_day: Math.min(28, Math.max(1, Math.round(rent_due_day))),
      status: "active",
      notes: str(formData.get("notes")),
    })
    .select("id")
    .single();
  if (error || !lease) back(ctx, error?.message ?? "Could not save the lease.");

  const { error: ltError } = await supabase
    .from("lease_tenants")
    .insert(tenantIds.map((tenant_id, i) => ({ lease_id: lease!.id, tenant_id, is_primary: i === 0 })));
  if (ltError) back(ctx, ltError.message);

  revalidatePath("/leases");
  revalidatePath("/dashboard");
  revalidatePath("/properties");
  revalidatePath("/tenants");
  redirect(`/leases/${lease!.id}`);
}

export async function endLease(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  const end_date = str(formData.get("end_date")) ?? new Date().toISOString().slice(0, 10);
  await supabase.from("leases").update({ status: "ended", end_date }).eq("id", id).eq("account_id", account.id);
  revalidatePath(`/leases/${id}`);
  revalidatePath("/leases");
  revalidatePath("/dashboard");
  revalidatePath("/properties");
  redirect(`/leases/${id}`);
}

export async function deleteLease(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  await supabase.from("leases").delete().eq("id", id).eq("account_id", account.id);
  revalidatePath("/leases");
  revalidatePath("/dashboard");
  revalidatePath("/properties");
  redirect("/leases");
}
