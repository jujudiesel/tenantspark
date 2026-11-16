import { NextResponse, type NextRequest } from "next/server";
import { withApi, readJson, apiError } from "@/lib/api/auth";
import { listRoute } from "@/lib/api/list";
import { loadObject } from "@/lib/api/objects";

/** Manual income and expense entries. Rent payments live under /payments. ?kind=expense|income */
export const GET = listRoute("expense", ["kind", "property_id", "unit_id", "category_id"], "entry_date");

/** POST { amount, date?, kind?: expense|income, category (name) | category_id, property_id?, unit_id?, vendor?, memo? } */
export const POST = withApi(async ({ db, accountId }, request: NextRequest) => {
  const body = await readJson(request);
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return apiError(400, "amount must be a positive number of dollars.");
  const kind = body.kind === "income" ? "income" : "expense";
  const date = body.date ? String(body.date) : new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return apiError(400, "date must be YYYY-MM-DD.");

  let category_id: string | null = body.category_id ? String(body.category_id) : null;
  if (!category_id && body.category) {
    const { data } = await db.from("categories").select("id").eq("account_id", accountId).eq("kind", kind).ilike("name", String(body.category)).maybeSingle();
    if (!data) return apiError(400, `No ${kind} category named "${body.category}". GET /api/v1/categories lists them.`);
    category_id = data.id;
  }
  if (body.property_id) {
    const { data } = await db.from("properties").select("id").eq("id", String(body.property_id)).eq("account_id", accountId).maybeSingle();
    if (!data) return apiError(404, "property_id not found.");
  }
  const { data, error } = await db
    .from("ledger_entries")
    .insert({ account_id: accountId, kind, amount_cents: Math.round(amount * 100), entry_date: date, category_id, property_id: body.property_id ? String(body.property_id) : null, unit_id: body.unit_id ? String(body.unit_id) : null, vendor: body.vendor ? String(body.vendor) : null, memo: body.memo ? String(body.memo) : "Added through the API" })
    .select("id")
    .single();
  if (error || !data) return apiError(400, error?.message ?? "Could not save.");
  return NextResponse.json({ data: await loadObject(db, "expense", data.id, accountId) }, { status: 201 });
});
