import Link from "next/link";
import { requireAccount } from "@/lib/data";
import { Card, PageHeader, Pill, money } from "@/components/ui";

export const metadata = { title: "Search" };

type Hit = { href: string; title: string; sub: string; kind: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  const { supabase, account } = await requireAccount();

  let hits: Hit[] = [];
  if (term.length >= 1) {
    const like = `%${term.replace(/[%_]/g, "")}%`;
    const [{ data: tenants }, { data: properties }, { data: units }, { data: repairs }] = await Promise.all([
      supabase.from("tenants").select("id, full_name, email, phone, lease_tenants(leases(status, units(label, properties(name))))").eq("account_id", account.id).or(`full_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`).limit(20),
      supabase.from("properties").select("id, name, address_line1, city").eq("account_id", account.id).or(`name.ilike.${like},address_line1.ilike.${like},city.ilike.${like}`).limit(20),
      supabase.from("units").select("id, label, market_rent_cents, properties(id, name), leases(id, status)").eq("account_id", account.id).ilike("label", like).limit(20),
      supabase.from("maintenance_requests").select("id, title, status, properties(name), units(label)").eq("account_id", account.id).ilike("title", like).limit(20),
    ]);
    type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    hits = [
      ...((tenants ?? []) as Any[]).map((t) => {
        const active = (t.lease_tenants ?? []).map((lt: Any) => lt.leases).find((l: Any) => l?.status === "active");
        return { kind: "Tenant", href: `/tenants/${t.id}`, title: t.full_name, sub: [t.email, t.phone, active ? `${active.units?.properties?.name}, ${active.units?.label}` : "No active lease"].filter(Boolean).join(" · ") };
      }),
      ...((properties ?? []) as Any[]).map((p) => ({ kind: "Property", href: `/properties/${p.id}`, title: p.name, sub: `${p.address_line1}, ${p.city}` })),
      ...((units ?? []) as Any[]).map((u) => {
        const lease = (u.leases ?? []).find((l: Any) => l.status === "active");
        return { kind: "Unit", href: lease ? `/leases/${lease.id}` : `/properties/${u.properties?.id}`, title: `${u.properties?.name}, ${u.label}`, sub: lease ? "Rented" : `Vacant${u.market_rent_cents ? `, market rent ${money(u.market_rent_cents)}` : ""}` };
      }),
      ...((repairs ?? []) as Any[]).map((r) => ({ kind: "Repair", href: `/maintenance/${r.id}`, title: r.title, sub: `${r.properties?.name ?? ""}${r.units ? `, ${r.units.label}` : ""} · ${r.status.replace("_", " ")}` })),
    ];
  }

  return (
    <>
      <PageHeader title={term ? `Results for "${term}"` : "Search"} subtitle={term ? `${hits.length} ${hits.length === 1 ? "match" : "matches"} across tenants, properties, units and repairs` : "Type a name, address, unit or repair in the box on the left."} />
      {term && hits.length === 0 ? (
        <Card className="p-7"><p className="text-[15px] text-muted">Nothing matched. Try part of a name or an address.</p></Card>
      ) : hits.length > 0 ? (
        <Card>
          <ul>
            {hits.map((h) => (
              <li key={h.kind + h.href + h.title}>
                <Link href={h.href} className="flex items-center justify-between gap-4 px-6 py-3.5 border-b border-line-2 last:border-0 hover:bg-page/60">
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[15px] font-semibold truncate">{h.title}</span>
                    <span className="text-[13px] text-muted truncate">{h.sub}</span>
                  </span>
                  <Pill tone="gray">{h.kind}</Pill>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
