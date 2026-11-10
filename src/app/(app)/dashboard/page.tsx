import Link from "next/link";
import { requireAccount } from "@/lib/data";
import { Button, Card, Empty, PageHeader, Pill, fmtDate, money } from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { supabase, account } = await requireAccount();

  const [{ data: properties }, { data: units }, { data: tenants }, { data: leases }] = await Promise.all([
    supabase.from("properties").select("id, name").eq("account_id", account.id),
    supabase.from("units").select("id, label, property_id, market_rent_cents").eq("account_id", account.id),
    supabase.from("tenants").select("id").eq("account_id", account.id),
    supabase
      .from("leases")
      .select("id, unit_id, rent_cents, end_date, status, units(label, properties(name)), lease_tenants(tenants(full_name))")
      .eq("account_id", account.id)
      .eq("status", "active"),
  ]);

  const unitCount = units?.length ?? 0;
  const activeLeases = leases ?? [];
  const rentedUnitIds = new Set(activeLeases.map((l) => l.unit_id));
  const rentedCount = rentedUnitIds.size;
  const vacant = (units ?? []).filter((u) => !rentedUnitIds.has(u.id));
  const monthlyRent = activeLeases.reduce((s, l) => s + (l.rent_cents ?? 0), 0);
  const propertyName = new Map((properties ?? []).map((p) => [p.id, p.name]));

  const today = new Date();
  const in90 = new Date(today);
  in90.setDate(in90.getDate() + 90);
  const endingSoon = activeLeases
    .filter((l) => l.end_date && new Date(l.end_date) <= in90)
    .sort((a, b) => (a.end_date! < b.end_date! ? -1 : 1));

  const dateLine = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if ((properties?.length ?? 0) === 0) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle={dateLine} />
        <Card>
          <Empty
            title="Add your first property"
            body="Start with an address and its units. Then add tenants and set up their leases. Rent collection comes next."
            action={<Button href="/properties/new">Add a property</Button>}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={dateLine}
        actions={
          <>
            <Button href="/tenants/new" variant="secondary">Add tenant</Button>
            <Button href="/properties/new">Add property</Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-6">
        <Card className="flex-[2_1_380px] min-w-0 p-7 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-muted">Monthly rent on active leases</h2>
            <Link href="/leases" className="text-sm font-semibold text-link hover:text-link-dark">All leases</Link>
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-display font-semibold text-[56px] leading-none tabular">{money(monthlyRent)}</span>
            <span className="text-base text-muted">across {activeLeases.length} {activeLeases.length === 1 ? "lease" : "leases"}</span>
          </div>
          <p className="text-sm text-muted">Online rent collection is coming next. For now this is what your leases add up to.</p>
        </Card>

        <Card className="flex-[1_1_300px] min-w-0 p-7 flex flex-col gap-5">
          <h2 className="text-[15px] font-semibold text-muted">Units</h2>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-display font-semibold text-[56px] leading-none">{rentedCount}</span>
            <span className="text-base text-muted">of {unitCount} rented</span>
          </div>
          <div role="img" aria-label={`${rentedCount} rented units and ${vacant.length} vacant`} className="flex flex-wrap gap-[5px]">
            {(units ?? []).map((u) => (
              <span
                key={u.id}
                className={`w-3.5 h-3.5 rounded-[3px] ${rentedUnitIds.has(u.id) ? "bg-navy" : "box-border border-2 border-field-strong"}`}
              />
            ))}
          </div>
          {vacant.length > 0 ? (
            <p className="text-sm leading-normal text-muted">
              <strong className="font-semibold text-ink">Vacant:</strong>{" "}
              {vacant.slice(0, 3).map((u) => `${propertyName.get(u.property_id) ?? ""}, ${u.label}`).join("; ")}
              {vacant.length > 3 ? ` and ${vacant.length - 3} more` : ""}
            </p>
          ) : unitCount > 0 ? (
            <p className="text-sm text-muted">Every unit has an active lease.</p>
          ) : (
            <p className="text-sm text-muted">Add units to your properties to see them here.</p>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap gap-6">
        <Card className="flex-[3_1_480px] min-w-0 px-7 py-6 flex flex-col gap-2">
          <h2 className="font-display font-semibold text-xl">Leases ending in the next 90 days</h2>
          {endingSoon.length === 0 ? (
            <p className="py-3 text-[15px] text-muted">Nothing ending soon.</p>
          ) : (
            <ul className="flex flex-col">
              {endingSoon.map((l) => {
                const unit = l.units as unknown as { label: string; properties: { name: string } } | null;
                const names = (l.lease_tenants as unknown as { tenants: { full_name: string } }[])
                  .map((lt) => lt.tenants?.full_name)
                  .filter(Boolean)
                  .join(", ");
                return (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 border-b border-line-2 last:border-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">{names || "No tenant on lease"}</span>
                      <span className="text-[13px] text-muted">
                        {unit?.properties?.name}, {unit?.label}. Lease ends {fmtDate(l.end_date)}
                      </span>
                    </div>
                    <Button href={`/leases/${l.id}`} variant="secondary">Open lease</Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="flex-[2_1_320px] min-w-0 px-7 py-6 flex flex-col gap-3">
          <h2 className="font-display font-semibold text-xl">Your portfolio</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted">Properties</dt>
            <dd className="font-semibold text-right tabular">{properties?.length ?? 0}</dd>
            <dt className="text-muted">Units</dt>
            <dd className="font-semibold text-right tabular">{unitCount}</dd>
            <dt className="text-muted">Tenants</dt>
            <dd className="font-semibold text-right tabular">{tenants?.length ?? 0}</dd>
            <dt className="text-muted">Active leases</dt>
            <dd className="font-semibold text-right tabular">{activeLeases.length}</dd>
          </dl>
          <div className="flex flex-wrap gap-2 pt-2">
            <Pill tone="gray">Rent collection: coming next</Pill>
          </div>
        </Card>
      </div>
    </>
  );
}
