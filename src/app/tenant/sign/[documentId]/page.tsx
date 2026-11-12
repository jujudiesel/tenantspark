import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/tenant";
import { Button, Card, Field, Notice } from "@/components/ui";
import { signDocument } from "./actions";

export const metadata = { title: "Sign your lease" };

export default async function SignPage({
  params,
  searchParams,
}: {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const { documentId } = await params;
  const { error, done } = await searchParams;
  const { supabase, tenant, landlord } = await requireTenant();
  if (!tenant) notFound();

  const { data: doc } = await supabase
    .from("lease_documents")
    .select("id, title, status, signed_storage_path, lease_signatures(tenant_id, typed_name, signed_at)")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) notFound();

  const mine = ((doc.lease_signatures as unknown as { tenant_id: string; typed_name: string; signed_at: string }[]) ?? []).find((s) => s.tenant_id === tenant.id);

  if (doc.status === "signed" || mine) {
    return (
      <Card className="p-6 flex flex-col gap-4">
        <h1 className="font-display font-semibold text-2xl">{done ? "Signed. You're all set." : "Already signed"}</h1>
        <p className="text-[15px] leading-relaxed text-ink-2">
          You signed <strong className="font-semibold text-ink">{doc.title}</strong>
          {mine ? ` as ${mine.typed_name} on ${new Date(mine.signed_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` : ""}.
          {doc.status !== "signed" ? " Waiting on the other tenant on the lease to sign." : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={`/files/${doc.id}${doc.signed_storage_path ? "?signed=1" : ""}`} target="_blank" rel="noopener" className="inline-flex items-center justify-center min-h-11 px-4.5 rounded-lg text-sm font-semibold bg-navy text-white">Open {doc.signed_storage_path ? "signed copy" : "document"}</a>
          <Button href="/tenant" variant="secondary">Back to home</Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-display font-semibold text-[26px] leading-tight">Review and sign</h1>
        <p className="text-sm text-muted">{doc.title}, from {landlord}</p>
      </div>

      <Card className="overflow-hidden">
        <iframe title={doc.title} src={`/files/${doc.id}#toolbar=1`} className="block w-full h-[70vh] min-h-[420px] border-0 bg-page" />
        <div className="px-5 py-3 border-t border-line text-[13px] text-muted">
          Can&apos;t see it? <a href={`/files/${doc.id}`} target="_blank" rel="noopener" className="font-semibold text-link">Open the PDF in a new tab</a>.
        </div>
      </Card>

      <Card className="p-6">
        <form action={signDocument} className="flex flex-col gap-5">
          <input type="hidden" name="document_id" value={doc.id} />
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Field label="Type your full legal name to sign" name="typed_name" required defaultValue={tenant.full_name} autoComplete="off" />
          <div className="px-4 py-3 rounded-[10px] bg-page border border-line font-display text-[28px] leading-tight text-navy italic" aria-hidden="true">
            {tenant.full_name}
          </div>
          <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-2">
            <input type="checkbox" name="consent" value="yes" required className="mt-0.5 w-5 h-5 flex-none accent-navy" />
            <span>
              I have read this document. I agree to sign it electronically, and I understand my electronic signature is as binding as a handwritten one. I can request a paper copy from {landlord}.
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="min-h-[52px] text-base px-6">Sign lease</Button>
            <Link href="/tenant/documents" className="inline-flex items-center min-h-[52px] px-4 text-sm font-semibold text-ink-2">Not now</Link>
          </div>
          <p className="text-[13px] text-muted">We record your name, the date and time, and your device&apos;s network address with the signature.</p>
        </form>
      </Card>
    </>
  );
}
