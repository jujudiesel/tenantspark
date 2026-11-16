import { NextResponse } from "next/server";
import { withApi, apiError } from "@/lib/api/auth";

export const DELETE = withApi<{ params: Promise<{ id: string }> }>(async ({ db, accountId }, _request, { params }) => {
  const { id } = await params;
  const { data } = await db.from("webhook_subscriptions").update({ active: false }).eq("id", id).eq("account_id", accountId).select("id").maybeSingle();
  if (!data) return apiError(404, "Subscription not found.");
  return NextResponse.json({ data: { id, active: false } });
});
