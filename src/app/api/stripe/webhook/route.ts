import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase/admin";

// Stripe calls this when a payment succeeds, fails, or a connected account changes.
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new NextResponse("Webhook not configured", { status: 500 });

  const sig = request.headers.get("stripe-signature");
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig ?? "", secret);
  } catch (err) {
    return new NextResponse(`Bad signature: ${(err as Error).message}`, { status: 400 });
  }

  const db = adminClient();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      await db.rpc("settle_payment", { intent_id: pi.id, new_status: "succeeded", failure: null });
      break;
    }
    case "payment_intent.processing": {
      const pi = event.data.object;
      await db.rpc("settle_payment", { intent_id: pi.id, new_status: "pending", failure: null });
      break;
    }
    case "payment_intent.payment_failed":
    case "payment_intent.canceled": {
      const pi = event.data.object;
      await db.rpc("settle_payment", { intent_id: pi.id, new_status: "failed", failure: pi.last_payment_error?.message ?? "Payment didn't go through." });
      break;
    }
    case "charge.refunded": {
      const ch = event.data.object;
      const piId = typeof ch.payment_intent === "string" ? ch.payment_intent : ch.payment_intent?.id;
      if (piId && ch.refunded) await db.rpc("settle_payment", { intent_id: piId, new_status: "refunded", failure: null });
      break;
    }
    case "account.updated": {
      const acct = event.data.object;
      await db
        .from("payment_settings")
        .update({
          charges_enabled: Boolean(acct.charges_enabled),
          payouts_enabled: Boolean(acct.payouts_enabled),
          details_submitted: Boolean(acct.details_submitted),
        })
        .eq("stripe_account_id", acct.id);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
