import { NextResponse } from "next/server";
import { withApi } from "@/lib/api/auth";

/** Income and expense categories for this account. */
export const GET = withApi(async ({ db, accountId }) => {
  const { data } = await db.from("categories").select("id, kind, name, archived").eq("account_id", accountId).eq("archived", false).order("kind").order("sort");
  return NextResponse.json({ data: data ?? [] });
});
