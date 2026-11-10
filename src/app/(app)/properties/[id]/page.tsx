import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/data";
import { Button, Card, Field, Notice, PageHeader, Pill, money } from "@/components/ui";
import { createUnit, deleteProperty } from "../actions";

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, account } = await requireAccount();

  const { data: property } = await supabase
    .from("properties")
    .select("*, units(id, label, bedrooms, bathrooms, square_feet, market_rent_cents, leases(id, status, rent_cents, end_date, lease_tenants(tenants(id, full_name))))")
    .eq("id", id)
    .eq("account_id", account.id)
    .maybeSingle();

  if (!property) notFound();

  type UnitRow = {
    id: string;
    label: string;
    bedrooms: number | null;
    bathrooms: number | null;
    square_feet: number | null;
    market_rent_cents: number | null;
    leases: { id: string; status: string; rent_cents: number; end_date: string | null; lease_tenants: { tenants: { id: string; full_name: string } }[] }[];
  };
  const units = ((property.units as unknown as UnitRow[]) ?? []).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true }),
  );
  const isMulti = property.property_type === "multi_family" || property.property_type === "commercial" || property.property_type === "other";

  return (
    <>
      <PageHeader
        title={property.name}
        subtitle={`${property.address_line1}${property.address_line2 ? ", " + property.address_line2 : ""}, ${property.city}, ${property.state} ${property.zip}`}
        actions={
          <>
            <Button href={`/properties/${property.id}/edit`} variant="secondary">Edit</Button>
            <Button href="/tenants/new" variant="secondary">Add tenant</Button>
          </>
        }
      />

      {error ? <Notice tone="error">{error}</Notice> : null}

      <Card className="flex flex-col">
        <div className="flex items-center justify-between gap-3 px-7 pt-6 pb-2">
          <h2 className="font-display font-semibold text-xl">Units</h2>
          <span className="text-sm text-muted">{units.length} {units.length === 1 ? "unit" : "units"}</span>
        </div>
        {units.length === 0 ? (
          <p className="px-7 pb-6 text-[15px] text-muted">No units yet. Add one below.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-[13px] font-semibold text-muted">
                  <th className="px-7 py-3 border-b border-line">Unit</th>
                  <th className="px-3 py-3 border-b border-line">Size</th>
                  <th className="px-3 py-3 border-b border-line text-right">Market rent</th>
                  <th className="px-3 py-3 border-b border-line">Tenant</th>
                  <th className="px-3 py-3 border-b border-line">Status</th>
                  <th className="px-7 py-3 border-b border-line text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => {
                  const active = u.leases?.find((l) => l.status === "active");
                  const names = active?.lease_tenants?.map((lt) => lt.tenants?.full_name).filter(Boolean) ?? [];
                  const size = [
                    u.bedrooms != null ? `${u.bedrooms} bd` : null,
                    u.bathrooms != null ? `${u.bathrooms} ba` : null,
                    u.square_feet != null ? `${u.square_feet.toLocaleString()} sq ft` : null,
                  ]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <tr key={u.id} className="border-b border-line-2 last:border-0">
                      <td className="px-7 py-3.5 font-semibold">{u.label}</td>
                      <td className="px-3 py-3.5 text-ink-2">{size || <span className="text-muted">Not set</span>}</td>
                      <td className="px-3 py-3.5 text-right tabular">{u.market_rent_cents != null ? money(u.market_rent_cents) : <span className="text-muted">Not set</span>}</td>
                      <td className="px-3 py-3.5">
                        {names.length ? (
                          names.map((n, i) => {
                            const t = active!.lease_tenants[i].tenants;
                            return (
                              <span key={t.id}>
                                <Link href={`/tenants/${t.id}`} className="font-medium hover:text-link">{n}</Link>
                                {i < names.length - 1 ? ", " : ""}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        {active ? <Pill tone="blue">Rented, {money(active.rent_cents)}/mo</Pill> : <Pill tone="amber">Vacant</Pill>}
                      </td>
                      <td className="px-7 py-2 text-right whitespace-nowrap">
                        {active ? (
                          <Button href={`/leases/${active.id}`} variant="secondary">Lease</Button>
                        ) : (
                          <Button href={`/leases/new?unit=${u.id}`} variant="secondary">Add lease</Button>
                        )}{" "}
                        <Button href={`/properties/${property.id}/units/${u.id}`} variant="secondary">Edit</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <form action={createUnit} className="flex flex-col gap-4 px-7 py-6 border-t border-line bg-page/50 rounded-b-[14px]">
          <input type="hidden" name="property_id" value={property.id} />
          <h3 className="text-[15px] font-semibold">Add a unit</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Field label="Unit name" name="label" required placeholder={isMulti ? "2B" : "Basement"} />
            <Field label="Bedrooms" name="bedrooms" inputMode="decimal" step="0.5" min="0" />
            <Field label="Bathrooms" name="bathrooms" inputMode="decimal" step="0.5" min="0" />
            <Field label="Sq ft" name="square_feet" inputMode="numeric" />
            <Field label="Market rent" name="market_rent" inputMode="decimal" placeholder="1,400" />
          </div>
          <div>
            <Button type="submit" variant="secondary">Add unit</Button>
          </div>
        </form>
      </Card>

      {property.notes ? (
        <Card className="px-7 py-6 flex flex-col gap-2">
          <h2 className="font-display font-semibold text-xl">Notes</h2>
          <p className="text-[15px] leading-relaxed text-ink-2 whitespace-pre-line">{property.notes}</p>
        </Card>
      ) : null}

      <details className="max-w-[640px]">
        <summary className="cursor-pointer text-sm text-muted select-none">Remove this property</summary>
        <form action={deleteProperty} className="mt-3 flex flex-wrap items-center gap-3 p-4 rounded-[10px] bg-red-bg">
          <input type="hidden" name="id" value={property.id} />
          <p className="text-sm text-red-ink flex-1 min-w-[200px]">This deletes the property, its units and their leases. It can&apos;t be undone.</p>
          <Button type="submit" variant="danger">Delete property</Button>
        </form>
      </details>
    </>
  );
}
