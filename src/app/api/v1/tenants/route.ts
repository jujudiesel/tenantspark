import { NextResponse, type NextRequest } from "next/server";
import { withApi, readJson, apiError } from "@/lib/api/auth";
import { listRoute } from "@/lib/api/list";
import { loadObject } from "@/lib/api/objects";

export const GET = listRoute("tenant");

/** POST { name, email?, phone?, notes? } */
export const POST = withApi(async ({ db, accountId }, request: NextRequest) => {
  const body = await readJson(request);
  const name = String(body.name ?? body.full_name ?? "").trim();
  if (name.length < 2) return apiError(400, "name is required.");
  const email = body.email ? String(body.email).trim().toLowerCase() : null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return apiError(400, "email doesn't look right.");
  const { data, error } = await db
    .from("tenants")
    .insert({ account_id: accountId, full_name: name, email, phone: body.phone ? String(body.phone).trim() : null, notes: body.notes ? String(body.notes) : null })
    .select("id")
    .single();
  if (error || !data) return apiError(400, error?.message ?? "Could not create the tenant.");
  return NextResponse.json({ data: await loadObject(db, "tenant", data.id, accountId) }, { status: 201 });
});
