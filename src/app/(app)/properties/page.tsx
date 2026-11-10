import Link from "next/link";
import { requireAccount } from "@/lib/data";
import { Button, Card, Empty, PageHeader, Pill } from "@/components/ui";

export const metadata = { title: "Properties" };

const typeLabel: Record<string, string> = {
  single_family: "Single family",
  multi_family: "Multi family",
  condo: "Condo",
  townhouse: "Townhouse",
  commercial: "Commercial",
  other: "Other",
};

export default async function PropertiesPage() {
  const { supabase, account } = await requireAccount();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, address_line1, city, state, zip, property_type, units(id, leases(id, status))")
    .eq("account_id", account.id)
    .order("name");

  return (
    <>
      <PageHeader
        title="Properties"
        subtitle={`${properties?.length ?? 0} ${properties?.length === 1 ? "property" : "properties"}`}
        actions={<Button href="/properties/new">Add property</Button>}
      />
      <Card>
        {!properties || properties.length === 0 ? (
          <Empty
            title="No properties yet"
            body="Add each address you rent out. A house is one property with one unit. A duplex or apartment building is one property with several units."
            action={<Button href="/properties/new">Add a property</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-[13px] font-semibold text-muted">
                  <th className="px-7 py-3.5 border-b border-line">Property</th>
                  <th className="px-3 py-3.5 border-b border-line">Type</th>
                  <th className="px-3 py-3.5 border-b border-line text-right">Units</th>
                  <th className="px-3 py-3.5 border-b border-line text-right">Rented</th>
                  <th className="px-7 py-3.5 border-b border-line text-right"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => {
                  const units = (p.units as unknown as { id: string; leases: { status: string }[] }[]) ?? [];
                  const rented = units.filter((u) => u.leases?.some((l) => l.status === "active")).length;
                  return (
                    <tr key={p.id} className="border-b border-line-2 last:border-0 hover:bg-page/60">
                      <td className="px-7 py-3.5">
                        <Link href={`/properties/${p.id}`} className="font-semibold hover:text-link">{p.name}</Link>
                        <div className="text-[13px] text-muted">
                          {p.address_line1}, {p.city}, {p.state} {p.zip}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-ink-2">{typeLabel[p.property_type] ?? p.property_type}</td>
                      <td className="px-3 py-3.5 text-right tabular">{units.length}</td>
                      <td className="px-3 py-3.5 text-right">
                        {units.length === 0 ? (
                          <Pill tone="gray">No units</Pill>
                        ) : rented === units.length ? (
                          <Pill tone="blue">All rented</Pill>
                        ) : (
                          <Pill tone="amber">{units.length - rented} vacant</Pill>
                        )}
                      </td>
                      <td className="px-7 py-2 text-right">
                        <Button href={`/properties/${p.id}`} variant="secondary">Open</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
