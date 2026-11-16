import { NextResponse, type NextRequest } from "next/server";
import { withApi, readJson, apiError } from "@/lib/api/auth";
import { listRoute } from "@/lib/api/list";
import { loadObject } from "@/lib/api/objects";

export const GET = listRoute("payment", ["status", "method", "lease_id", "tenant_id"]);

/** Record a payment made outside TenantSpark. POST { charge_id | lease_id, amount, method: cash|check|other, paid_on?, note? } */
export const POST = withApi(async ({ db, accountId }, request: NextRequest) => {
  const body = await readJson(request);
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return apiError(400, "amount must be a positive number of dollars.");
  const method = String(body.method ?? "other");
  if (!["cash", "check", "other"].includes(method)) return apiError(400, "method must be cash, check or other. Online payments come through the tenant portal.");

  let charge: { id: string; lease_id: string; status: string } | null = null;
  if (body.charge_id) {
    const { data } = await db.from("rent_charges").select("id, lease_id, status").eq("id", String(body.charge_id)).eq("account_id", accountId).maybeSingle();
    if (!data) return apiError(404, "charge_id not found.");
    charge = data;
  } else if (body.lease_id) {
    // Oldest open charge on the lease.
    const { data } = await db.from("rent_charges").select("id, lease_id, status").eq("lease_id", String(body.lease_id)).eq("account_id", accountId).in("status", ["due", "partial"]).order("due_date").limit(1).maybeSingle();
    if (!data) return apiError(404, "No open charge on that lease.");
    charge = data;
  } else {
    return apiError(400, "charge_id or lease_id is required.");
  }
  if (charge.status === "void") return apiError(400, "That charge was voided.");

  const { data: lt } = await db.from("lease_tenants").select("tenant_id").eq("lease_id", charge.lease_id).eq("is_primary", true).maybeSingle();
  const paid_on = body.paid_on ? String(body.paid_on) : null;
  const paid_at = paid_on && /^\d{4}-\d{2}-\d{2}$/.test(paid_on) ? `${paid_on}T12:00:00Z` : new Date().toISOString();
  const { data, error } = await db
    .from("payments")
    .insert({ account_id: accountId, lease_id: charge.lease_id, charge_id: charge.id, tenant_id: lt?.tenant_id ?? null, amount_cents: Math.round(amount * 100), fee_cents: 0, method, status: "succeeded", note: body.note ? String(body.note) : "Recorded through the API", paid_at })
    .select("id")
    .single();
  if (error || !data) return apiError(400, error?.message ?? "Could not record the payment.");
  return NextResponse.json({ data: await loadObject(db, "payment", data.id, accountId) }, { status: 201 });
});
