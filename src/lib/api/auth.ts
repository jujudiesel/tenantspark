import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export type ApiContext = { db: ReturnType<typeof adminClient>; accountId: string; keyId: string };

export function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

/** Makes a new key. Returns the full key (show once) and what we store. */
export function newApiKey() {
  const key = `ts_live_${randomBytes(24).toString("hex")}`;
  return { key, prefix: key.slice(0, 16), key_hash: hashKey(key) };
}

export function apiError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: { message, ...extra } }, { status });
}

/**
 * Resolves the API key on a request to an account. Keys go in `Authorization: Bearer ts_live_...`.
 * Returns a response (401/503) when the request can't proceed.
 */
export async function authenticate(request: NextRequest): Promise<ApiContext | NextResponse> {
  if (!process.env.SUPABASE_SECRET_KEY) return apiError(503, "The API is not configured on this server yet.");
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(ts_live_[a-f0-9]{48})$/i.exec(header.trim());
  if (!match) return apiError(401, "Missing or malformed API key. Send it as: Authorization: Bearer ts_live_...");

  const db = adminClient();
  const { data: key } = await db
    .from("api_keys")
    .select("id, account_id, revoked_at")
    .eq("key_hash", hashKey(match[1]))
    .maybeSingle();
  if (!key || key.revoked_at) return apiError(401, "That API key is not valid.");

  // Fire and forget. Not worth slowing the request for.
  void db.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id).then(() => undefined);

  return { db, accountId: key.account_id, keyId: key.id };
}

/** Wraps a handler: auth, JSON errors, never leaks a stack trace. */
export function withApi<T extends { params?: Promise<Record<string, string>> }>(
  handler: (ctx: ApiContext, request: NextRequest, extra: T) => Promise<NextResponse>,
) {
  return async (request: NextRequest, extra: T) => {
    const ctx = await authenticate(request);
    if (ctx instanceof NextResponse) return ctx;
    try {
      return await handler(ctx, request, extra);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      return apiError(500, msg);
    }
  };
}

export async function readJson(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function limitParam(request: NextRequest, def = 50, max = 200) {
  const n = Number(request.nextUrl.searchParams.get("limit"));
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : def;
}
