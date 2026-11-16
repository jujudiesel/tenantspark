import { NextResponse, type NextRequest } from "next/server";
import { withApi, readJson, apiError } from "@/lib/api/auth";
import { listRoute } from "@/lib/api/list";
import { loadObject } from "@/lib/api/objects";

export const GET = listRoute("repair", ["status", "urgency", "property_id", "unit_id"]);

/** POST { title, unit_id | property_id, description?, location?, urgency?, assigned_to?, permission_to_enter? } */
export const POST = withApi(async ({ db, accountId }, request: NextRequest) => {
  const body = await readJson(request);
  const title = String(body.title ?? "").trim();
  if (title.length < 3) return apiError(400, "title is required.");
  const urgency = String(body.urgency ?? "routine");
  if (!["routine", "urgent", "emergency"].includes(urgency)) return apiError(400, "urgency must be routine, urgent or emergency.");

  let unit: { id: string; property_id: string } | null = null;
  if (body.unit_id) {
    const { data } = await db.from("units").select("id, property_id").eq("id", String(body.unit_id)).eq("account_id", accountId).maybeSingle();
    if (!data) return apiError(404, "unit_id not found.");
    unit = data;
  }
  const property_id = unit?.property_id ?? (body.property_id ? String(body.property_id) : null);
  if (!property_id) return apiError(400, "unit_id or property_id is required.");
  if (!unit) {
    const { data } = await db.from("properties").select("id").eq("id", property_id).eq("account_id", accountId).maybeSingle();
    if (!data) return apiError(404, "property_id not found.");
  }

  let lease_id: string | null = null;
  let tenant_id: string | null = null;
  if (unit) {
    const { data: lease } = await db.from("leases").select("id, lease_tenants(tenant_id, is_primary)").eq("unit_id", unit.id).eq("status", "active").order("start_date", { ascending: false }).limit(1).maybeSingle();
    const lts = (lease?.lease_tenants as { tenant_id: string; is_primary: boolean }[] | undefined) ?? [];
    lease_id = lease?.id ?? null;
    tenant_id = lts.find((lt) => lt.is_primary)?.tenant_id ?? lts[0]?.tenant_id ?? null;
  }

  const { data, error } = await db
    .from("maintenance_requests")
    .insert({
      account_id: accountId,
      property_id,
      unit_id: unit?.id ?? null,
      lease_id,
      tenant_id,
      title,
      description: body.description ? String(body.description) : null,
      location: body.location ? String(body.location) : null,
      urgency,
      permission_to_enter: Boolean(body.permission_to_enter),
      assigned_to: body.assigned_to ? String(body.assigned_to) : null,
    })
    .select("id")
    .single();
  if (error || !data) return apiError(400, error?.message ?? "Could not create the request.");
  await db.from("maintenance_notes").insert({ request_id: data.id, account_id: accountId, author_name: "API", author_role: "system", body: "Request logged through the API.", visible_to_tenant: true });
  return NextResponse.json({ data: await loadObject(db, "repair", data.id, accountId) }, { status: 201 });
});
