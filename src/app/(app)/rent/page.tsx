import Link from "next/link";
import { requireAccount } from "@/lib/data";
import { Button, Card, Field, Notice, PageHeader, Pill, Select, fmtDate, money, moneyExact } from "@/components/ui";
import { generateCharges, recordPayment, voidCharge, waiveLateFee } from "./actions";

export const metadata = { title: "Rent" };

type Filter = "all" | "paid" | "late" | "partial" | "due";

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; filter?: string; error?: string; generated?: string; recorded?: string; record?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, account } = await requireAccount();

  const today = new Date();
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : today.toISOString().slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const prev = new Date(y, m - 2, 1).toISOString().slice(0, 7);
  const next = new Date(y, m, 1).toISOString().slice(0, 7);
  const filter = (["all", "paid", "late", "partial", "due"].includes(sp.filter ?? "") ? sp.filter : "all") as Filter;
  const todayStr = today.toISOString().slice(0, 10);

  const [{ data: charges }, { data: settings }, { count: activeLeases }] = await Promise.all([
    supabase
      .from("rent_charges")
      .select("id, lease_id, due_date, amount_cents, late_fee_cents, paid_cents, status, description, leases(units(label, properties(name)), lease_tenants(is_primary, tenants(id, full_name))), payments(id, amount_cents, fee_cents, method, status, paid_at, note)")
      .eq("account_id", account.id)
      .eq("period_start", `${month}-01`)
      .order("due_date"),
    supabase.from("payment_settings").select("charges_enabled, payouts_enabled, stripe_account_id").eq("account_id", account.id).maybeSingle(),
    supabase.from("leases").select("id", { count: "exact", head: true }).eq("account_id", account.id).eq("status", "active"),
  ]);

  type Row = NonNullable<typeof charges>[number] & {
    leases: { units: { label: string; properties: { name: string } }; lease_tenants: { is_primary: boolean; tenants: { id: string; full_name: string } }[] };
    payments: { id: string; amount_cents: number; fee_cents: number; method: string; status: string; paid_at: string | null; note: string | null }[];
  };
  const rows = ((charges ?? []) as unknown as Row[]).filter((c) => c.status !== "void");

  const owed = (c: Row) => c.amount_cents + c.late_fee_cents - c.paid_cents;
  const isLate = (c: Row) => c.status !== "paid" && c.due_date < todayStr;
  const classify = (c: Row): Exclude<Filter, "all"> => (c.status === "paid" ? "paid" : c.status === "partial" ? "partial" : isLate(c) ? "late" : "due");

  const totals = {
    billed: rows.reduce((s, c) => s + c.amount_cents + c.late_fee_cents, 0),
    collected: rows.reduce((s, c) => s + c.paid_cents, 0),
  };
  const counts = { all: rows.length, paid: 0, late: 0, partial: 0, due: 0 } as Record<Filter, number>;
  rows.forEach((c) => counts[classify(c)]++);
  const shown = rows.filter((c) => filter === "all" || classify(c) === filter);
  const recording = sp.record ? rows.find((c) => c.id === sp.record) : null;
  const online = Boolean(settings?.charges_enabled && settings?.payouts_enabled);
  const missing = (activeLeases ?? 0) - rows.length;

  return (
    <>
      <PageHeader
        title="Rent"
        subtitle={monthLabel}
        actions={
          <>
            <Button href={`/rent?month=${prev}`} variant="secondary">Previous month</Button>
            <Button href={`/rent?month=${next}`} variant="secondary">Next month</Button>
          </>
        }
      />

      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}
      {sp.generated ? <Notice tone="success">Created {sp.generated} rent {sp.generated === "1" ? "charge" : "charges"} for {monthLabel}.</Notice> : null}
      {sp.recorded ? <Notice tone="success">Payment recorded.</Notice> : null}
      {!online ? (
        <Notice>
          Tenants can&apos;t pay online until you connect your bank.{" "}
          <Link href="/settings/payments" className="font-semibold text-link">Set up payments</Link>. You can still record cash and check payments here.
        </Notice>
      ) : null}

      <Card className="px-7 py-6 flex flex-wrap gap-5 sm:gap-14">
        <div className="flex flex-col gap-1.5"><span className="text-sm font-semibold text-muted">Collected</span><span className="font-display font-semibold text-[34px] leading-none tabular">{money(totals.collected)}</span></div>
        <div className="flex flex-col gap-1.5"><span className="text-sm font-semibold text-muted">Still owed</span><span className="font-display font-semibold text-[34px] leading-none tabular">{money(totals.billed - totals.collected)}</span></div>
        <div className="flex flex-col gap-1.5"><span className="text-sm font-semibold text-muted">Billed this month</span><span className="font-display font-semibold text-[34px] leading-none tabular">{money(totals.billed)}</span></div>
      </Card>

      {missing > 0 ? (
        <form action={generateCharges} className="flex flex-wrap items-center gap-3 p-4 rounded-[12px] bg-amber-bg text-sm text-amber-ink">
          <input type="hidden" name="month" value={month} />
          <span className="flex-1 min-w-[220px]">{missing} active {missing === 1 ? "lease has" : "leases have"} no rent charge for {monthLabel} yet. Charges are created automatically on the 1st.</span>
          <Button type="submit" variant="secondary">Create {monthLabel} charges</Button>
        </form>
      ) : null}

      {recording ? (
        <Card className="p-6 max-w-[640px] flex flex-col gap-4">
          <h2 className="font-display font-semibold text-xl">Record a payment</h2>
          <p className="text-sm text-ink-2">
            {recording.leases.lease_tenants.map((lt) => lt.tenants.full_name).join(", ")}, {recording.leases.units.properties.name}, {recording.leases.units.label}. Owes {moneyExact(owed(recording))}.
          </p>
          <form action={recordPayment} className="flex flex-col gap-4">
            <input type="hidden" name="charge_id" value={recording.id} />
            <input type="hidden" name="month" value={month} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Amount received" name="amount" required inputMode="decimal" defaultValue={(owed(recording) / 100).toString()} />
              <Select label="How they paid" name="method" options={[{ value: "cash", label: "Cash" }, { value: "check", label: "Check" }, { value: "other", label: "Other (Zelle, money order)" }]} />
              <Field label="Date received" name="paid_on" type="date" defaultValue={todayStr} />
            </div>
            <Field label="Note" name="note" placeholder="Check #1042" />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Save payment</Button>
              <Button href={`/rent?month=${month}`} variant="secondary">Cancel</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 px-7 pt-5 pb-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "paid", "late", "partial", "due"] as Filter[]).map((f) => (
              <Link
                key={f}
                href={`/rent?month=${month}&filter=${f}`}
                aria-current={filter === f ? "page" : undefined}
                className={`inline-flex items-center min-h-11 px-4 rounded-[22px] border text-sm font-semibold ${filter === f ? "bg-navy text-white border-navy" : "bg-white text-ink border-field hover:bg-page"}`}
              >
                {{ all: "All", paid: "Paid", late: "Late", partial: "Partly paid", due: "Not due yet" }[f]} {counts[f]}
              </Link>
            ))}
          </div>
          <span className="text-sm text-muted">Showing {shown.length} {shown.length === 1 ? "tenant" : "tenants"}</span>
        </div>

        {rows.length === 0 ? (
          <p className="px-7 pb-6 text-[15px] text-muted">No rent charges for {monthLabel}. {activeLeases ? "Create them above." : "Set up a lease first."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-[13px] font-semibold text-muted">
                  <th className="px-7 py-3 border-b border-line">Tenant</th>
                  <th className="px-3 py-3 border-b border-line">Unit</th>
                  <th className="px-3 py-3 border-b border-line">Due</th>
                  <th className="px-3 py-3 border-b border-line text-right">Rent</th>
                  <th className="px-3 py-3 border-b border-line text-right">Paid</th>
                  <th className="px-3 py-3 border-b border-line text-right">Owes</th>
                  <th className="px-3 py-3 border-b border-line">Status</th>
                  <th className="px-7 py-3 border-b border-line text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => {
                  const names = c.leases.lease_tenants.map((lt) => lt.tenants.full_name).join(", ");
                  const kind = classify(c);
                  const lastPay = c.payments.filter((p) => p.status === "succeeded").sort((a, b) => (a.paid_at! < b.paid_at! ? 1 : -1))[0];
                  const pending = c.payments.find((p) => p.status === "pending");
                  return (
                    <tr key={c.id} className="border-b border-line-2 last:border-0">
                      <td className="px-7 py-3.5">
                        <Link href={`/leases/${c.lease_id}`} className="font-semibold hover:text-link">{names || "No tenant"}</Link>
                        {lastPay ? (
                          <div className="text-[13px] text-muted">
                            {({ ach: "Bank", card: "Card", cash: "Cash", check: "Check", other: "Other" } as Record<string, string>)[lastPay.method] ?? lastPay.method}, {fmtDate(lastPay.paid_at!.slice(0, 10))}
                          </div>
                        ) : pending ? (
                          <div className="text-[13px] text-muted">Payment processing</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3.5 text-ink-2">{c.leases.units.properties.name}, {c.leases.units.label}</td>
                      <td className="px-3 py-3.5 text-ink-2 whitespace-nowrap">{fmtDate(c.due_date)}</td>
                      <td className="px-3 py-3.5 text-right tabular">
                        {money(c.amount_cents)}
                        {c.late_fee_cents ? <div className="text-[12px] text-amber-ink">+{money(c.late_fee_cents)} late fee</div> : null}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular">{money(c.paid_cents)}</td>
                      <td className="px-3 py-3.5 text-right font-semibold tabular">{money(owed(c))}</td>
                      <td className="px-3 py-3.5">
                        {kind === "paid" ? <Pill tone="blue">Paid</Pill> : kind === "late" ? <Pill tone="amber">Late</Pill> : kind === "partial" ? <Pill tone="gray">Partly paid</Pill> : <Pill tone="gray">Due {fmtDate(c.due_date)}</Pill>}
                      </td>
                      <td className="px-7 py-2 text-right whitespace-nowrap">
                        {kind !== "paid" ? (
                          <Button href={`/rent?month=${month}&filter=${filter}&record=${c.id}#record`} variant="secondary">Record payment</Button>
                        ) : null}
                        {c.late_fee_cents > 0 && kind !== "paid" ? (
                          <form action={waiveLateFee} className="inline ml-2">
                            <input type="hidden" name="charge_id" value={c.id} />
                            <input type="hidden" name="month" value={month} />
                            <Button type="submit" variant="secondary">Waive fee</Button>
                          </form>
                        ) : null}
                        {c.paid_cents === 0 ? (
                          <form action={voidCharge} className="inline ml-2">
                            <input type="hidden" name="charge_id" value={c.id} />
                            <input type="hidden" name="month" value={month} />
                            <button type="submit" className="min-h-11 px-2 text-sm text-muted hover:text-red-ink">Void</button>
                          </form>
                        ) : null}
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
