import Link from "next/link";
import { requireAccount } from "@/lib/data";
import { Button, Card, Empty, PageHeader, Pill } from "@/components/ui";

export const metadata = { title: "Tenants" };

export default async function TenantsPage() {
  const { supabase, account } = await requireAccount();
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, full_name, email, phone, user_id, lease_tenants(leases(id, status, units(label, properties(name))))")
    .eq("account_id", account.id)
    .order("full_name");

  return (
    <>
      <PageHeader
        title="Tenants"
        subtitle={`${tenants?.length ?? 0} ${tenants?.length === 1 ? "tenant" : "tenants"}`}
        actions={<Button href="/tenants/new">Add tenant</Button>}
      />
      <Card>
        {!tenants || tenants.length === 0 ? (
          <Empty
            title="No tenants yet"
            body="Add the people who rent from you. Once a tenant is on a lease you can invite them to the tenant portal."
            action={<Button href="/tenants/new">Add a tenant</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-[13px] font-semibold text-muted">
                  <th className="px-7 py-3.5 border-b border-line">Tenant</th>
                  <th className="px-3 py-3.5 border-b border-line">Contact</th>
                  <th className="px-3 py-3.5 border-b border-line">Unit</th>
                  <th className="px-3 py-3.5 border-b border-line">Portal</th>
                  <th className="px-7 py-3.5 border-b border-line text-right"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => {
                  type LT = { leases: { id: string; status: string; units: { label: string; properties: { name: string } } } };
                  const active = ((t.lease_tenants as unknown as LT[]) ?? []).map((lt) => lt.leases).find((l) => l?.status === "active");
                  return (
                    <tr key={t.id} className="border-b border-line-2 last:border-0 hover:bg-page/60">
                      <td className="px-7 py-3.5">
                        <Link href={`/tenants/${t.id}`} className="font-semibold hover:text-link">{t.full_name}</Link>
                      </td>
                      <td className="px-3 py-3.5 text-ink-2">
                        <div>{t.email ?? <span className="text-muted">No email</span>}</div>
                        {t.phone ? <div className="text-[13px] text-muted">{t.phone}</div> : null}
                      </td>
                      <td className="px-3 py-3.5 text-ink-2">
                        {active ? `${active.units.properties.name}, ${active.units.label}` : <span className="text-muted">No active lease</span>}
                      </td>
                      <td className="px-3 py-3.5">{t.user_id ? <Pill tone="blue">Signed up</Pill> : <Pill tone="gray">Not invited</Pill>}</td>
                      <td className="px-7 py-2 text-right">
                        <Button href={`/tenants/${t.id}`} variant="secondary">Open</Button>
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
