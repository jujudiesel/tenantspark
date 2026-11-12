"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/tenant";
import { str } from "@/lib/data";
import { stampSignedPdf } from "@/lib/sign-pdf";

const BUCKET = "lease-files";

export async function signDocument(formData: FormData) {
  const { supabase, tenant } = await requireTenant();
  const document_id = String(formData.get("document_id"));
  const typed = str(formData.get("typed_name"));
  const back = (msg: string) => redirect(`/tenant/sign/${document_id}?error=${encodeURIComponent(msg)}`);

  if (!tenant) back("Your login isn't connected to a lease.");
  if (!typed || typed.length < 2) back("Type your full name to sign.");
  if (formData.get("consent") !== "yes") back("Check the box to agree to sign electronically.");

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0].trim() || null;
  const agent = h.get("user-agent")?.slice(0, 300) ?? null;

  const { data, error } = (await supabase.rpc("sign_document", { doc: document_id, typed: typed!, ip, agent }).single()) as {
    data: { all_signed: boolean; signature_id: string } | null;
    error: { message: string } | null;
  };
  if (error) back(error.message.replace(/^.*?: /, ""));

  // Once everyone has signed, stamp a signature page onto the PDF and store it as the signed copy.
  if (data?.all_signed) {
    try {
      const { data: doc } = await supabase
        .from("lease_documents")
        .select("storage_path, title, lease_id, leases(account_id), lease_signatures(typed_name, signed_at, ip_address, tenants(full_name, email))")
        .eq("id", document_id)
        .single();
      if (doc) {
        const { data: file } = await supabase.storage.from(BUCKET).download(doc.storage_path);
        if (file) {
          const sigs = (doc.lease_signatures as unknown as { typed_name: string; signed_at: string; ip_address: string | null; tenants: { full_name: string; email: string | null } }[]).map((s) => ({
            name: s.typed_name,
            tenantName: s.tenants?.full_name ?? s.typed_name,
            email: s.tenants?.email ?? null,
            signedAt: s.signed_at,
            ip: s.ip_address,
          }));
          const stamped = await stampSignedPdf(new Uint8Array(await file.arrayBuffer()), { documentId: document_id, title: doc.title, signatures: sigs });
          const accountId = (doc.leases as unknown as { account_id: string }).account_id;
          const signedPath = `${accountId}/${doc.lease_id}/signed-${document_id}.pdf`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(signedPath, stamped, { contentType: "application/pdf", upsert: true });
          if (!upErr) await supabase.rpc("set_signed_path", { doc: document_id, path: signedPath });
        }
      }
    } catch {
      // The signature itself is recorded; the stamped copy is a convenience and can be regenerated.
    }
  }

  revalidatePath("/tenant");
  revalidatePath("/tenant/documents");
  redirect(`/tenant/sign/${document_id}?done=1`);
}
