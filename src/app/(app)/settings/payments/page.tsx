import { requireAccount } from "@/lib/data";
import { stripeConfigured } from "@/lib/stripe";
import { Button, Card, Field, Notice, PageHeader, Pill } from "@/components/ui";
import { connectStripe, openStripeDashboard, refreshStripeStatus, savePaymentRules } from "./actions";
import { SettingsTabs } from "@/components/settings-tabs";

export const metadata = { title: "Payments setup" };

export default async function PaymentsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ return?: string; refresh?: string; saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, account } = await requireAccount();
  const { data: settings } = await supabase.from("payment_settings").select("*").eq("account_id", account.id).maybeSingle();

  const connected = Boolean(settings?.stripe_account_id);
  const live = Boolean(settings?.charges_enabled && settings?.payouts_enabled);
  const cardPct = ((settings?.card_fee_bps ?? 300) / 100).toFixed(2).replace(/\.?0+$/, "");
  const achFee = ((settings?.ach_fee_cents ?? 249) / 100).toFixed(2);

  return (
    <>
      <PageHeader title="Payments setup" subtitle="Connect your bank so tenants can pay rent online." />
      <SettingsTabs />

      {sp.return && !live ? (
        <form action={refreshStripeStatus}>
          <Notice>
            Welcome back. Checking your Stripe status...{" "}
            <button type="submit" className="font-semibold text-link underline">Refresh</button>
          </Notice>
        </form>
      ) : null}
      {sp.saved ? <Notice tone="success">Saved.</Notice> : null}
      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}

      <Card className="p-7 flex flex-col gap-5 max-w-[720px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display font-semibold text-xl">Bank account</h2>
          {live ? <Pill tone="green">Connected</Pill> : connected ? <Pill tone="amber">Setup not finished</Pill> : <Pill tone="gray">Not connected</Pill>}
        </div>

        {!stripeConfigured() ? (
          <Notice tone="error">Payments aren&apos;t turned on for this site yet.</Notice>
        ) : live ? (
          <>
            <p className="text-[15px] leading-relaxed text-ink-2">
              Rent paid online goes straight to your bank account. Bank transfers usually land in 2 to 4 business days, cards in 2.
            </p>
            <div className="flex flex-wrap gap-2">
              <form action={openStripeDashboard}><Button type="submit" variant="secondary">Payouts and bank details</Button></form>
              <form action={refreshStripeStatus}><Button type="submit" variant="secondary">Refresh status</Button></form>
            </div>
          </>
        ) : (
          <>
            <p className="text-[15px] leading-relaxed text-ink-2">
              Payments run through Stripe, the same company behind payments for Amazon, Shopify and Lyft. You&apos;ll enter your business or personal
              details and the bank account where rent should land. It takes about five minutes.
            </p>
            <ul className="text-sm leading-relaxed text-ink-2 list-disc pl-5">
              <li>Tenants can pay by bank transfer or card</li>
              <li>Rent goes to your account, not ours. TenantSpark never holds your money.</li>
              <li>You can see every payout in Stripe at any time</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <form action={connectStripe}><Button type="submit">{connected ? "Finish setup" : "Connect your bank"}</Button></form>
              {connected ? <form action={refreshStripeStatus}><Button type="submit" variant="secondary">Refresh status</Button></form> : null}
            </div>
          </>
        )}
      </Card>

      <Card className="p-7 flex flex-col gap-5 max-w-[720px]">
        <h2 className="font-display font-semibold text-xl">What tenants pay</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">Bank transfer</dt>
          <dd className="font-semibold">${achFee} per payment, paid by the tenant</dd>
          <dt className="text-muted">Card</dt>
          <dd className="font-semibold">{cardPct}% per payment, paid by the tenant</dd>
        </dl>
        <p className="text-[13px] leading-relaxed text-muted">These fees cover processing. You receive the full rent amount either way.</p>
      </Card>

      <Card className="p-7 flex flex-col gap-5 max-w-[720px]">
        <h2 className="font-display font-semibold text-xl">Late fees</h2>
        <form action={savePaymentRules} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Late fee" name="late_fee" inputMode="decimal" defaultValue={settings ? (settings.late_fee_cents / 100).toString() : "0"} hint="Dollar amount added once rent is late. 0 for none." />
            <Field label="Grace period (days)" name="grace_days" inputMode="numeric" defaultValue={settings?.grace_days ?? 5} hint="Days after the due date before the fee applies." />
          </div>
          <p className="text-[13px] text-muted">Check your state and lease for limits on late fees. Michigan has no fixed cap but the fee has to be reasonable and in the lease.</p>
          <div><Button type="submit" variant="secondary">Save late fee rules</Button></div>
        </form>
      </Card>
    </>
  );
}
