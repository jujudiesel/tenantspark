"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount, dollarsToCents, str } from "@/lib/data";

function monthParam(formData: FormData) {
  const m = str(formData.get("month"));
  return m && /^\d{4}-\d{2}$/.test(m) ? m : new Date().toISOString().slice(0, 7);
}

/** Creates this month's charges for every active lease that doesn't have one yet. */
export async function generateCharges(formData: FormData) {
  const { supabase } = await requireAccount();
  const month = monthParam(formData);
  const { data, error } = await supabase.rpc("generate_my_rent_charges", { month_start: `${month}-01` });
  if (error) redirect(`/rent?month=${month}&error=${encodeURIComponent(error.message)}`);
  revalidatePath("/rent");
  revalidatePath("/dashboard");
  redirect(`/rent?month=${month}&generated=${data ?? 0}`);
}

/** Landlord records cash, check or other offline payment against a charge. */
export async function recordPayment(formData: FormData) {
  const { supabase, account, user } = await requireAccount();
  const charge_id = String(formData.get("charge_id"));
  const month = monthParam(formData);
  const amount_cents = dollarsToCents(formData.get("amount"));
  const method = str(formData.get("method")) ?? "cash";
  const back = (msg: string) => redirect(`/rent?month=${month}&error=${encodeURIComponent(msg)}`);

  if (!amount_cents || amount_cents <= 0) back("Enter the amount received.");
  if (!["cash", "check", "other"].includes(method)) back("Pick how they paid.");

  const { data: charge } = await supabase.from("rent_charges").select("id, lease_id, account_id, status").eq("id", charge_id).eq("account_id", account.id).maybeSingle();
  if (!charge) back("Charge not found.");
  if (charge!.status === "void") back("That charge was voided.");

  const { data: lt } = await supabase.from("lease_tenants").select("tenant_id").eq("lease_id", charge!.lease_id).eq("is_primary", true).maybeSingle();
  const paid_at = str(formData.get("paid_on")) ? `${str(formData.get("paid_on"))}T12:00:00Z` : new Date().toISOString();

  const { error } = await supabase.from("payments").insert({
    account_id: account.id,
    lease_id: charge!.lease_id,
    charge_id,
    tenant_id: lt?.tenant_id ?? null,
    amount_cents: amount_cents!,
    fee_cents: 0,
    method,
    status: "succeeded",
    note: str(formData.get("note")),
    recorded_by: user.id,
    paid_at,
  });
  if (error) back(error.message);

  revalidatePath("/rent");
  revalidatePath("/dashboard");
  redirect(`/rent?month=${month}&recorded=1`);
}

export async function voidCharge(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("charge_id"));
  const month = monthParam(formData);
  await supabase.from("rent_charges").update({ status: "void" }).eq("id", id).eq("account_id", account.id).eq("paid_cents", 0);
  revalidatePath("/rent");
  redirect(`/rent?month=${month}`);
}

export async function waiveLateFee(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("charge_id"));
  const month = monthParam(formData);
  await supabase.from("rent_charges").update({ late_fee_cents: 0 }).eq("id", id).eq("account_id", account.id);
  await supabase.rpc("recompute_charge", { c: id });
  revalidatePath("/rent");
  redirect(`/rent?month=${month}`);
}
