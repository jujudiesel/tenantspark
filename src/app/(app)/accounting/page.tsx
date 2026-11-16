import Link from "next/link";
import { requireAccount } from "@/lib/data";
import { Button, Card, Empty, Notice, PageHeader, Pill, fmtDate, money, moneyExact } from "@/components/ui";
import { loadLines, monthLabel } from "@/lib/accounting";

export const metadata = { title: "Accounting" };

export default async function AccountingPage({ searchParams }: { searchParams: Promise<{ month?: string; kind?: string; property?: string; saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const { supabase, account } = await requireAccount();
  await supabase.rpc("ensure_my_categories", { p_account: account.id });

  const today = new Date().toISOString().slice(0, 10);
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : today.slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const to = new Date(y, m, 0).toISOString().slice(0, 10);
  const prev = new Date(y, m - 2, 1).toISOString().slice(0, 7);
  const next = new Date(y, m, 1).toISOString().slice(0, 7);
  const kind = sp.kind === "income" || sp.kind === "expense" ? sp.kind : "all";

  const { data: properties } = await supabase.from("properties").select("id, name").eq("account_id", account.id).order("name");
  const pf = sp.property && (properties ?? []).some((p) => p.id === sp.property) ? sp.property : null;
  const lines = (await loadLines(supabase, account.id, from, to, pf)).filter((l) => kind === "all" || l.kind === kind);
  const all = await loadLines(supabase, account.id, from, to, pf);
  const income = all.filter((l) => l.kind === "income").reduce((s, l) => s + l.amount_cents, 0);
  const expense = all.filter((l) => l.kind === "expense").reduce((s, l) => s + l.amount_cents, 0);

  const qs = (extra: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const merged = { month, kind: kind === "all" ? null : kind, property: pf, ...extra };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    return `/accounting?${p.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Accounting"
        subtitle={monthLabel(month)}
        actions={
          <>
            <Button href={qs({ month: prev })} variant="secondary">Previous month</Button>
            <Button href={qs({ month: next })} variant="secondary">Next month</Button>
            <Button href="/accounting/new?kind=income" variant="secondary">Add income</Button>
            <Button href="/accounting/new?kind=expense">Add expense</Button>
          </>
        }
      />
      {sp.saved ? <Notice tone="success">Saved.</Notice> : null}
      {sp.deleted ? <Notice tone="success">Deleted.</Notice> : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          ["Income", income, "text-green-ink"],
          ["Expenses", expense, "text-red-ink"],
          ["Net", income - expense, income - expense >= 0 ? "text-ink" : "text-red-ink"],
        ].map(([t, v, cls]) => (
          <Card key={t as string} className="p-5 flex flex-col gap-1">
            <span className="text-sm font-semibold text-muted">{t as string}</span>
            <span className={`font-display font-semibold text-[30px] leading-none tabular ${cls}`}>{moneyExact(v as number)}</span>
          </Card>
        ))}
      </div>

      <Card>
        <div className="px-6 pt-5 pb-3 flex flex-wrap items-center gap-2">
          {(["all", "income", "expense"] as const).map((k) => (
            <Link key={k} href={qs({ kind: k === "all" ? null : k })} className={`min-h-9 px-3.5 inline-flex items-center rounded-full text-sm font-semibold border ${kind === k ? "bg-navy text-white border-navy" : "bg-white text-ink-2 border-line hover:border-field-strong"}`}>
              {k === "all" ? "Everything" : k === "income" ? "Income" : "Expenses"}
            </Link>
          ))}
          {(properties?.length ?? 0) > 1 ? (
            <form method="get" className="ml-auto flex items-center gap-2">
              <input type="hidden" name="month" value={month} />
              {kind !== "all" ? <input type="hidden" name="kind" value={kind} /> : null}
              <label htmlFor="f-property" className="sr-only">Property</label>
              <select id="f-property" name="property" defaultValue={pf ?? ""} className="min-h-9 px-3 pr-8 rounded-[9px] border border-line bg-white text-sm font-medium">
                <option value="">All properties</option>
                {(properties ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button type="submit" className="min-h-9 px-3 rounded-[9px] border border-line bg-white text-sm font-semibold hover:bg-page">Apply</button>
            </form>
          ) : null}
          <Link href={`/reports/export?type=ledger&from=${from}&to=${to}${pf ? `&property=${pf}` : ""}`} className="text-sm font-semibold text-link">Download CSV</Link>
        </div>

        {lines.length === 0 ? (
          <Empty
            title={`Nothing in ${monthLabel(month)}`}
            body="Rent payments show up here on their own. Add expenses as they happen, or let repair costs flow in when you mark a request done."
            action={<Button href="/accounting/new?kind=expense">Add an expense</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[12px] uppercase tracking-wide text-muted border-t border-line-2">
                  <th className="px-6 py-2.5 font-semibold">Date</th>
                  <th className="px-3 py-2.5 font-semibold">Category</th>
                  <th className="px-3 py-2.5 font-semibold">Who</th>
                  <th className="px-3 py-2.5 font-semibold">Property</th>
                  <th className="px-3 py-2.5 font-semibold">Memo</th>
                  <th className="px-6 py-2.5 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => {
                  const href = l.source === "entry" ? `/accounting/${l.entry_id}` : `/rent?month=${l.date.slice(0, 7)}`;
                  return (
                    <tr key={l.id} className="border-t border-line-2 hover:bg-page/60">
                      <td className="px-6 py-3 whitespace-nowrap"><Link href={href} className="font-medium">{fmtDate(l.date)}</Link></td>
                      <td className="px-3 py-3"><Pill tone={l.kind === "income" ? "green" : "gray"}>{l.category}</Pill></td>
                      <td className="px-3 py-3">{l.who ?? <span className="text-muted">—</span>}</td>
                      <td className="px-3 py-3 text-ink-2">{l.property ?? "Portfolio"}{l.unit ? `, ${l.unit}` : ""}</td>
                      <td className="px-3 py-3 text-ink-2 max-w-[280px] truncate">{l.memo}{l.repair_id ? <Link href={`/maintenance/${l.repair_id}`} className="ml-1 text-link font-semibold">Repair</Link> : null}{l.receipt_path ? <a href={`/receipts/${l.entry_id}`} target="_blank" rel="noopener" className="ml-1 text-link font-semibold">Receipt</a> : null}</td>
                      <td className={`px-6 py-3 text-right tabular font-semibold whitespace-nowrap ${l.kind === "income" ? "text-green-ink" : ""}`}>{l.kind === "expense" ? "−" : ""}{moneyExact(l.amount_cents)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-[13px] text-muted">
        Online and recorded rent payments appear automatically. Repair costs appear when a request is marked done. <Link href="/accounting/categories" className="font-semibold text-link">Edit categories</Link> · <Link href="/reports" className="font-semibold text-link">Reports</Link>
      </p>
      <span className="hidden">{money(0)}</span>
    </>
  );
}
