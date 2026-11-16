import { NextResponse, type NextRequest } from "next/server";
import { stripe, convenienceFee } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase/admin";
import { sweepUndelivered } from "@/lib/api/deliver";
import { runDailyReminders } from "@/lib/reminders";

export const maxDuration = 120;

/**
 * Runs once a day (Vercel cron). Creates this month's rent charges, applies late fees
 * past the grace period, and pays charges due today for tenants with autopay on.
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected && request.headers.get("authorization") !== `Bearer ${expected}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const db = adminClient();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;

  const { data: created } = await db.rpc("generate_rent_charges", { month_start: monthStart });
  const { data: lateFees } = await db.rpc("apply_late_fees", { today });
  const { data: lateEvents } = await db.rpc("emit_late_rent_events", { today });

  // Autopay: charges due today or earlier, still owed, tenant has autopay with a saved method, no pending payment.
  const { data: due } = await db
    .from("rent_charges")
    .select("id, account_id, lease_id, amount_cents, late_fee_cents, paid_cents, description, payments(status), lease_tenants:leases(lease_tenants(tenant_id, is_primary))")
    .in("status", ["due", "partial"])
    .lte("due_date", today);

  let autopaid = 0;
  const errors: string[] = [];

  for (const c of due ?? []) {
    const pending = ((c.payments as unknown as { status: string }[]) ?? []).some((p) => p.status === "pending");
    if (pending) continue;
    const owed = c.amount_cents + c.late_fee_cents - c.paid_cents;
    if (owed <= 0) continue;

    const tenantIds = (((c.lease_tenants as unknown as { lease_tenants: { tenant_id: string; is_primary: boolean }[] } | null)?.lease_tenants) ?? [])
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
      .map((lt) => lt.tenant_id);
    if (tenantIds.length === 0) continue;

    const { data: billing } = await db
      .from("tenant_billing")
      .select("tenant_id, stripe_customer_id, stripe_payment_method_id, method_type")
      .in("tenant_id", tenantIds)
      .eq("autopay", true)
      .not("stripe_payment_method_id", "is", null)
      .limit(1)
      .maybeSingle();
    if (!billing) continue;

    const { data: settings } = await db
      .from("payment_settings")
      .select("stripe_account_id, charges_enabled, card_fee_bps, ach_fee_cents")
      .eq("account_id", c.account_id)
      .maybeSingle();
    if (!settings?.stripe_account_id || !settings.charges_enabled) continue;

    const method = (billing.method_type ?? "ach") as "ach" | "card";
    const fee = convenienceFee(owed, method, settings);

    try {
      const intent = await stripe().paymentIntents.create({
        amount: owed + fee,
        currency: "usd",
        customer: billing.stripe_customer_id!,
        payment_method: billing.stripe_payment_method_id!,
        off_session: true,
        confirm: true,
        transfer_data: { destination: settings.stripe_account_id, amount: owed },
        on_behalf_of: settings.stripe_account_id,
        description: `${c.description ?? "Rent"} (autopay)`,
        statement_descriptor_suffix: "RENT",
        metadata: { tenantspark_charge_id: c.id, tenantspark_tenant_id: billing.tenant_id, rent_cents: String(owed), fee_cents: String(fee), autopay: "1" },
      });
      await db.from("payments").insert({
        account_id: c.account_id,
        lease_id: c.lease_id,
        charge_id: c.id,
        tenant_id: billing.tenant_id,
        amount_cents: owed,
        fee_cents: fee,
        method,
        status: intent.status === "succeeded" ? "succeeded" : "pending",
        stripe_payment_intent_id: intent.id,
        paid_at: intent.status === "succeeded" ? new Date().toISOString() : null,
        note: "Autopay",
      });
      autopaid++;
    } catch (err) {
      errors.push(`${c.id}: ${(err as Error).message}`);
    }
  }

  // Rent due soon, due today, late, and leases ending.
  const reminders = await runDailyReminders(db, today);

  // Webhooks that never got through (app was down, endpoint timed out) get another try.
  const webhooks = await sweepUndelivered(db);

  return NextResponse.json({ date: today, chargesCreated: created ?? 0, lateFeesApplied: lateFees ?? 0, lateRentEvents: lateEvents ?? 0, autopaid, reminders, webhooks, errors });
}
