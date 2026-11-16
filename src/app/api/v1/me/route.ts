import { NextResponse } from "next/server";
import { withApi } from "@/lib/api/auth";

export const GET = withApi(async ({ db, accountId }) => {
  const [{ data: account }, { count: properties }, { count: units }, { count: tenants }] = await Promise.all([
    db.from("accounts").select("id, name, created_at").eq("id", accountId).single(),
    db.from("properties").select("id", { count: "exact", head: true }).eq("account_id", accountId),
    db.from("units").select("id", { count: "exact", head: true }).eq("account_id", accountId),
    db.from("tenants").select("id", { count: "exact", head: true }).eq("account_id", accountId),
  ]);
  return NextResponse.json({ data: { id: account?.id, name: account?.name, properties: properties ?? 0, units: units ?? 0, tenants: tenants ?? 0, created_at: account?.created_at } });
});
