import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { deliverEvent } from "@/lib/api/deliver";

export const maxDuration = 60;

/** The database pings this when an event is inserted (see migration 0007). We fan it out to webhook subscriptions. */
export async function POST(request: NextRequest) {
  const expected = process.env.DISPATCH_SECRET;
  if (!expected || request.headers.get("x-tenantspark-dispatch") !== expected) return new NextResponse("Unauthorized", { status: 401 });
  if (!process.env.SUPABASE_SECRET_KEY) return new NextResponse("Not configured", { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { event_id?: string };
  if (!body.event_id) return new NextResponse("event_id required", { status: 400 });
  const result = await deliverEvent(adminClient(), body.event_id);
  return NextResponse.json(result);
}
