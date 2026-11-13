import { requireTenant } from "@/lib/tenant";
import { stripeConfigured } from "@/lib/stripe";
import { Card, Notice, Pill, fmtDate, moneyExact } from "@/components/ui";
import { PayForm } from "@/components/pay-form";
import { setAutopay } from "./actions";

export const metadata = { title: "Pay rent" };

export default async function TenantPayPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; autopay?: string; returned?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, tenant, leases, landlord } = await requireTenant();
  const active = leases.find((l) => l.status === "active");

  if (!tenant || !active) {
    return (
      <Card className="p-6 flex flex-col gap-2">
        <h1 className="font-display font-semibold text-2xl">Pay rent</h1>
        <p className="text-[15px] text-ink-2">There&apos;s no active lease on your account yet.</p>
      </Card>
    );
  }

  const [{ data: charges }, { data: settings }, { data: billing }, { data: history }] = await Promise.all([
    supabase
      .from("rent_charges")
      .select("id, due_date, amount_cents, late_fee_cents, paid_cents, status, description, payments(status)")
      .eq("lease_id", active.id)
      .neq("status", "void")
      .order("due_date"),
    supabase.from("payment_settings").select("charges_enabled, payouts_enabled, card_fee_bps, ach_fee_cents").eq("account_id", tenant.account_id).maybeSingle(),
    supabase.from("tenant_billing").select("autopay, method_label, stripe_payment_method_id").eq("tenant_id", tenant.id).maybeSingle(),
    supabase
      .from("payments")
      .select("id, amount_cents, fee_cents, method, status, paid_at, created_at, failure_message, rent_charges(description)")
      .eq("lease_id", active.id)
      .order("created_at", { ascending: false })
      .limit(24),
  ]);

  const open = (charges ?? []).filter((c) => c.status !== "paid");
  const nextCharge = open[0];
  const pendingOnNext = nextCharge ? ((nextCharge.payments as unknown as { status: string }[]) ?? []).some((p) => p.status === "pending") : false;
  const owed = nextCharge ? nextCharge.amount_cents + nextCharge.late_fee_cents - nextCharge.paid_cents : 0;
  const online = stripeConfigured() && Boolean(settings?.charges_enabled);
  const totalOwed = open.reduce((s, c) => s + c.amount_cents + c.late_fee_cents - c.paid_cents, 0);

  return (
    <>
      <h1 className="font-display font-semibold text-[26px] leading-tight">Pay rent</h1>

      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}
      {sp.autopay === "on" ? <Notice tone="success">Autopay is on.</Notice> : sp.autopay === "off" ? <Notice>Autopay is off.</Notice> : null}
      {sp.returned ? <Notice tone="success">Thanks. If your payment went through it will show below shortly.</Notice> : null}

      {!nextCharge ? (
        <Card className="p-6 flex flex-col gap-2">
          <h2 className="font-display font-semibold text-xl">Nothing due right now</h2>
          <p className="text-[15px] text-ink-2">Your next rent charge will show up here at the start of the month.</p>
        </Card>
      ) : !online ? (
        <Card className="p-6 flex flex-col gap-3">
          <span className="text-sm font-semibold text-muted">{nextCharge.description}</span>
          <span className="font-display font-semibold text-[40px] leading-none tabular">{moneyExact(owed)}</span>
          <span className="text-sm text-muted">Due {fmtDate(nextCharge.due_date)}</span>
          <Notice>Online payments aren&apos;t turned on yet. Pay {landlord} the way you do now.</Notice>
        </Card>
      ) : pendingOnNext ? (
        <Card className="p-6 flex flex-col gap-3">
          <span className="text-sm font-semibold text-muted">{nextCharge.description}</span>
          <span className="font-display font-semibold text-[40px] leading-none tabular">{moneyExact(owed)}</span>
          <Pill tone="amber">Payment processing</Pill>
          <p className="text-sm text-ink-2">A payment is on its way. Bank transfers take 2 to 4 business days to clear.</p>
        </Card>
      ) : (
        <Card className="p-6">
          <PayForm
            chargeId={nextCharge.id}
            owedCents={owed}
            description={`${nextCharge.description ?? "Rent"}, due ${fmtDate(nextCharge.due_date)}${nextCharge.late_fee_cents ? `, includes ${moneyExact(nextCharge.late_fee_cents)} late fee` : ""}`}
            cardFeeBps={settings?.card_fee_bps ?? 300}
            achFeeCents={settings?.ach_fee_cents ?? 249}
            hasSavedMethod={Boolean(billing?.stripe_payment_method_id)}
          />
        </Card>
      )}

      {open.length > 1 ? (
        <p className="text-[13px] text-muted">You have {open.length} open charges totaling {moneyExact(totalOwed)}. The oldest is shown first.</p>
      ) : null}

      {online ? (
        <Card className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold">Autopay {billing?.autopay ? "is on" : "is off"}</span>
            <span className="text-[13px] text-muted">
              {billing?.stripe_payment_method_id ? `Pays with ${billing.method_label} on the due date.` : "Pay once with the save option checked to turn this on."}
            </span>
          </div>
          {billing?.stripe_payment_method_id ? (
            <form action={setAutopay}>
              <input type="hidden" name="autopay" value={billing.autopay ? "off" : "on"} />
              <button type="submit" className="min-h-11 px-4.5 rounded-lg border border-field bg-white text-sm font-semibold">
                {billing.autopay ? "Turn off" : "Turn on"}
              </button>
            </form>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <div className="px-5 pt-5 pb-2">
          <h2 className="text-[15px] font-semibold">Payment history</h2>
        </div>
        {!history || history.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-muted">No payments yet.</p>
        ) : (
          <ul className="flex flex-col">
            {history.map((p) => {
              const label = { ach: "Bank transfer", card: "Card", cash: "Cash", check: "Check", other: "Other" }[p.method as "ach"] ?? p.method;
              const desc = (p.rent_charges as unknown as { description: string } | null)?.description ?? "Rent";
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-line-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold">{desc}</span>
                    <span className="text-[13px] text-muted">
                      {label}, {fmtDate((p.paid_at ?? p.created_at).slice(0, 10))}
                      {p.fee_cents ? ` (plus ${moneyExact(p.fee_cents)} fee)` : ""}
                      {p.status === "failed" && p.failure_message ? `. ${p.failure_message}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular">{moneyExact(p.amount_cents)}</span>
                    {p.status === "succeeded" ? <Pill tone="green">Paid</Pill> : p.status === "pending" ? <Pill tone="amber">Processing</Pill> : p.status === "refunded" ? <Pill tone="gray">Refunded</Pill> : <Pill tone="red">Failed</Pill>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
