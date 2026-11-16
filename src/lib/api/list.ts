import { NextResponse, type NextRequest } from "next/server";
import { withApi, limitParam } from "@/lib/api/auth";
import { SELECT, TABLE, shape, type ObjectType } from "@/lib/api/objects";

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** GET list endpoint for one object type. Supports ?limit, ?since (created after), and simple equality filters. */
export function listRoute(type: ObjectType, filters: string[] = [], order = "created_at") {
  return withApi(async ({ db, accountId }, request: NextRequest) => {
    const sp = request.nextUrl.searchParams;
    const table = db.from(TABLE[type]) as unknown as { select: (s: string) => Any };
    let q = table.select(SELECT[type]).eq("account_id", accountId).order(order, { ascending: false }).limit(limitParam(request));
    const since = sp.get("since");
    if (since) q = q.gt("created_at", since);
    for (const f of filters) {
      const v = sp.get(f);
      if (v) q = q.eq(f, v);
    }
    const { data, error } = (await q) as { data: Any[] | null; error: { message: string } | null };
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 400 });
    return NextResponse.json({ data: ((data ?? []) as unknown as Any[]).map(shape[type] as (x: Any) => unknown) });
  });
}
