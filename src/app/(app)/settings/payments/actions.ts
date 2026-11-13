"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount, dollarsToCents, num } from "@/lib/data";
import { siteUrl } from "@/lib/site";
import { stripe } from "@/lib/stripe";

const PAGE = "/settings/payments";

async function getOrCreateSettings() {
  const { supabase, account } = await requireAccount();
  const { data } = await supabase.from("payment_settings").select("*").eq("account_id", account.id).maybeSingle();
  if (data) return { supabase, account, settings: data };
  const { data: created, error } = await supabase.from("payment_settings").insert({ account_id: account.id }).select("*").single();
  if (error || !created) throw new Error(error?.message ?? "Could not create payment settings");
  return { supabase, account, settings: created };
}

/** Starts (or resumes) Stripe onboarding for the landlord and sends them to Stripe. */
export async function connectStripe() {
  const { supabase, account, settings } = await getOrCreateSettings();
  const { user } = await requireAccount();
  const base = await siteUrl();

  let acctId = settings.stripe_account_id as string | null;
  if (!acctId) {
    // Express account: light Stripe-hosted setup, TenantSpark collects fees and carries risk.
    const acct = await stripe().v2.core.accounts.create({
      display_name: account.name,
      contact_email: user.email ?? undefined,
      dashboard: "express",
      identity: { country: "us" },
      defaults: { currency: "usd", responsibilities: { fees_collector: "application", losses_collector: "application" } },
      configuration: {
        merchant: {
          capabilities: { card_payments: { requested: true }, ach_debit_payments: { requested: true } },
          mcc: "6513",
        },
        recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } },
      },
      metadata: { tenantspark_account_id: account.id },
    });
    acctId = acct.id;
    await supabase.from("payment_settings").update({ stripe_account_id: acctId }).eq("account_id", account.id);
  }

  const link = await stripe().v2.core.accountLinks.create({
    account: acctId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: { refresh_url: `${base}${PAGE}?refresh=1`, return_url: `${base}${PAGE}?return=1` },
    },
  });
  redirect(link.url);
}

/** Pulls the latest status from Stripe (called after they come back from onboarding). */
export async function refreshStripeStatus() {
  const { supabase, account, settings } = await getOrCreateSettings();
  if (settings.stripe_account_id) {
    const acct = await stripe().accounts.retrieve(settings.stripe_account_id);
    await supabase
      .from("payment_settings")
      .update({
        charges_enabled: Boolean(acct.charges_enabled),
        payouts_enabled: Boolean(acct.payouts_enabled),
        details_submitted: Boolean(acct.details_submitted),
      })
      .eq("account_id", account.id);
  }
  revalidatePath(PAGE);
  redirect(PAGE);
}

/** Opens the landlord's Stripe Express dashboard (payouts, bank account, tax forms). */
export async function openStripeDashboard() {
  const { settings } = await getOrCreateSettings();
  if (!settings.stripe_account_id) redirect(PAGE);
  const link = await stripe().accounts.createLoginLink(settings.stripe_account_id);
  redirect(link.url);
}

export async function savePaymentRules(formData: FormData) {
  const { supabase, account } = await getOrCreateSettings();
  const late_fee_cents = dollarsToCents(formData.get("late_fee")) ?? 0;
  const grace_days = Math.min(28, Math.max(0, Math.round(num(formData.get("grace_days")) ?? 5)));
  const { error } = await supabase.from("payment_settings").update({ late_fee_cents, grace_days }).eq("account_id", account.id);
  if (error) redirect(`${PAGE}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(PAGE);
  redirect(`${PAGE}?saved=1`);
}
