import { NextResponse, type NextRequest } from "next/server";
import { withApi, apiError } from "@/lib/api/auth";
import { EVENT_TYPES, SELECT, TABLE, shape } from "@/lib/api/objects";

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Sample payloads for an event type, in exactly the shape webhooks deliver.
 * Zapier uses this to show users real fields while they build a zap. GET ?event=rent.paid
 */
export const GET = withApi(async ({ db, accountId }, request: NextRequest) => {
  const event = request.nextUrl.searchParams.get("event") ?? "";
  const def = EVENT_TYPES[event];
  if (!def) return apiError(400, `Unknown event. Use one of: ${Object.keys(EVENT_TYPES).join(", ")}`);

  // Prefer real past events of this type; fall back to the newest objects of that kind.
  const { data: events } = await db.from("events").select("id, object_id, created_at").eq("account_id", accountId).eq("type", event).order("created_at", { ascending: false }).limit(3);
  const ids = (events ?? []).map((e) => e.object_id);
  let rows: Any[] = [];
  const table = db.from(TABLE[def.object]) as unknown as { select: (s: string) => Any };
  if (ids.length) {
    const { data } = (await table.select(SELECT[def.object]).in("id", ids)) as { data: Any[] | null };
    rows = data ?? [];
  }
  if (rows.length === 0) {
    const { data } = (await table.select(SELECT[def.object]).eq("account_id", accountId).order("created_at", { ascending: false }).limit(3)) as { data: Any[] | null };
    rows = data ?? [];
  }
  const out = rows.map((r, i) => ({
    id: events?.[i]?.id ?? `sample_${r.id}`,
    type: event,
    created_at: events?.[i]?.created_at ?? r.created_at,
    [def.object]: (shape[def.object] as (x: Any) => unknown)(r),
  }));
  return NextResponse.json({ data: out });
});
