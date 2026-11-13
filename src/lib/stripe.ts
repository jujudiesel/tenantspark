import Stripe from "stripe";

let client: Stripe | null = null;

export function stripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

/** Convenience fee the tenant pays on top of rent, in cents. */
export function convenienceFee(amountCents: number, method: "ach" | "card", settings: { card_fee_bps: number; ach_fee_cents: number }) {
  if (method === "card") return Math.round((amountCents * settings.card_fee_bps) / 10000);
  return settings.ach_fee_cents;
}

