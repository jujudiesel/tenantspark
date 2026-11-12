"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount, str } from "@/lib/data";

const BUCKET = "lease-files";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "lease.pdf";
}

export async function uploadLeaseDocument(formData: FormData) {
  const { supabase, account, user } = await requireAccount();
  const lease_id = String(formData.get("lease_id"));
  const file = formData.get("file");
  const back = (msg: string) => redirect(`/leases/${lease_id}?error=${encodeURIComponent(msg)}`);

  if (!(file instanceof File) || file.size === 0) back("Choose a PDF to upload.");
  const f = file as File;
  if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) back("Only PDF files for now.");
  if (f.size > 20 * 1024 * 1024) back("That file is over 20 MB.");

  const { data: lease } = await supabase.from("leases").select("id").eq("id", lease_id).eq("account_id", account.id).maybeSingle();
  if (!lease) back("Lease not found.");

  const title = str(formData.get("title")) ?? f.name.replace(/\.pdf$/i, "");
  const path = `${account.id}/${lease_id}/${Date.now()}-${safeName(f.name)}`;
  const bytes = Buffer.from(await f.arrayBuffer());

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (upErr) back(`Upload failed: ${upErr.message}`);

  const { error } = await supabase.from("lease_documents").insert({
    account_id: account.id,
    lease_id,
    title,
    storage_path: path,
    size_bytes: f.size,
    uploaded_by: user.id,
    status: formData.get("send_now") === "yes" ? "sent" : "draft",
    sent_at: formData.get("send_now") === "yes" ? new Date().toISOString() : null,
  });
  if (error) back(error.message);

  revalidatePath(`/leases/${lease_id}`);
  redirect(`/leases/${lease_id}`);
}

export async function sendForSignature(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  const lease_id = String(formData.get("lease_id"));
  await supabase
    .from("lease_documents")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id)
    .eq("account_id", account.id)
    .eq("status", "draft");
  revalidatePath(`/leases/${lease_id}`);
  redirect(`/leases/${lease_id}`);
}

export async function deleteLeaseDocument(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  const lease_id = String(formData.get("lease_id"));
  const { data: doc } = await supabase.from("lease_documents").select("storage_path, signed_storage_path, status").eq("id", id).eq("account_id", account.id).maybeSingle();
  if (doc && doc.status !== "signed") {
    await supabase.storage.from(BUCKET).remove([doc.storage_path, doc.signed_storage_path].filter(Boolean) as string[]);
    await supabase.from("lease_documents").delete().eq("id", id).eq("account_id", account.id);
  }
  revalidatePath(`/leases/${lease_id}`);
  redirect(`/leases/${lease_id}`);
}
