import Link from "next/link";
import { requireAccount } from "@/lib/data";
import { Button, Card, Empty, PageHeader, Pill, fmtDate, money, moneyExact } from "@/components/ui";
import { STATUS, URGENCY } from "@/lib/maintenance";
import { RepairDonut } from "@/components/repair-donut";

export const metadata = { title: "Dashboard" };

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const Icon = ({ d, tone }: { d: React.ReactNode; tone: "green" | "blue" | "amber" | "navy" }) => {
  const bg = { green: "bg-green-bg text-green-ink", blue: "bg-blue-bg text-blue-ink", amber: "bg-amber-bg text-amber-ink", navy: "bg-page text-navy" }[tone];
  return (
    <span className={`w-9 h-9 rounded-[10px] inline-flex items-center justify-center ${bg}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]">{d}</svg>
    </span>
  );
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ property?: string }> }) {
  const { property: propertyFilter } = await searchParams;
  const { supabase, account } = await requireAccount();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const monthStart = `${todayStr.slice(0, 7)}-01`;

  const [{ data: properties }, { data: units }, { data: tenants }, { data: leases }, { data: repairs }, { data: charges }, { data: paymentsThisMonth }, { data: settings }, { count: docCount }, { count: keyCount }] = await Promise.all([
    supabase.from("properties").select("id, name").eq("account_id", account.id).order("name"),
    supabase.from("units").select("id, label, property_id, market_rent_cents").eq("account_id", account.id),
    supabase.from("tenants").select("id, user_id, invited_at").eq("account_id", account.id),
    supabase.from("leases").select("id, unit_id, rent_cents, end_date, status, units(label, property_id, properties(name)), lease_tenants(tenants(full_name))").eq("account_id", account.id).eq("status", "active"),
    supabase.from("maintenance_requests").select("id, title, urgency, status, scheduled_for, created_at, property_id, units(label), properties(name)").eq("account_id", account.id).in("status", ["new", "scheduled", "in_progress"]).order("created_at", { ascending: false }),
    supabase.from("rent_charges").select("id, lease_id, due_date, amount_cents, late_fee_cents, paid_cents, status, leases(unit_id, units(property_id))").eq("account_id", account.id).in("status", ["due", "partial"]),
    supabase.from("payments").select("amount_cents, lease_id, leases(units(property_id))").eq("account_id", account.id).eq("status", "succeeded").gte("paid_at", `${monthStart}T00:00:00Z`),
    supabase.from("payment_settings").select("charges_enabled, payouts_enabled, stripe_account_id").eq("account_id", account.id).maybeSingle(),
    supabase.from("lease_documents").select("id", { count: "exact", head: true }).eq("account_id", account.id),
    supabase.from("api_keys").select("id", { count: "exact", head: true }).eq("account_id", account.id).is("revoked_at", null),
  ]);

  const dateLine = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if ((properties?.length ?? 0) === 0) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle={dateLine} />
        <Card>
          <Empty
            title="Add your first property"
            body="Start with an address and its units. Then add tenants and set up their leases. Rent collection and repairs come after."
            action={<Button href="/properties/new">Add a property</Button>}
          />
        </Card>
      </>
    );
  }

  // Property filter narrows every number on the page.
  const pf = propertyFilter && (properties ?? []).some((p) => p.id === propertyFilter) ? propertyFilter : null;
  const inScope = (propertyId: string | null | undefined) => !pf || propertyId === pf;

  const unitList = (units ?? []).filter((u) => inScope(u.property_id));
  const activeLeases = ((leases ?? []) as unknown as Any[]).filter((l) => inScope(l.units?.property_id));
  const rentedUnitIds = new Set(activeLeases.map((l) => l.unit_id));
  const openCharges = ((charges ?? []) as unknown as Any[]).filter((c) => inScope(c.leases?.units?.property_id));
  const outstanding = openCharges.reduce((s, c) => s + Math.max(0, c.amount_cents + c.late_fee_cents - c.paid_cents), 0);
  const lateCount = openCharges.filter((c) => c.due_date < todayStr).length;
  const collected = ((paymentsThisMonth ?? []) as unknown as Any[]).filter((p) => inScope(p.leases?.units?.property_id)).reduce((s, p) => s + p.amount_cents, 0);
  const monthlyRent = activeLeases.reduce((s, l) => s + (l.rent_cents ?? 0), 0);

  type Repair = { id: string; title: string; urgency: string; status: string; scheduled_for: string | null; created_at: string; property_id: string; units: { label: string } | null; properties: { name: string } | null };
  const rank = { emergency: 0, urgent: 1, routine: 2 } as Record<string, number>;
  const openRepairs = ((repairs ?? []) as unknown as Repair[]).filter((r) => inScope(r.property_id)).sort((a, b) => rank[a.urgency] - rank[b.urgency] || (a.created_at < b.created_at ? -1 : 1));
  const repairCounts = { new: 0, scheduled: 0, in_progress: 0 } as Record<string, number>;
  openRepairs.forEach((r) => (repairCounts[r.status] = (repairCounts[r.status] ?? 0) + 1));
  const urgentRepairs = openRepairs.filter((r) => r.urgency !== "routine").length;

  const occupancy = unitList.length ? Math.round((rentedUnitIds.size / unitList.length) * 100) : 0;
  const vacant = unitList.filter((u) => !rentedUnitIds.has(u.id));
  const propertyName = new Map((properties ?? []).map((p) => [p.id, p.name]));

  const in90 = new Date(today);
  in90.setDate(in90.getDate() + 90);
  const endingSoon = activeLeases.filter((l) => l.end_date && new Date(l.end_date) <= in90).sort((a, b) => (a.end_date < b.end_date ? -1 : 1));

  // Setup checklist. Items disappear as they get done.
  const online = Boolean(settings?.charges_enabled && settings?.payouts_enabled);
  const notInvited = (tenants ?? []).filter((t) => !t.user_id && !t.invited_at).length;
  const suggested: { href: string; label: string; count?: number }[] = [];
  if (!online) suggested.push({ href: "/settings/payments", label: settings?.stripe_account_id ? "Finish connecting your bank" : "Connect your bank so tenants can pay online" });
  if (notInvited > 0) suggested.push({ href: "/tenants", label: "Invite tenants to the portal", count: notInvited });
  if ((docCount ?? 0) === 0 && activeLeases.length > 0) suggested.push({ href: "/leases", label: "Upload a lease to e-sign" });
  if (vacant.length > 0) suggested.push({ href: "/leases/new", label: "Set up a lease for a vacant unit", count: vacant.length });
  if ((keyCount ?? 0) === 0) suggested.push({ href: "/settings/integrations", label: "Connect Zapier" });

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

      {(properties?.length ?? 0) > 1 ? (
        <form className="flex flex-wrap items-center gap-2" method="get">
          <label htmlFor="f-property" className="sr-only">Property</label>
          <select id="f-property" name="property" defaultValue={pf ?? ""} className="min-h-10 px-3 pr-8 rounded-[9px] border border-line bg-white text-sm font-medium">
            <option value="">All properties</option>
            {(properties ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button type="submit" className="min-h-10 px-3.5 rounded-[9px] border border-line bg-white text-sm font-semibold hover:bg-page">Apply</button>
          {pf ? <Link href="/dashboard" className="text-sm font-semibold text-link">Clear</Link> : null}
        </form>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/rent?filter=due" className="bg-white border border-line rounded-[14px] p-5 flex flex-col gap-3 hover:border-field">
          <div className="flex items-center gap-3">
            <Icon tone="green" d={<><path d="M12 2v20" /><path d="M17 6.5a4 4 0 0 0-3.5-2h-3a3.5 3.5 0 0 0 0 7h3a3.5 3.5 0 0 1 0 7h-3a4 4 0 0 1-3.5-2" /></>} />
            <span className="font-display font-semibold text-[26px] leading-none tabular">{money(outstanding)}</span>
            <span className="text-[12px] text-muted ml-auto">{openCharges.length} {openCharges.length === 1 ? "charge" : "charges"}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">Outstanding balance</span>
            <span className="text-[13px] text-muted">{lateCount > 0 ? `${lateCount} past due` : "Nothing past due"}</span>
          </div>
        </Link>

        <Link href="/rent" className="bg-white border border-line rounded-[14px] p-5 flex flex-col gap-3 hover:border-field">
          <div className="flex items-center gap-3">
            <Icon tone="blue" d={<><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19" /><path d="M6.5 15h4" /></>} />
            <span className="font-display font-semibold text-[26px] leading-none tabular">{money(collected)}</span>
            <span className="text-[12px] text-muted ml-auto">of {money(monthlyRent)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">Collected this month</span>
            <span className="text-[13px] text-muted">{activeLeases.length} active {activeLeases.length === 1 ? "lease" : "leases"}</span>
          </div>
        </Link>

        <Link href="/maintenance" className="bg-white border border-line rounded-[14px] p-5 flex flex-col gap-3 hover:border-field">
          <div className="flex items-center gap-3">
            <Icon tone="amber" d={<path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18l3 3 6.5-6.5a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.1-.7-.7-2.1z" />} />
            <span className="font-display font-semibold text-[26px] leading-none tabular">{openRepairs.length}</span>
            {urgentRepairs > 0 ? <span className="text-[12px] font-semibold text-amber-ink ml-auto">{urgentRepairs} urgent</span> : null}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">Open repairs</span>
            <span className="text-[13px] text-muted">{repairCounts.new} new, {repairCounts.scheduled} scheduled</span>
          </div>
        </Link>

        <Link href="/properties" className="bg-white border border-line rounded-[14px] p-5 flex flex-col gap-3 hover:border-field">
          <div className="flex items-center gap-3">
            <Icon tone="navy" d={<><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" /><path d="M15 10h4a1 1 0 0 1 1 1v10" /><path d="M2 21h20" /></>} />
            <span className="font-display font-semibold text-[26px] leading-none tabular">{occupancy}%</span>
            <span className="text-[12px] text-muted ml-auto">of {unitList.length} {unitList.length === 1 ? "unit" : "units"}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">Occupancy</span>
            <span className="text-[13px] text-muted">{vacant.length === 0 ? "Every unit is rented" : `${vacant.length} vacant`}</span>
          </div>
        </Link>
      </div>

      <div className="flex flex-wrap gap-5 items-start">
        <div className="flex-[3_1_460px] min-w-0 flex flex-col gap-5">
          {suggested.length > 0 ? (
            <Card>
              <div className="px-6 pt-5 pb-2"><h2 className="font-display font-semibold text-xl">Suggested</h2></div>
              <ul>
                {suggested.map((s) => (
                  <li key={s.href + s.label}>
                    <Link href={s.href} className="flex items-center justify-between gap-3 px-6 py-3.5 border-t border-line-2 hover:bg-page/60">
                      <span className="flex items-center gap-3 text-[15px] font-medium">
                        <span aria-hidden="true" className="w-7 h-7 rounded-lg bg-page inline-flex items-center justify-center text-link">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                        </span>
                        {s.label}
                      </span>
                      {s.count != null ? <span className="text-sm font-semibold tabular text-muted">{s.count}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card>
            <div className="px-6 pt-5 pb-2 flex items-center justify-between gap-3">
              <h2 className="font-display font-semibold text-xl">Leases ending in the next 90 days</h2>
              <Link href="/leases" className="text-sm font-semibold text-link hover:text-link-dark">All leases</Link>
            </div>
            {endingSoon.length === 0 ? (
              <p className="px-6 pb-5 text-[15px] text-muted">Nothing ending soon.</p>
            ) : (
              <ul>
                {endingSoon.map((l) => {
                  const names = ((l.lease_tenants ?? []) as Any[]).map((lt) => lt.tenants?.full_name).filter(Boolean).join(", ");
                  return (
                    <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-t border-line-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold">{names || "No tenant on lease"}</span>
                        <span className="text-[13px] text-muted">{l.units?.properties?.name}, {l.units?.label}. Ends {fmtDate(l.end_date)}. {moneyExact(l.rent_cents)}/mo</span>
                      </div>
                      <Button href={`/leases/${l.id}`} variant="secondary">Open lease</Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {vacant.length > 0 ? (
            <Card className="px-6 py-5 flex flex-col gap-1">
              <h2 className="font-display font-semibold text-xl">Vacant units</h2>
              <p className="text-[15px] text-muted">
                {vacant.slice(0, 4).map((u) => `${propertyName.get(u.property_id) ?? ""}, ${u.label}`).join("; ")}
                {vacant.length > 4 ? ` and ${vacant.length - 4} more` : ""}
              </p>
            </Card>
          ) : null}
        </div>

        <Card className="flex-[2_1_320px] min-w-0 px-6 py-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold text-xl">Repairs</h2>
            <Link href="/maintenance" className="text-sm font-semibold text-link hover:text-link-dark">All</Link>
          </div>
          {openRepairs.length === 0 ? (
            <p className="text-[15px] text-muted">Nothing open. Tenants send requests from their portal, or log one yourself.</p>
          ) : (
            <>
              <RepairDonut counts={[
                { label: "New", value: repairCounts.new, color: "#FFAE3D" },
                { label: "Scheduled", value: repairCounts.scheduled, color: "#1492FF" },
                { label: "In progress", value: repairCounts.in_progress, color: "#0E1730" },
              ]} />
              <ul className="flex flex-col">
                {openRepairs.slice(0, 4).map((r) => (
                  <li key={r.id}>
                    <Link href={`/maintenance/${r.id}`} className="flex items-center justify-between gap-3 py-2.5 border-t border-line-2">
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-semibold truncate">{r.title}</span>
                        <span className="text-[13px] text-muted">{r.properties?.name}{r.units ? `, ${r.units.label}` : ""}{r.status === "scheduled" && r.scheduled_for ? `. ${fmtDate(r.scheduled_for)}` : ""}</span>
                      </span>
                      {r.urgency !== "routine" ? <Pill tone={URGENCY[r.urgency].tone}>{URGENCY[r.urgency].label}</Pill> : <Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill>}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
