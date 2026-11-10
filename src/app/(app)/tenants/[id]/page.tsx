import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/data";
import { Button, Card, PageHeader, Pill, fmtDate, money } from "@/components/ui";
import { deleteTenant } from "../actions";

export default async function TenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, account } = await requireAccount();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*, lease_tenants(leases(id, status, start_date, end_date, rent_cents, deposit_cents, units(id, label, properties(id, name))))")
    .eq("id", id)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!tenant) notFound();

  type L = {
    id: string;
    status: string;
    start_date: string;
    end_date: string | null;
    rent_cents: number;
    deposit_cents: number;
    units: { id: string; label: string; properties: { id: string; name: string } };
  };
  const leases = ((tenant.lease_tenants as unknown as { leases: L }[]) ?? [])
    .map((lt) => lt.leases)
    .filter(Boolean)
    .sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  const active = leases.find((l) => l.status === "active");

  return (
    <>
      <PageHeader
        title={tenant.full_name}
        subtitle={active ? `${active.units.properties.name}, ${active.units.label}` : "No active lease"}
        actions={
          <>
            <Button href={`/tenants/${tenant.id}/edit`} variant="secondary">Edit</Button>
            {!active ? <Button href={`/leases/new?tenant=${tenant.id}`}>Set up a lease</Button> : null}
          </>
        }
      />

      <div className="flex flex-wrap gap-6">
        <Card className="flex-[1_1_300px] min-w-0 px-7 py-6 flex flex-col gap-4">
          <h2 className="font-display font-semibold text-xl">Contact</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted">Email</dt>
              <dd className="font-medium">{tenant.email ? <a href={`mailto:${tenant.email}`} className="hover:text-link">{tenant.email}</a> : <span className="text-muted">Not added</span>}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted">Phone</dt>
              <dd className="font-medium">{tenant.phone ? <a href={`tel:${tenant.phone}`} className="hover:text-link">{tenant.phone}</a> : <span className="text-muted">Not added</span>}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted">Tenant portal</dt>
              <dd>{tenant.user_id ? <Pill tone="blue">Signed up</Pill> : <Pill tone="gray">Not invited yet</Pill>}</dd>
            </div>
          </dl>
          {!tenant.user_id ? (
            <p className="text-[13px] text-muted">Portal invites turn on with rent collection in the next update.</p>
          ) : null}
        </Card>

        <Card className="flex-[2_1_380px] min-w-0 px-7 py-6 flex flex-col gap-3">
          <h2 className="font-display font-semibold text-xl">Leases</h2>
          {leases.length === 0 ? (
            <p className="text-[15px] text-muted">This tenant isn&apos;t on a lease yet.</p>
          ) : (
            <ul className="flex flex-col">
              {leases.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-line-2 last:border-0">
                  <div className="flex flex-col gap-0.5">
                    <Link href={`/leases/${l.id}`} className="text-sm font-semibold hover:text-link">
                      {l.units.properties.name}, {l.units.label}
                    </Link>
                    <span className="text-[13px] text-muted">
                      {fmtDate(l.start_date)} to {l.end_date ? fmtDate(l.end_date) : "month to month"}. {money(l.rent_cents)}/mo
                    </span>
                  </div>
                  {l.status === "active" ? <Pill tone="blue">Active</Pill> : l.status === "ended" ? <Pill tone="gray">Ended</Pill> : <Pill tone="amber">Draft</Pill>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {tenant.notes ? (
        <Card className="px-7 py-6 flex flex-col gap-2">
          <h2 className="font-display font-semibold text-xl">Notes</h2>
          <p className="text-[15px] leading-relaxed text-ink-2 whitespace-pre-line">{tenant.notes}</p>
        </Card>
      ) : null}

      <details className="max-w-[640px]">
        <summary className="cursor-pointer text-sm text-muted select-none">Remove this tenant</summary>
        <form action={deleteTenant} className="mt-3 flex flex-wrap items-center gap-3 p-4 rounded-[10px] bg-red-bg">
          <input type="hidden" name="id" value={tenant.id} />
          <p className="text-sm text-red-ink flex-1 min-w-[200px]">Removes the tenant and takes them off any leases. It can&apos;t be undone.</p>
          <Button type="submit" variant="danger">Delete tenant</Button>
        </form>
      </details>
    </>
  );
}
