import Link from "next/link";
import { requireAccount } from "@/lib/data";
import { Button, Card, PageHeader, Pill, fmtDate, moneyExact } from "@/components/ui";
import { MONTHS, buildPnL, loadLines, monthLabel, type Line } from "@/lib/accounting";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Reports" };

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Tab = "pnl" | "rentroll" | "owner";
type Db = Awaited<ReturnType<typeof requireAccount>>["supabase"];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ tab?: string; year?: string; month?: string; property?: string }> }) {
  const sp = await searchParams;
  const { supabase, account } = await requireAccount();
  const today = new Date();
  const tab = (["pnl", "rentroll", "owner"].includes(sp.tab ?? "") ? sp.tab : "pnl") as Tab;
  const year = /^\d{4}$/.test(sp.year ?? "") ? Number(sp.year) : today.getFullYear();
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : today.toISOString().slice(0, 7);

  const { data: properties } = await supabase.from("properties").select("id, name, address_line1, city, state, zip").eq("account_id", account.id).order("name");
  const pf = sp.property && (properties ?? []).some((p) => p.id === sp.property) ? sp.property : null;
  const property = (properties ?? []).find((p) => p.id === pf) ?? null;

  const qs = (extra: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const merged: Record<string, string | null> = { tab, year: String(year), month, property: pf, ...extra };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    return `/reports?${p.toString()}`;
  };

  const tabs: [Tab, string][] = [["pnl", "Profit and loss"], ["rentroll", "Rent roll"], ["owner", "Owner statement"]];

  return (
    <>
      <div className="print:hidden flex flex-col gap-6">
        <PageHeader title="Reports" subtitle={property ? property.name : "All properties"} actions={<PrintButton />} />
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map(([t, label]) => (
            <Link key={t} href={qs({ tab: t })} className={`min-h-10 px-4 inline-flex items-center rounded-full text-sm font-semibold border ${tab === t ? "bg-navy text-white border-navy" : "bg-white text-ink-2 border-line hover:border-field-strong"}`}>{label}</Link>
          ))}
          <form method="get" className="ml-auto flex flex-wrap items-center gap-2">
            <input type="hidden" name="tab" value={tab} />
            {tab === "owner" ? (
              <input type="month" name="month" defaultValue={month} aria-label="Month" className="min-h-10 px-3 rounded-[9px] border border-line bg-white text-sm font-medium" />
            ) : tab === "pnl" ? (
              <select name="year" defaultValue={String(year)} aria-label="Year" className="min-h-10 px-3 pr-8 rounded-[9px] border border-line bg-white text-sm font-medium">
                {[0, 1, 2, 3].map((i) => <option key={i} value={today.getFullYear() - i}>{today.getFullYear() - i}</option>)}
              </select>
            ) : null}
            <select name="property" defaultValue={pf ?? ""} aria-label="Property" className="min-h-10 px-3 pr-8 rounded-[9px] border border-line bg-white text-sm font-medium">
              <option value="">All properties</option>
              {(properties ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button type="submit" className="min-h-10 px-3.5 rounded-[9px] border border-line bg-white text-sm font-semibold hover:bg-page">Apply</button>
          </form>
        </div>
      </div>

      {tab === "pnl" ? <PnLReport supabase={supabase} accountId={account.id} year={year} pf={pf} title={property?.name ?? account.name} /> : null}
      {tab === "rentroll" ? <RentRoll supabase={supabase} accountId={account.id} pf={pf} title={property?.name ?? account.name} /> : null}
      {tab === "owner" ? <OwnerStatement supabase={supabase} accountId={account.id} month={month} property={property} accountName={account.name} /> : null}
    </>
  );
}

const total = (row: number[]) => row.reduce((s, v) => s + v, 0);
function Row({ label, row, bold = false, neg = false }: { label: string; row: number[]; bold?: boolean; neg?: boolean }) {
  return (
    <tr className={`border-t border-line-2 ${bold ? "font-semibold bg-page/60" : ""}`}>
      <td className="px-4 py-2 whitespace-nowrap sticky left-0 bg-white">{label}</td>
      {row.map((v, i) => <td key={i} className={`px-2 py-2 text-right tabular ${v === 0 ? "text-muted/60" : ""}`}>{v === 0 ? "–" : `${neg && v < 0 ? "−" : ""}${moneyExact(Math.abs(v))}`}</td>)}
      <td className={`px-4 py-2 text-right tabular font-semibold ${neg && total(row) < 0 ? "text-red-ink" : ""}`}>{neg && total(row) < 0 ? "−" : ""}{moneyExact(Math.abs(total(row)))}</td>
    </tr>
  );
}

function Block({ title, ls, neg = false }: { title: string; ls: Line[]; neg?: boolean }) {
  const sum = (x: Line[]) => x.reduce((s, l) => s + l.amount_cents, 0);
  return (
    <div className="flex flex-col">
      <h3 className="px-6 pt-5 pb-2 text-[11px] font-bold uppercase tracking-wide text-muted">{title}</h3>
      {ls.length === 0 ? <p className="px-6 pb-3 text-sm text-muted">None</p> : (
        <table className="w-full text-[13px]">
          <tbody>
            {ls.map((l) => (
              <tr key={l.id} className="border-t border-line-2">
                <td className="px-6 py-2 whitespace-nowrap">{fmtDate(l.date)}</td>
                <td className="px-2 py-2">{l.category}</td>
                <td className="px-2 py-2 text-ink-2">{l.who}{l.unit ? ` · ${l.unit}` : ""}{l.memo ? ` · ${l.memo}` : ""}</td>
                <td className="px-6 py-2 text-right tabular whitespace-nowrap">{neg ? "−" : ""}{moneyExact(l.amount_cents)}</td>
              </tr>
            ))}
            <tr className="border-t border-line font-semibold"><td className="px-6 py-2" colSpan={3}>Total {title.toLowerCase()}</td><td className="px-6 py-2 text-right tabular">{neg ? "−" : ""}{moneyExact(sum(ls))}</td></tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

function ReportHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="hidden print:flex flex-col gap-0.5 mb-5">
      <span className="font-display font-semibold text-lg">TenantSpark</span>
      <h1 className="font-display font-semibold text-[26px]">{title}</h1>
      <p className="text-sm text-muted">{sub}</p>
    </div>
  );
}

async function PnLReport({ supabase, accountId, year, pf, title }: { supabase: Db; accountId: string; year: number; pf: string | null; title: string }) {
  const lines = await loadLines(supabase, accountId, `${year}-01-01`, `${year}-12-31`, pf);
  const pnl = buildPnL(lines, year);
  return (
    <Card className="overflow-hidden print:border-0">
      <div className="px-6 pt-5 pb-3 flex flex-wrap items-baseline justify-between gap-3 print:hidden">
        <h2 className="font-display font-semibold text-xl">Profit and loss, {year}</h2>
        <Link href={`/reports/export?type=pnl&year=${year}${pf ? `&property=${pf}` : ""}`} className="text-sm font-semibold text-link">Download CSV</Link>
      </div>
      <div className="px-6"><ReportHeader title={`Profit and loss, ${year}`} sub={title} /></div>
      {lines.length === 0 ? (
        <p className="px-6 pb-6 text-[15px] text-muted">Nothing recorded in {year} yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted">
                <th className="px-4 py-2 text-left sticky left-0 bg-white">Line</th>
                {MONTHS.map((m) => <th key={m} className="px-2 py-2 text-right font-semibold">{m}</th>)}
                <th className="px-4 py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={14} className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-green-ink">Income</td></tr>
              {[...pnl.income.entries()].map(([c, row]) => <Row key={c} label={c} row={row} />)}
              <Row label="Total income" row={pnl.incomeTotal} bold />
              <tr><td colSpan={14} className="px-4 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-red-ink">Expenses</td></tr>
              {[...pnl.expense.entries()].map(([c, row]) => <Row key={c} label={c} row={row} />)}
              <Row label="Total expenses" row={pnl.expenseTotal} bold />
              <tr><td colSpan={14} className="pt-2" /></tr>
              <Row label="Net operating income" row={pnl.net} bold neg />
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

async function RentRoll({ supabase, accountId, pf, title }: { supabase: Db; accountId: string; pf: string | null; title: string }) {
  const month = new Date().toISOString().slice(0, 7);
  const { data } = await supabase
    .from("leases")
    .select("id, status, start_date, end_date, rent_cents, deposit_cents, rent_due_day, units(id, label, property_id, properties(id, name)), lease_tenants(is_primary, tenants(full_name, email, phone)), rent_charges(period_start, amount_cents, late_fee_cents, paid_cents, status)")
    .eq("account_id", accountId)
    .eq("status", "active");
  const rows = ((data ?? []) as Any[])
    .filter((l) => !pf || l.units?.property_id === pf)
    .sort((a, b) => `${a.units?.properties?.name} ${a.units?.label}`.localeCompare(`${b.units?.properties?.name} ${b.units?.label}`, undefined, { numeric: true }));
  const totalRent = rows.reduce((s, l) => s + l.rent_cents, 0);
  const balance = (l: Any) => (l.rent_charges ?? []).filter((c: Any) => c.status !== "void").reduce((s: number, c: Any) => s + Math.max(0, c.amount_cents + c.late_fee_cents - c.paid_cents), 0);
  const thisMonth = (l: Any) => (l.rent_charges ?? []).find((c: Any) => c.period_start === `${month}-01`);
  return (
    <Card className="overflow-hidden print:border-0">
      <div className="px-6 pt-5 pb-3 flex flex-wrap items-baseline justify-between gap-3 print:hidden">
        <h2 className="font-display font-semibold text-xl">Rent roll</h2>
        <Link href={`/reports/export?type=rentroll${pf ? `&property=${pf}` : ""}`} className="text-sm font-semibold text-link">Download CSV</Link>
      </div>
      <div className="px-6"><ReportHeader title="Rent roll" sub={`${title}, as of ${fmtDate(new Date().toISOString().slice(0, 10))}`} /></div>
      {rows.length === 0 ? <p className="px-6 pb-6 text-[15px] text-muted">No active leases.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted text-left">
                <th className="px-4 py-2 font-semibold">Unit</th><th className="px-2 py-2 font-semibold">Tenant</th><th className="px-2 py-2 font-semibold">Lease</th><th className="px-2 py-2 font-semibold text-right">Rent</th><th className="px-2 py-2 font-semibold text-right">Deposit</th><th className="px-2 py-2 font-semibold">This month</th><th className="px-4 py-2 font-semibold text-right">Balance owed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const t = (l.lease_tenants ?? []).sort((a: Any, b: Any) => Number(b.is_primary) - Number(a.is_primary)).map((x: Any) => x.tenants?.full_name).filter(Boolean).join(", ");
                const c = thisMonth(l);
                const b = balance(l);
                return (
                  <tr key={l.id} className="border-t border-line-2">
                    <td className="px-4 py-2.5 whitespace-nowrap"><Link href={`/leases/${l.id}`} className="font-semibold">{l.units?.properties?.name}, {l.units?.label}</Link></td>
                    <td className="px-2 py-2.5">{t || <span className="text-muted">No tenant</span>}</td>
                    <td className="px-2 py-2.5 whitespace-nowrap text-ink-2">{fmtDate(l.start_date)} to {l.end_date ? fmtDate(l.end_date) : "month to month"}. Due the {l.rent_due_day}{["st", "nd", "rd"][l.rent_due_day - 1] ?? "th"}</td>
                    <td className="px-2 py-2.5 text-right tabular">{moneyExact(l.rent_cents)}</td>
                    <td className="px-2 py-2.5 text-right tabular">{moneyExact(l.deposit_cents)}</td>
                    <td className="px-2 py-2.5">{c ? <Pill tone={c.status === "paid" ? "green" : c.status === "partial" ? "amber" : "gray"}>{c.status === "paid" ? "Paid" : c.status === "partial" ? "Partly paid" : "Due"}</Pill> : <span className="text-muted">No charge yet</span>}</td>
                    <td className={`px-4 py-2.5 text-right tabular font-semibold ${b > 0 ? "text-red-ink" : ""}`}>{moneyExact(b)}</td>
                  </tr>
                );
              })}
              <tr className="border-t border-line font-semibold bg-page/60">
                <td className="px-4 py-2.5" colSpan={3}>{rows.length} active {rows.length === 1 ? "lease" : "leases"}</td>
                <td className="px-2 py-2.5 text-right tabular">{moneyExact(totalRent)}</td>
                <td className="px-2 py-2.5 text-right tabular">{moneyExact(rows.reduce((s, l) => s + l.deposit_cents, 0))}</td>
                <td />
                <td className="px-4 py-2.5 text-right tabular">{moneyExact(rows.reduce((s, l) => s + balance(l), 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

async function OwnerStatement({ supabase, accountId, month, property, accountName }: { supabase: Db; accountId: string; month: string; property: Any | null; accountName: string }) {
  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const to = new Date(y, m, 0).toISOString().slice(0, 10);
  const lines = await loadLines(supabase, accountId, from, to, property?.id ?? null);
  const income = lines.filter((l) => l.kind === "income");
  const expense = lines.filter((l) => l.kind === "expense");
  const sum = (ls: typeof lines) => ls.reduce((s, l) => s + l.amount_cents, 0);
  return (
    <Card className="overflow-hidden print:border-0">
      <div className="px-6 pt-5 pb-1 flex flex-wrap items-baseline justify-between gap-3 print:hidden">
        <h2 className="font-display font-semibold text-xl">Owner statement, {monthLabel(month)}</h2>
        <Link href={`/reports/export?type=ledger&from=${from}&to=${to}${property ? `&property=${property.id}` : ""}`} className="text-sm font-semibold text-link">Download CSV</Link>
      </div>
      <div className="px-6 pt-4"><ReportHeader title={`Owner statement, ${monthLabel(month)}`} sub={property ? `${property.name}, ${property.address_line1}, ${property.city}, ${property.state} ${property.zip}` : `${accountName}, all properties`} /></div>
      <p className="px-6 text-sm text-muted print:hidden">{property ? `${property.address_line1}, ${property.city}` : "All properties. Pick one above for a statement you can send to an owner."}</p>
      <Block title="Income" ls={income} />
      <Block title="Expenses" ls={expense} neg />
      <div className="px-6 py-5 border-t border-line flex items-baseline justify-between gap-3">
        <span className="font-display font-semibold text-lg">Net to owner</span>
        <span className={`font-display font-semibold text-[26px] tabular ${sum(income) - sum(expense) < 0 ? "text-red-ink" : ""}`}>{sum(income) - sum(expense) < 0 ? "−" : ""}{moneyExact(Math.abs(sum(income) - sum(expense)))}</span>
      </div>
      <p className="hidden print:block px-6 pb-6 text-[12px] text-muted">Prepared with TenantSpark on {fmtDate(new Date().toISOString().slice(0, 10))}.</p>
    </Card>
  );
}
