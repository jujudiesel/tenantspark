import { NextResponse, type NextRequest } from "next/server";
import { requireAccount } from "@/lib/data";
import { MONTHS, buildPnL, csv, dollars, loadLines } from "@/lib/accounting";

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export async function GET(request: NextRequest) {
  const { supabase, account } = await requireAccount();
  const sp = request.nextUrl.searchParams;
  const type = sp.get("type");
  const pf = sp.get("property");
  const rows: (string | number | null)[][] = [];
  let name = "export";

  if (type === "pnl") {
    const year = Number(sp.get("year")) || new Date().getFullYear();
    const lines = await loadLines(supabase, account.id, `${year}-01-01`, `${year}-12-31`, pf);
    const pnl = buildPnL(lines, year);
    const tot = (r: number[]) => r.reduce((s, v) => s + v, 0);
    rows.push(["Line", ...MONTHS, "Total"]);
    rows.push(["INCOME"]);
    for (const [c, r] of pnl.income) rows.push([c, ...r.map(dollars), dollars(tot(r))]);
    rows.push(["Total income", ...pnl.incomeTotal.map(dollars), dollars(tot(pnl.incomeTotal))]);
    rows.push(["EXPENSES"]);
    for (const [c, r] of pnl.expense) rows.push([c, ...r.map(dollars), dollars(tot(r))]);
    rows.push(["Total expenses", ...pnl.expenseTotal.map(dollars), dollars(tot(pnl.expenseTotal))]);
    rows.push(["Net operating income", ...pnl.net.map(dollars), dollars(tot(pnl.net))]);
    name = `profit-and-loss-${year}`;
  } else if (type === "ledger") {
    const from = sp.get("from") ?? `${new Date().getFullYear()}-01-01`;
    const to = sp.get("to") ?? new Date().toISOString().slice(0, 10);
    const lines = await loadLines(supabase, account.id, from, to, pf);
    rows.push(["Date", "Type", "Category", "Who", "Property", "Unit", "Memo", "Amount"]);
    for (const l of lines) rows.push([l.date, l.kind, l.category, l.who, l.property, l.unit, l.memo, (l.kind === "expense" ? "-" : "") + dollars(l.amount_cents)]);
    name = `transactions-${from}-to-${to}`;
  } else if (type === "rentroll") {
    const { data } = await supabase
      .from("leases")
      .select("id, start_date, end_date, rent_cents, deposit_cents, rent_due_day, units(label, property_id, properties(name)), lease_tenants(is_primary, tenants(full_name, email, phone)), rent_charges(amount_cents, late_fee_cents, paid_cents, status)")
      .eq("account_id", account.id)
      .eq("status", "active");
    rows.push(["Property", "Unit", "Tenant", "Email", "Phone", "Lease start", "Lease end", "Due day", "Rent", "Deposit", "Balance owed"]);
    for (const l of ((data ?? []) as Any[]).filter((l) => !pf || l.units?.property_id === pf)) {
      const t = (l.lease_tenants ?? []).sort((a: Any, b: Any) => Number(b.is_primary) - Number(a.is_primary))[0]?.tenants;
      const bal = (l.rent_charges ?? []).filter((c: Any) => c.status !== "void").reduce((s: number, c: Any) => s + Math.max(0, c.amount_cents + c.late_fee_cents - c.paid_cents), 0);
      rows.push([l.units?.properties?.name, l.units?.label, t?.full_name, t?.email, t?.phone, l.start_date, l.end_date ?? "month to month", l.rent_due_day, dollars(l.rent_cents), dollars(l.deposit_cents), dollars(bal)]);
    }
    name = "rent-roll";
  } else {
    return new NextResponse("Unknown report", { status: 400 });
  }

  return new NextResponse(csv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="tenantspark-${name}.csv"` },
  });
}
