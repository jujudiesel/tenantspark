"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { createRentPayment, finishRentPayment } from "@/app/tenant/pay/actions";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

type Method = "ach" | "card";

function dollars(c: number) {
  return (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function PayForm({
  chargeId,
  owedCents,
  description,
  cardFeeBps,
  achFeeCents,
  hasSavedMethod,
}: {
  chargeId: string;
  owedCents: number;
  description: string;
  cardFeeBps: number;
  achFeeCents: number;
  hasSavedMethod: boolean;
}) {
  const [method, setMethod] = useState<Method>("ach");
  const [amount, setAmount] = useState(owedCents);
  const [save, setSave] = useState(!hasSavedMethod);
  const [step, setStep] = useState<"choose" | "pay" | "done" | "processing">("choose");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fee = method === "card" ? Math.round((amount * cardFeeBps) / 10000) : achFeeCents;

  async function start() {
    setBusy(true);
    setError(null);
    const res = await createRentPayment({ chargeId, amountCents: amount, method, saveForAutopay: save });
    setBusy(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("clientSecret" in res && res.clientSecret) {
      setClientSecret(res.clientSecret);
      setAmount(res.amount ?? amount);
      setStep("pay");
    }
  }

  if (step === "done") {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="font-display font-semibold text-2xl">Payment sent</h2>
        <p className="text-[15px] leading-relaxed text-ink-2">
          {method === "ach"
            ? "Bank transfers take 2 to 4 business days to clear. We'll mark it paid when it does, and your landlord can see it's on the way."
            : "Your card payment went through. You'll see it in your payment history."}
        </p>
        <a href="/tenant/pay" className="inline-flex items-center justify-center min-h-11 px-4.5 rounded-lg text-sm font-semibold bg-navy text-white self-start">Back to rent</a>
      </div>
    );
  }

  if (step === "pay" && clientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: { colorPrimary: "#0E1730", colorText: "#0E1730", borderRadius: "10px", fontFamily: "Inter, system-ui, sans-serif" },
          },
        }}
      >
        <CheckoutStep amount={amount} fee={fee} method={method} save={save} onDone={() => setStep("done")} onBack={() => setStep("choose")} />
      </Elements>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-muted">{description}</span>
        <span className="font-display font-semibold text-[40px] leading-none tabular">{dollars(owedCents)}</span>
      </div>

      <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
        <legend className="text-sm font-semibold mb-2">How do you want to pay?</legend>
        {(
          [
            ["ach", "Bank account", achFeeCents === 0 ? "No fee" : `${dollars(achFeeCents)} fee`, "2 to 4 business days to clear"],
            ["card", "Debit or credit card", `${(cardFeeBps / 100).toFixed(2).replace(/\.?0+$/, "")}% fee`, "Clears right away"],
          ] as const
        ).map(([m, label, feeText, note]) => (
          <label key={m} className={`flex items-center gap-3 min-h-14 px-4 rounded-[10px] border bg-white cursor-pointer ${method === m ? "border-navy" : "border-field"}`}>
            <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} className="w-5 h-5 accent-navy" />
            <span className="flex flex-col flex-1 min-w-0">
              <span className="text-[15px] font-semibold">{label}</span>
              <span className="text-[13px] text-muted">{note}</span>
            </span>
            <span className="text-sm font-semibold text-ink-2">{feeText}</span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pay-amount" className="text-sm font-semibold">Amount</label>
        <div className="flex items-center gap-2">
          <span className="text-lg text-muted">$</span>
          <input
            id="pay-amount"
            type="number"
            inputMode="decimal"
            min={1}
            max={owedCents / 100}
            step="0.01"
            value={(amount / 100).toFixed(2)}
            onChange={(e) => setAmount(Math.round(Math.min(owedCents, Math.max(100, Number(e.target.value) * 100))))}
            className="box-border w-40 min-h-12 px-3.5 rounded-[10px] border border-field-strong bg-white text-base tabular"
          />
          {amount < owedCents ? <span className="text-[13px] text-muted">Partial payment. {dollars(owedCents - amount)} will still be owed.</span> : null}
        </div>
      </div>

      <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-sm p-4 rounded-[10px] bg-page">
        <dt className="text-muted">Rent</dt><dd className="font-semibold text-right tabular">{dollars(amount)}</dd>
        <dt className="text-muted">{method === "card" ? "Card fee" : "Bank transfer fee"}</dt><dd className="font-semibold text-right tabular">{dollars(fee)}</dd>
        <dt className="font-semibold pt-1.5 border-t border-line">Total today</dt><dd className="font-semibold text-right tabular pt-1.5 border-t border-line">{dollars(amount + fee)}</dd>
      </dl>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-2">
        <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className="mt-0.5 w-5 h-5 flex-none accent-navy" />
        <span>Save this payment method and turn on autopay. Rent gets paid automatically on the due date each month. You can turn it off any time.</span>
      </label>

      {error ? <div className="px-4 py-3 rounded-[10px] bg-red-bg text-red-ink text-sm">{error}</div> : null}

      <button type="button" onClick={start} disabled={busy} className="min-h-[52px] rounded-[10px] bg-navy text-white text-base font-bold disabled:opacity-60">
        {busy ? "One moment" : `Continue to pay ${dollars(amount + fee)}`}
      </button>
    </div>
  );
}

function CheckoutStep({ amount, fee, method, save, onDone, onBack }: { amount: number; fee: number; method: Method; save: boolean; onDone: () => void; onBack: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}/tenant/pay?returned=1` },
    });
    if (confirmError) {
      setError(confirmError.message ?? "Payment didn't go through.");
      setBusy(false);
      return;
    }
    if (paymentIntent) {
      const res = await finishRentPayment(paymentIntent.id, save);
      if ("error" in res && res.error) {
        setError(res.error);
        setBusy(false);
        return;
      }
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-muted">{method === "ach" ? "Bank account" : "Card"}</span>
        <span className="font-display font-semibold text-2xl tabular">{dollars(amount + fee)}</span>
      </div>
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? <div className="px-4 py-3 rounded-[10px] bg-red-bg text-red-ink text-sm">{error}</div> : null}
      <button type="submit" disabled={!stripe || busy} className="min-h-[52px] rounded-[10px] bg-navy text-white text-base font-bold disabled:opacity-60">
        {busy ? "Sending" : `Pay ${dollars(amount + fee)}`}
      </button>
      <button type="button" onClick={onBack} className="min-h-11 text-sm font-semibold text-ink-2">Back</button>
      <p className="text-[13px] text-muted">Payments are handled by Stripe. TenantSpark never sees your card or bank numbers.</p>
    </form>
  );
}
