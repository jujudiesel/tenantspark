import { requireTenant } from "@/lib/tenant";
import { Card, Pill, fmtDate, moneyExact } from "@/components/ui";

export const metadata = { title: "Your lease" };

export default async function TenantLeasePage() {
  const { leases, landlord } = await requireTenant();
  const ordinal = (n: number) => `${n}${["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]}`;

  if (leases.length === 0) {
    return (
      <Card className="p-6 flex flex-col gap-2">
        <h1 className="font-display font-semibold text-2xl">Lease</h1>
        <p className="text-[15px] text-ink-2">No lease on file yet.</p>
      </Card>
    );
  }

  return (
    <>
      <h1 className="font-display font-semibold text-[26px] leading-tight">Lease</h1>
      {leases.map((l) => {
        const p = l.units.properties;
        return (
          <Card key={l.id} className="p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[17px] font-semibold">
                  {p.address_line1}{p.address_line2 ? `, ${p.address_line2}` : ""}{l.units.label !== "Whole home" ? `, ${l.units.label}` : ""}
                </span>
                <span className="text-sm text-muted">{p.city}, {p.state} {p.zip}</span>
              </div>
              {l.status === "active" ? <Pill tone="blue">Current</Pill> : <Pill tone="gray">Ended</Pill>}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              <dt className="text-muted">Monthly rent</dt>
              <dd className="font-semibold tabular">{moneyExact(l.rent_cents)}</dd>
              <dt className="text-muted">Due on the</dt>
              <dd className="font-semibold">{ordinal(l.rent_due_day)} of the month</dd>
              <dt className="text-muted">Security deposit</dt>
              <dd className="font-semibold tabular">{moneyExact(l.deposit_cents)}</dd>
              <dt className="text-muted">Starts</dt>
              <dd className="font-semibold">{fmtDate(l.start_date)}</dd>
              <dt className="text-muted">Ends</dt>
              <dd className="font-semibold">{l.end_date ? fmtDate(l.end_date) : "Month to month"}</dd>
              <dt className="text-muted">Landlord</dt>
              <dd className="font-semibold">{landlord}</dd>
            </dl>
          </Card>
        );
      })}
    </>
  );
}
