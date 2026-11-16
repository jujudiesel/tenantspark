import Link from "next/link";
import { Check, Eyebrow, FAQ, H2, Shot, Wrap } from "@/components/marketing/sections";

export const metadata = { title: "For tenants", description: "Pay rent, sign your lease and send repair requests from your phone." };

const steps: [string, string][] = [
  ["Get the invite", "Your landlord sends you a link by text or email. Open it on your phone."],
  ["Pick a password", "Your email is already filled in. Choose a password and you're in."],
  ["Add it to your home screen", "In Safari or Chrome, tap Share, then Add to Home Screen. It works like an app."],
];

const faq: [string, string][] = [
  ["Does it cost me anything?", "No. The portal is free for tenants. If you pay rent by card there's a small convenience fee shown before you confirm; bank transfers are free."],
  ["Is my bank info safe?", "Payments go through Stripe, which handles payments for millions of businesses. TenantSpark never sees or stores your card or bank numbers."],
  ["I didn't get an invite.", "Ask your landlord to send one from your tenant page. If you already have a login, use Forgot password on the login page."],
  ["Can I turn autopay off?", "Yes, from the Pay page, any time."],
  ["What if my repair is an emergency?", "Mark it as an emergency in the form. If someone is in danger or you smell gas, call 911 or your gas company first, then send the request."],
];

export default function TenantsPage() {
  return (
    <>
      <section className="bg-page border-b border-line">
        <Wrap className="pt-14 sm:pt-20 pb-12 sm:pb-16 flex flex-wrap items-center gap-12 lg:gap-16">
          <div className="flex-[1_1_420px] min-w-0 flex flex-col gap-6">
            <Eyebrow>For tenants</Eyebrow>
            <h1 className="font-display font-semibold text-[40px] sm:text-[56px] leading-[1.04] tracking-[-0.5px]">Rent, your lease and repairs, on your phone</h1>
            <p className="max-w-[560px] text-[18px] leading-normal text-ink-2">Your landlord uses TenantSpark. That means you can pay rent, sign your lease and report a problem without a phone call.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="min-h-[52px] px-7 inline-flex items-center justify-center rounded-[10px] bg-navy text-white text-base font-semibold">Log in</Link>
              <Link href="/forgot" className="min-h-[52px] px-7 inline-flex items-center justify-center rounded-[10px] border border-field text-base font-semibold hover:bg-white">Forgot password</Link>
            </div>
          </div>
          <div className="flex-[1_1_300px] min-w-0">
            <Shot src="/shots/tenant-home.png" alt="Tenant portal home screen showing rent due and quick actions" kind="phone" priority />
          </div>
        </Wrap>
      </section>

      <section>
        <Wrap className="py-20 flex flex-col gap-10">
          <H2>What you can do</H2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              ["See what's due", "Your rent, the due date and any late fee, right on the home screen."],
              ["Pay in a few taps", "Bank transfer (free) or card. Turn on autopay and forget about the 1st."],
              ["Sign your lease", "Open the document, read it, type your name. You get the signed copy."],
              ["Report a repair", "What's wrong, where, a photo, how urgent. Watch it get scheduled and done."],
            ].map(([t, b]) => (
              <div key={t} className="bg-white border border-line rounded-[14px] p-6 flex flex-col gap-2">
                <h3 className="text-[18px] font-bold">{t}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{b}</p>
              </div>
            ))}
          </div>
        </Wrap>
      </section>

      <section className="bg-page border-y border-line">
        <Wrap className="py-20 flex flex-wrap items-center gap-12 lg:gap-16">
          <div className="flex-[1_1_380px] min-w-0 flex flex-col gap-8">
            <H2>Getting in</H2>
            <ol className="flex flex-col gap-6">
              {steps.map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className="w-9 h-9 flex-none rounded-full bg-navy text-white font-display font-semibold inline-flex items-center justify-center">{i + 1}</span>
                  <div className="flex flex-col gap-1"><h3 className="text-[18px] font-bold">{t}</h3><p className="text-[15px] leading-relaxed text-ink-2">{b}</p></div>
                </li>
              ))}
            </ol>
            <ul className="flex flex-col gap-2 text-[15px] text-ink-2">
              {["Works on iPhone and Android, no app store", "Your landlord can resend the invite or a password reset any time"].map((t) => <li key={t} className="flex gap-2.5"><Check />{t}</li>)}
            </ul>
          </div>
          <div className="flex-[1_1_300px] min-w-0">
            <Shot src="/shots/tenant-repair-form.png" alt="Repair request form on a phone" kind="phone" />
          </div>
        </Wrap>
      </section>

      <section>
        <Wrap className="py-20 max-w-[900px]">
          <FAQ items={faq} title="Tenant questions" />
        </Wrap>
      </section>
    </>
  );
}
