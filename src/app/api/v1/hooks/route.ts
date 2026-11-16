import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { withApi, readJson, apiError } from "@/lib/api/auth";
import { EVENT_TYPES } from "@/lib/api/objects";

/** List this key's webhook subscriptions. */
export const GET = withApi(async ({ db, accountId }) => {
  const { data } = await db.from("webhook_subscriptions").select("id, url, event_type, source, active, created_at").eq("account_id", accountId).eq("active", true).order("created_at");
  return NextResponse.json({ data: data ?? [] });
});

/**
 * Subscribe. POST { url, event } where event is one of the event types or "*".
 * Returns { id, secret }. Every delivery is signed: X-TenantSpark-Signature: sha256=<hmac of body with secret>.
 */
export const POST = withApi(async ({ db, accountId, keyId }, request: NextRequest) => {
  const body = await readJson(request);
  const url = String(body.url ?? body.target_url ?? "").trim();
  const event = String(body.event ?? body.event_type ?? "*").trim();
  if (!/^https:\/\/.+/.test(url)) return apiError(400, "url must start with https://");
  if (event !== "*" && !EVENT_TYPES[event]) return apiError(400, `Unknown event. Use one of: ${Object.keys(EVENT_TYPES).join(", ")} or *`);
  const source = request.headers.get("user-agent")?.toLowerCase().includes("zapier") || /hooks\.zapier\.com/.test(url) ? "zapier" : "api";
  const secret = `whsec_${randomBytes(24).toString("hex")}`;
  const { data, error } = await db
    .from("webhook_subscriptions")
    .insert({ account_id: accountId, api_key_id: keyId, url, event_type: event, secret, source })
    .select("id, url, event_type, created_at")
    .single();
  if (error || !data) return apiError(400, error?.message ?? "Could not subscribe.");
  return NextResponse.json({ data: { ...data, secret } }, { status: 201 });
});
