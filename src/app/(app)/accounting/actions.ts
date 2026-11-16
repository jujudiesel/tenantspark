"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount, dollarsToCents, str } from "@/lib/data";
import { sanitizeFileName } from "@/lib/maintenance";

const PAGE = "/accounting";

function refresh(id?: string) {
  revalidatePath(PAGE);
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`${PAGE}/${id}`);
}

async function readEntry(formData: FormData) {
  const kind = str(formData.get("kind")) === "income" ? "income" : "expense";
  const amount_cents = dollarsToCents(formData.get("amount"));
  const entry_date = str(formData.get("entry_date"));
  return {
    kind,
    amount_cents,
    entry_date,
    property_id: str(formData.get("property_id")),
    unit_id: str(formData.get("unit_id")),
    category_id: str(formData.get("category_id")),
    vendor: str(formData.get("vendor")),
    memo: str(formData.get("memo")),
  };
}

async function storeReceipt(supabase: Awaited<ReturnType<typeof requireAccount>>["supabase"], accountId: string, entryId: string, file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 15 * 1024 * 1024) return null;
  const path = `${accountId}/${entryId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from("receipts").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type || "application/octet-stream" });
  return error ? null : path;
}

export async function createEntry(formData: FormData) {
  const { supabase, account, user } = await requireAccount();
  const e = await readEntry(formData);
  const back = (msg: string) => redirect(`${PAGE}/new?kind=${e.kind}&error=${encodeURIComponent(msg)}`);
  if (!e.amount_cents || e.amount_cents <= 0) back("Enter the amount.");
  if (!e.entry_date) back("Pick a date.");

  const { data, error } = await supabase
    .from("ledger_entries")
    .insert({ account_id: account.id, ...e, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) back(error?.message ?? "Could not save.");

  const receipt_path = await storeReceipt(supabase, account.id, data!.id, formData.get("receipt"));
  if (receipt_path) await supabase.from("ledger_entries").update({ receipt_path }).eq("id", data!.id);
  refresh();
  redirect(`${PAGE}?saved=1`);
}

export async function updateEntry(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  const e = await readEntry(formData);
  const back = (msg: string) => redirect(`${PAGE}/${id}?error=${encodeURIComponent(msg)}`);
  if (!e.amount_cents || e.amount_cents <= 0) back("Enter the amount.");
  if (!e.entry_date) back("Pick a date.");

  const patch: Record<string, unknown> = { ...e };
  const receipt_path = await storeReceipt(supabase, account.id, id, formData.get("receipt"));
  if (receipt_path) patch.receipt_path = receipt_path;
  const { error } = await supabase.from("ledger_entries").update(patch).eq("id", id).eq("account_id", account.id);
  if (error) back(error.message);
  refresh(id);
  redirect(`${PAGE}?saved=1`);
}

export async function deleteEntry(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  const { data } = await supabase.from("ledger_entries").select("receipt_path, maintenance_request_id").eq("id", id).eq("account_id", account.id).maybeSingle();
  if (data?.maintenance_request_id) redirect(`${PAGE}/${id}?error=${encodeURIComponent("This expense comes from a repair. Change the cost on the repair instead.")}`);
  if (data?.receipt_path) await supabase.storage.from("receipts").remove([data.receipt_path]);
  await supabase.from("ledger_entries").delete().eq("id", id).eq("account_id", account.id);
  refresh();
  redirect(`${PAGE}?deleted=1`);
}

export async function addCategory(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const name = str(formData.get("name"));
  const kind = str(formData.get("kind")) === "income" ? "income" : "expense";
  if (!name) redirect(`${PAGE}/categories?error=${encodeURIComponent("Give it a name.")}`);
  const { error } = await supabase.from("categories").insert({ account_id: account.id, kind, name, sort: 500 });
  if (error) redirect(`${PAGE}/categories?error=${encodeURIComponent(error.message.includes("duplicate") ? "You already have that one." : error.message)}`);
  refresh();
  redirect(`${PAGE}/categories`);
}

export async function toggleCategory(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  const archived = formData.get("archived") === "yes";
  await supabase.from("categories").update({ archived }).eq("id", id).eq("account_id", account.id).eq("is_system", false);
  refresh();
  redirect(`${PAGE}/categories`);
}
