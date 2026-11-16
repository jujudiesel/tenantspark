import { NextResponse, type NextRequest } from "next/server";
import { withApi, limitParam } from "@/lib/api/auth";
import { EVENT_TYPES, loadObject } from "@/lib/api/objects";

/** Recent events with their objects. Polling alternative to webhooks. ?type=rent.paid&since=<iso> */
export const GET = withApi(async ({ db, accountId }, request: NextRequest) => {
  const sp = request.nextUrl.searchParams;
  let q = db.from("events").select("id, type, object_type, object_id, created_at").eq("account_id", accountId).order("created_at", { ascending: false }).limit(limitParam(request, 25, 100));
  const type = sp.get("type");
  if (type) q = q.eq("type", type);
  const since = sp.get("since");
  if (since) q = q.gt("created_at", since);
  const { data: events } = await q;
  const out = [];
  for (const e of events ?? []) {
    const def = EVENT_TYPES[e.type];
    if (!def) continue;
    const object = await loadObject(db, def.object, e.object_id, accountId);
    if (object) out.push({ id: e.id, type: e.type, created_at: e.created_at, [def.object]: object });
  }
  return NextResponse.json({ data: out });
});
