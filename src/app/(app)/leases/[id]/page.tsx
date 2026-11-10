import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/data";
import { Button, Card, Field, PageHeader, Pill, fmtDate, moneyExact } from "@/components/ui";
import { deleteLease, endLease } from "../actions";

export default async function LeasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, account } = await requireAccount();
  const { data: lease } = await supabase
    .from("leases")
    .select("*, units(id, label, property_id, properties(id, name, address_line1, city, state, zip)), lease_tenants(is_primary, tenants(id, full_name, email, phone))")
    .eq("id", id)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!lease) notFound();

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
          <p className="text-[13px] text-muted">Lease documents and e-signing come with the next update.</p>
        </Card>
      </div>

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
