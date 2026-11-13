"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/tenant";
import { stripe, convenienceFee } from "@/lib/stripe";

type Method = "ach" | "card";

async function landlordPaymentInfo(accountId: string, supabase: Awaited<ReturnType<typeof requireTenant>>["supabase"]) {
  const { data } = await supabase
    .from("payment_settings")
    .select("stripe_account_id, charges_enabled, payouts_enabled, card_fee_bps, ach_fee_cents")
    .eq("account_id", accountId)
    .maybeSingle();
  if (!data?.stripe_account_id || !data.charges_enabled) return null;
  return data;
}

async function ensureCustomer(tenant: { id: string; full_name: string; email: string | null }, supabase: Awaited<ReturnType<typeof requireTenant>>["supabase"]) {
  const { data: billing } = await supabase.from("tenant_billing").select("stripe_customer_id").eq("tenant_id", tenant.id).maybeSingle();
  if (billing?.stripe_customer_id) return billing.stripe_customer_id;
  const customer = await stripe().customers.create({
    name: tenant.full_name,
    email: tenant.email ?? undefined,
    metadata: { tenantspark_tenant_id: tenant.id },
  });
  await supabase.rpc("save_tenant_billing", { customer_id: customer.id, pm_id: null, pm_type: null, pm_label: null, auto: false });
  return customer.id;
}

/**
 * Creates the Stripe PaymentIntent for one rent charge and records a pending payment.
 * Returns the client secret the browser needs to finish the payment.
 */
export async function createRentPayment(input: { chargeId: string; amountCents: number; method: Method; saveForAutopay: boolean }) {
  const { supabase, tenant } = await requireTenant();
  if (!tenant) return { error: "Your login isn't connected to a lease." };

  const { data: charge } = await supabase
    .from("rent_charges")
    .select("id, account_id, lease_id, amount_cents, late_fee_cents, paid_cents, status, description")
    .eq("id", input.chargeId)
    .maybeSingle();
  if (!charge) return { error: "Charge not found." };
  const owed = charge.amount_cents + charge.late_fee_cents - charge.paid_cents;
  if (charge.status === "paid" || owed <= 0) return { error: "This is already paid." };
  const amount = Math.min(owed, Math.max(100, Math.round(input.amountCents)));

  const info = await landlordPaymentInfo(charge.account_id, supabase);
  if (!info) return { error: "Your landlord hasn't finished setting up online payments yet." };

  const fee = convenienceFee(amount, input.method, info);
  const customerId = await ensureCustomer(tenant, supabase);

  // Tenant pays rent + fee to TenantSpark; exactly the rent is sent on to the landlord. We keep the fee and pay Stripe out of it.
  const intent = await stripe().paymentIntents.create({
    amount: amount + fee,
    currency: "usd",
    customer: customerId,
    allowed_payment_method_types: input.method === "ach" ? ["us_bank_account"] : ["card"],
    setup_future_usage: input.saveForAutopay ? "off_session" : undefined,
    transfer_data: { destination: info.stripe_account_id!, amount },
    on_behalf_of: info.stripe_account_id!,
    description: charge.description ?? "Rent",
    statement_descriptor_suffix: "RENT",
    metadata: { tenantspark_charge_id: charge.id, tenantspark_tenant_id: tenant.id, rent_cents: String(amount), fee_cents: String(fee) },
  });

  const { error } = await supabase.rpc("start_tenant_payment", {
    c: charge.id,
    amt: amount,
    fee,
    pay_method: input.method,
    intent_id: intent.id,
  });
  if (error) {
    await stripe().paymentIntents.cancel(intent.id).catch(() => {});
    return { error: error.message.replace(/^.*?: /, "") };
  }

  return { clientSecret: intent.client_secret!, amount, fee };
}

/** After the browser confirms with Stripe, sync the result and remember the payment method if asked. */
export async function finishRentPayment(intentId: string, saveForAutopay: boolean) {
  const { supabase, tenant } = await requireTenant();
  if (!tenant) return { error: "Not a tenant." };

  const intent = await stripe().paymentIntents.retrieve(intentId, { expand: ["payment_method"] });
  if (intent.metadata?.tenantspark_tenant_id !== tenant.id) return { error: "That payment isn't yours." };

  const status =
    intent.status === "succeeded" ? "succeeded" : intent.status === "canceled" ? "failed" : intent.status === "requires_payment_method" ? "failed" : "pending";
  await supabase.rpc("settle_payment", { intent_id: intent.id, new_status: status, failure: intent.last_payment_error?.message ?? null });

  if (saveForAutopay && intent.payment_method && typeof intent.payment_method !== "string") {
    const pm = intent.payment_method;
    const label =
      pm.type === "card" && pm.card
        ? `${pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1)} ••${pm.card.last4}`
        : pm.us_bank_account
          ? `${pm.us_bank_account.bank_name ?? "Bank"} ••${pm.us_bank_account.last4}`
          : "Saved method";
    await supabase.rpc("save_tenant_billing", {
      customer_id: typeof intent.customer === "string" ? intent.customer : (intent.customer?.id ?? null),
      pm_id: pm.id,
      pm_type: pm.type === "card" ? "card" : "ach",
      pm_label: label,
      auto: true,
    });
  }

  revalidatePath("/tenant");
  revalidatePath("/tenant/pay");
  return { status };
}

export async function setAutopay(formData: FormData) {
  const { supabase, tenant } = await requireTenant();
  if (!tenant) redirect("/tenant");
  const on = formData.get("autopay") === "on";
  const { data: billing } = await supabase.from("tenant_billing").select("stripe_customer_id, stripe_payment_method_id, method_type, method_label").eq("tenant_id", tenant.id).maybeSingle();
  if (!billing?.stripe_payment_method_id && on) redirect("/tenant/pay?error=" + encodeURIComponent("Pay once with 'save for autopay' checked first."));
  await supabase.rpc("save_tenant_billing", {
    customer_id: billing?.stripe_customer_id ?? null,
    pm_id: billing?.stripe_payment_method_id ?? null,
    pm_type: billing?.method_type ?? null,
    pm_label: billing?.method_label ?? null,
    auto: on,
  });
  revalidatePath("/tenant/pay");
  redirect("/tenant/pay?autopay=" + (on ? "on" : "off"));
}
