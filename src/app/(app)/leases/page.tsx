import Link from "next/link";
import { requireAccount } from "@/lib/data";
import { Button, Card, Empty, PageHeader, Pill, fmtDate, money } from "@/components/ui";

export const metadata = { title: "Leases" };

export default async function LeasesPage() {
  const { supabase, account } = await requireAccount();
  const { data: leases } = await supabase
    .from("leases")
    .select("id, status, start_date, end_date, rent_cents, units(label, properties(name)), lease_tenants(tenants(full_name))")
    .eq("account_id", account.id)
    .order("status")
    .order("start_date", { ascending: false });

  const active = (leases ?? []).filter((l) => l.status === "active");
  const other = (leases ?? []).filter((l) => l.status !== "active");

  function Row({ l }: { l: NonNullable<typeof leases>[number] }) {
    const unit = l.units as unknown as { label: string; properties: { name: string } };
    const names = ((l.lease_tenants as unknown as { tenants: { full_name: string } }[]) ?? []).map((lt) => lt.tenants?.full_name).filter(Boolean).join(", ");
    return (
      <tr className="border-b border-line-2 last:border-0 hover:bg-page/60">
        <td className="px-7 py-3.5">
          <Link href={`/leases/${l.id}`} className="font-semibold hover:text-link">{names || "No tenant"}</Link>
          <div className="text-[13px] text-muted">{unit.properties.name}, {unit.label}</div>
        </td>
        <td className="px-3 py-3.5 text-ink-2 whitespace-nowrap">
          {fmtDate(l.start_date)} to {l.end_date ? fmtDate(l.end_date) : "month to month"}
        </td>
        <td className="px-3 py-3.5 text-right font-semibold tabular">{money(l.rent_cents)}</td>
        <td className="px-3 py-3.5">
          {l.status === "active" ? <Pill tone="blue">Active</Pill> : l.status === "ended" ? <Pill tone="gray">Ended</Pill> : <Pill tone="amber">Draft</Pill>}
        </td>
        <td className="px-7 py-2 text-right"><Button href={`/leases/${l.id}`} variant="secondary">Open</Button></td>
      </tr>
    );
  }

  return (
    <>
      <PageHeader
        title="Leases"
        subtitle={`${active.length} active`}
        actions={<Button href="/leases/new">New lease</Button>}
      />
      <Card>
        {!leases || leases.length === 0 ? (
          <Empty
            title="No leases yet"
            body="A lease ties a tenant to a unit with a rent amount and dates. Once a lease is active the unit shows as rented."
            action={<Button href="/leases/new">Set up a lease</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-[13px] font-semibold text-muted">
                  <th className="px-7 py-3.5 border-b border-line">Tenant and unit</th>
                  <th className="px-3 py-3.5 border-b border-line">Term</th>
                  <th className="px-3 py-3.5 border-b border-line text-right">Rent</th>
                  <th className="px-3 py-3.5 border-b border-line">Status</th>
                  <th className="px-7 py-3.5 border-b border-line text-right"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {active.map((l) => <Row key={l.id} l={l} />)}
                {other.map((l) => <Row key={l.id} l={l} />)}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
