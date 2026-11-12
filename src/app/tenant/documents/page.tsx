import Link from "next/link";
import { requireTenant } from "@/lib/tenant";
import { Card, Pill, fmtDate } from "@/components/ui";

export const metadata = { title: "Documents" };

export default async function TenantDocumentsPage() {
  const { supabase, leases } = await requireTenant();
  const leaseIds = leases.map((l) => l.id);
  const { data: docs } = leaseIds.length
    ? await supabase
        .from("lease_documents")
        .select("id, title, status, sent_at, signed_at, signed_storage_path, lease_id")
        .in("lease_id", leaseIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <>
      <h1 className="font-display font-semibold text-[26px] leading-tight">Documents</h1>
      <Card>
        {!docs || docs.length === 0 ? (
          <p className="p-6 text-[15px] text-ink-2">Nothing here yet. Your landlord can send you a lease to sign or share signed copies.</p>
        ) : (
          <ul className="flex flex-col">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-line-2 last:border-0">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[15px] font-semibold">{d.title}</span>
                  <span className="text-[13px] text-muted">
                    {d.status === "signed" ? `Signed ${fmtDate(d.signed_at!.slice(0, 10))}` : `Sent ${fmtDate(d.sent_at!.slice(0, 10))}`}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {d.status === "sent" ? (
                    <Link href={`/tenant/sign/${d.id}`} className="inline-flex items-center justify-center min-h-11 px-4 rounded-lg text-sm font-semibold bg-navy text-white">Review and sign</Link>
                  ) : (
                    <Pill tone="green">Signed</Pill>
                  )}
                  <a href={`/files/${d.id}${d.status === "signed" && d.signed_storage_path ? "?signed=1" : ""}`} target="_blank" rel="noopener" className="inline-flex items-center justify-center min-h-11 px-4 rounded-lg text-sm font-semibold bg-white text-ink border border-field">Open</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
