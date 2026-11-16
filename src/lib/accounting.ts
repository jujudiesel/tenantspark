type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
// Loose on purpose: works with the RLS client in pages and the admin client in jobs.
type Db = { from: (table: string) => Any };

export type Line = {
  id: string;
  date: string;             // YYYY-MM-DD
  kind: "income" | "expense";
  category: string;
  amount_cents: number;
  property_id: string | null;
  property: string | null;
  unit: string | null;
  who: string | null;       // tenant for income, vendor for expenses
  memo: string | null;
  source: "payment" | "entry";
  entry_id?: string;
  repair_id?: string | null;
  receipt_path?: string | null;
};

export const monthKey = (d: string) => d.slice(0, 7);
export const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
};
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Everything that happened between two dates, as one list: payments (income) plus manual entries. */
export async function loadLines(db: Db, accountId: string, from: string, to: string, propertyId?: string | null): Promise<Line[]> {
  const [{ data: payments }, { data: entries }] = await Promise.all([
    db
      .from("payments")
      .select("id, amount_cents, method, paid_at, note, charge_id, tenants(full_name), leases(units(id, label, property_id, properties(id, name))), rent_charges(late_fee_cents, amount_cents)")
      .eq("account_id", accountId)
      .eq("status", "succeeded")
      .gte("paid_at", `${from}T00:00:00Z`)
      .lte("paid_at", `${to}T23:59:59Z`),
    db
      .from("ledger_entries")
      .select("id, kind, amount_cents, entry_date, vendor, memo, unit_id, property_id, receipt_path, maintenance_request_id, categories(name), properties(name), units(label)")
      .eq("account_id", accountId)
      .gte("entry_date", from)
      .lte("entry_date", to),
  ]);

  const lines: Line[] = [];
  for (const p of (payments ?? []) as unknown as Any[]) {
    const unit = p.leases?.units;
    const prop = unit?.properties;
    if (propertyId && prop?.id !== propertyId) continue;
    lines.push({
      id: `p_${p.id}`,
      date: (p.paid_at ?? "").slice(0, 10),
      kind: "income",
      category: "Rent",
      amount_cents: p.amount_cents,
      property_id: prop?.id ?? null,
      property: prop?.name ?? null,
      unit: unit?.label ?? null,
      who: p.tenants?.full_name ?? null,
      memo: p.note ?? (p.method === "card" || p.method === "ach" ? `Paid online (${p.method === "ach" ? "bank" : "card"})` : `Paid by ${p.method}`),
      source: "payment",
    });
  }
  for (const e of (entries ?? []) as unknown as Any[]) {
    if (propertyId && e.property_id !== propertyId) continue;
    lines.push({
      id: `e_${e.id}`,
      entry_id: e.id,
      date: e.entry_date,
      kind: e.kind,
      category: e.categories?.name ?? (e.kind === "income" ? "Other income" : "Other expense"),
      amount_cents: e.amount_cents,
      property_id: e.property_id ?? null,
      property: e.properties?.name ?? null,
      unit: e.units?.label ?? null,
      who: e.vendor ?? null,
      memo: e.memo ?? null,
      source: "entry",
      repair_id: e.maintenance_request_id ?? null,
      receipt_path: e.receipt_path ?? null,
    });
  }
  lines.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return lines;
}

export type PnL = {
  income: Map<string, number[]>;   // category -> 12 months
  expense: Map<string, number[]>;
  incomeTotal: number[];
  expenseTotal: number[];
  net: number[];
};

/** Profit and loss for a calendar year, by category and month. */
export function buildPnL(lines: Line[], year: number): PnL {
  const income = new Map<string, number[]>();
  const expense = new Map<string, number[]>();
  const zero = () => Array(12).fill(0) as number[];
  for (const l of lines) {
    if (!l.date.startsWith(String(year))) continue;
    const m = Number(l.date.slice(5, 7)) - 1;
    const map = l.kind === "income" ? income : expense;
    if (!map.has(l.category)) map.set(l.category, zero());
    map.get(l.category)![m] += l.amount_cents;
  }
  const sum = (map: Map<string, number[]>) => {
    const t = zero();
    for (const row of map.values()) row.forEach((v, i) => (t[i] += v));
    return t;
  };
  const incomeTotal = sum(income);
  const expenseTotal = sum(expense);
  return { income, expense, incomeTotal, expenseTotal, net: incomeTotal.map((v, i) => v - expenseTotal[i]) };
}

export function csv(rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n") + "\n";
}

export const dollars = (c: number) => (c / 100).toFixed(2);
