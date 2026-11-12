import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/data";
import { Button, Card, Field, Notice, PageHeader, Pill, fmtDate, moneyExact } from "@/components/ui";
import { deleteLease, endLease } from "../actions";
import { deleteLeaseDocument, sendForSignature, uploadLeaseDocument } from "../documents";

export default async function LeasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, account } = await requireAccount();
  const { data: lease } = await supabase
    .from("leases")
    .select("*, units(id, label, property_id, properties(id, name, address_line1, city, state, zip)), lease_tenants(is_primary, tenants(id, full_name, email, phone))")
    .eq("id", id)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!lease) notFound();

  const { data: documents } = await supabase
    .from("lease_documents")
    .select("id, title, status, sent_at, signed_at, signed_storage_path, size_bytes, created_at, lease_signatures(typed_name, signed_at, tenants(full_name))")
    .eq("lease_id", id)
    .order("created_at", { ascending: false });

  const unit = lease.units as unknown as { id: string; label: string; property_id: string; properties: { id: string; name: string; address_line1: string; city: string; state: string; zip: string } };
  const people = ((lease.lease_tenants as unknown as { is_primary: boolean; tenants: { id: string; full_name: string; email: string | null; phone: string | null } }[]) ?? [])
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const today = new Date().toISOString().slice(0, 10);
  const ordinal = (n: number) => `${n}${["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]}`;

  return (
    <>
      <PageHeader
        title={`${unit.properties.name}, ${unit.label}`}
        subtitle={`${unit.properties.address_line1}, ${unit.properties.city}, ${unit.properties.state} ${unit.properties.zip}`}
        actions={
          <>
            {lease.status === "active" ? <Pill tone="blue">Active lease</Pill> : <Pill tone="gray">Ended</Pill>}
            <Button href={`/properties/${unit.properties.id}`} variant="secondary">Property</Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-6">
        <Card className="flex-[1_1_320px] min-w-0 px-7 py-6 flex flex-col gap-4">
          <h2 className="font-display font-semibold text-xl">Terms</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted">Monthly rent</dt>
            <dd className="font-semibold tabular">{moneyExact(lease.rent_cents)}</dd>
            <dt className="text-muted">Due on the</dt>
            <dd className="font-semibold">{ordinal(lease.rent_due_day)} of the month</dd>
            <dt className="text-muted">Security deposit</dt>
            <dd className="font-semibold tabular">{moneyExact(lease.deposit_cents)}</dd>
            <dt className="text-muted">Starts</dt>
            <dd className="font-semibold">{fmtDate(lease.start_date)}</dd>
            <dt className="text-muted">Ends</dt>
            <dd className="font-semibold">{lease.end_date ? fmtDate(lease.end_date) : "Month to month"}</dd>
          </dl>
          {lease.notes ? <p className="text-sm leading-relaxed text-ink-2 whitespace-pre-line border-t border-line-2 pt-4">{lease.notes}</p> : null}
        </Card>

        <Card className="flex-[1_1_320px] min-w-0 px-7 py-6 flex flex-col gap-3">
          <h2 className="font-display font-semibold text-xl">Tenants</h2>
          <ul className="flex flex-col">
            {people.map((p) => (
              <li key={p.tenants.id} className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-line-2 last:border-0">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <Link href={`/tenants/${p.tenants.id}`} className="text-sm font-semibold hover:text-link">{p.tenants.full_name}</Link>
                  <span className="text-[13px] text-muted">{[p.tenants.email, p.tenants.phone].filter(Boolean).join(" · ") || "No contact info"}</span>
                </div>
                {p.is_primary ? <Pill tone="gray">Primary</Pill> : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <Card className="flex flex-col">
        <div className="flex items-center justify-between gap-3 px-7 pt-6 pb-3">
          <h2 className="font-display font-semibold text-xl">Lease documents</h2>
          <span className="text-sm text-muted">{documents?.length ?? 0} {documents?.length === 1 ? "file" : "files"}</span>
        </div>
        {!documents || documents.length === 0 ? (
          <p className="px-7 pb-5 text-[15px] text-muted">Upload the signed lease, or upload an unsigned one and send it to the tenant to sign online.</p>
        ) : (
          <ul className="flex flex-col px-7">
            {documents.map((d) => {
              type Sig = { typed_name: string; signed_at: string; tenants: { full_name: string } };
              const sigs = ((d.lease_signatures as unknown as Sig[]) ?? []);
              const signedNames = sigs.map((s) => s.tenants?.full_name ?? s.typed_name);
              const waiting = people.filter((p) => !sigs.some((s) => s.tenants?.full_name === p.tenants.full_name)).map((p) => p.tenants.full_name);
              return (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-4 border-t border-line-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-semibold">{d.title}</span>
                    <span className="text-[13px] text-muted">
                      {d.status === "signed"
                        ? `Signed by ${signedNames.join(", ")} on ${fmtDate(d.signed_at!.slice(0, 10))}`
                        : d.status === "sent"
                          ? `Sent ${fmtDate(d.sent_at!.slice(0, 10))}. ${signedNames.length ? `Signed by ${signedNames.join(", ")}. ` : ""}Waiting on ${waiting.join(", ") || "tenant"}.`
                          : "Not sent to the tenant yet."}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {d.status === "signed" ? <Pill tone="green">Signed</Pill> : d.status === "sent" ? <Pill tone="amber">Awaiting signature</Pill> : <Pill tone="gray">Draft</Pill>}
                    <a href={`/files/${d.id}`} target="_blank" rel="noopener" className="inline-flex items-center justify-center min-h-11 px-4 rounded-lg text-sm font-semibold bg-white text-ink border border-field hover:bg-page">View</a>
                    {d.status === "signed" && d.signed_storage_path ? (
                      <a href={`/files/${d.id}?signed=1&download=1`} className="inline-flex items-center justify-center min-h-11 px-4 rounded-lg text-sm font-semibold bg-white text-ink border border-field hover:bg-page">Signed copy</a>
                    ) : null}
                    {d.status === "draft" ? (
                      <>
                        <form action={sendForSignature}>
                          <input type="hidden" name="id" value={d.id} />
                          <input type="hidden" name="lease_id" value={lease.id} />
                          <Button type="submit">Send for signature</Button>
                        </form>
                        <form action={deleteLeaseDocument}>
                          <input type="hidden" name="id" value={d.id} />
                          <input type="hidden" name="lease_id" value={lease.id} />
                          <Button type="submit" variant="danger">Remove</Button>
                        </form>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <form action={uploadLeaseDocument} className="flex flex-col gap-4 px-7 py-6 border-t border-line bg-page/50 rounded-b-[14px]">
          <input type="hidden" name="lease_id" value={lease.id} />
          <h3 className="text-[15px] font-semibold">Upload a document</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" name="title" placeholder="Lease agreement" hint="Leave blank to use the file name." />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="f-file" className="text-sm font-semibold">PDF file</label>
              <input id="f-file" name="file" type="file" accept="application/pdf,.pdf" required className="box-border w-full min-h-12 px-3 py-2.5 rounded-[10px] border border-field-strong bg-white text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-navy file:text-white file:text-sm file:font-semibold" />
            </div>
          </div>
          <label className="flex items-center gap-3 min-h-11 text-sm">
            <input type="checkbox" name="send_now" value="yes" defaultChecked className="w-5 h-5 accent-navy" />
            Send to the tenant to sign right away
          </label>
          <div>
            <Button type="submit" variant="secondary">Upload</Button>
          </div>
        </form>
      </Card>

      {lease.status === "active" ? (
        <details className="max-w-[640px]">
          <summary className="cursor-pointer text-sm text-muted select-none">End this lease</summary>
          <form action={endLease} className="mt-3 flex flex-wrap items-end gap-3 p-4 rounded-[10px] bg-page">
            <input type="hidden" name="id" value={lease.id} />
            <div className="flex-1 min-w-[200px]">
              <Field label="Move-out date" name="end_date" type="date" required defaultValue={today} />
            </div>
            <Button type="submit" variant="secondary">Mark lease ended</Button>
          </form>
        </details>
      ) : (
        <details className="max-w-[640px]">
          <summary className="cursor-pointer text-sm text-muted select-none">Delete this lease</summary>
          <form action={deleteLease} className="mt-3 flex flex-wrap items-center gap-3 p-4 rounded-[10px] bg-red-bg">
            <input type="hidden" name="id" value={lease.id} />
            <p className="text-sm text-red-ink flex-1 min-w-[200px]">Removes this lease record for good. Keep ended leases if you want the history.</p>
            <Button type="submit" variant="danger">Delete lease</Button>
          </form>
        </details>
      )}
    </>
  );
}
