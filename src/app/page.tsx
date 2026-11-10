import Link from "next/link";
import { BoltBadge, Wordmark } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    title: "Collect rent online",
    body: "Tenants pay by bank transfer or card. Autopay, late fees, and receipts are taken care of. The money goes straight to your bank account.",
    icon: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19" /><path d="M6.5 15h4" /></>,
  },
  {
    title: "Handle repair requests",
    body: "Tenants send a request with photos from their phone. You assign it and follow it until the job is done.",
    icon: <path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18l3 3 6.5-6.5a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.1-.7-.7-2.1z" />,
  },
  {
    title: "Leases and a tenant portal",
    body: "Upload a lease and get it signed online. Tenants log in to see their lease, what they owe, and their documents.",
    icon: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 13h6M9 17h6" /></>,
  },
  {
    title: "Accounting and reports",
    body: "See income and expenses for each property, a rent roll, and owner statements you can export.",
    icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  },
];

const steps = [
  ["Add your properties", "Enter each address and its units. A single house counts as one unit."],
  ["Invite your tenants", "Each tenant gets a link by email or text to set up their login."],
  ["Connect your bank", "Link the account where you want rent deposited, then start collecting."],
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="bg-white text-ink">
      <header className="max-w-[1200px] mx-auto px-6 sm:px-8 py-4.5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" aria-label="TenantSpark home" className="inline-flex items-center gap-2.5 min-h-11">
          <BoltBadge size={36} />
          <Wordmark size={24} />
        </Link>
        <nav aria-label="Site" className="flex flex-wrap items-center gap-1">
          <a href="#features" className="min-h-11 px-3 inline-flex items-center text-[15px] font-medium hover:text-link">Features</a>
          <a href="#pricing" className="min-h-11 px-3 inline-flex items-center text-[15px] font-medium hover:text-link">Pricing</a>
          {user ? (
            <Link href="/dashboard" className="min-h-11 px-4.5 inline-flex items-center rounded-lg bg-navy text-white text-[15px] font-semibold">Open dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="min-h-11 px-3 inline-flex items-center text-[15px] font-medium hover:text-link">Log in</Link>
              <Link href="/signup" className="min-h-11 px-4.5 inline-flex items-center rounded-lg bg-navy text-white text-[15px] font-semibold">Start free</Link>
            </>
          )}
        </nav>
      </header>

      <section className="max-w-[1200px] mx-auto px-6 sm:px-8 pt-14 pb-22 flex flex-wrap items-center gap-12 lg:gap-16">
        <div className="flex-[1_1_440px] min-w-0 flex flex-col gap-6">
          <p className="text-[15px] font-semibold text-link">For landlords with 1 to 50 units</p>
          <h1 className="font-display font-semibold text-[44px] sm:text-[60px] leading-[1.04] tracking-[-0.5px]">
            Property management software for small landlords
          </h1>
          <p className="max-w-[520px] text-[19px] leading-normal text-ink-2">
            Collect rent online, keep track of repairs, and have your leases and books in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="min-h-[52px] px-6.5 inline-flex items-center rounded-[10px] bg-navy text-white text-base font-semibold">Start free</Link>
            <a href="#pricing" className="min-h-[52px] px-6.5 inline-flex items-center rounded-[10px] border border-field text-base font-semibold">See pricing</a>
          </div>
          <p className="text-sm text-muted">Free during early access. No card needed to start.</p>
        </div>

        <div className="flex-[1_1_440px] min-w-0 bg-navy rounded-3xl p-6 sm:p-9 flex flex-col gap-4">
          <div className="bg-white rounded-[14px] p-6 flex flex-col gap-4">
            <span className="text-sm font-semibold text-muted">November rent</span>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-display font-semibold text-[44px] leading-none tabular">$14,250</span>
              <span className="text-[15px] text-muted">collected of $18,400</span>
            </div>
            <div aria-hidden="true" className="flex gap-[3px] h-3">
              <div className="rounded-l-md rounded-r-sm bg-spark" style={{ flex: 77.4 }} />
              <div className="rounded-sm bg-amber" style={{ flex: 15.5 }} />
              <div className="rounded-r-md rounded-l-sm bg-field" style={{ flex: 7.1 }} />
            </div>
          </div>
          <div className="bg-white rounded-[14px] px-6 py-2 flex flex-col">
            {[
              ["Aaron Bell", "1420 Maple St, 1A", "Paid, autopay", "bg-blue-bg text-blue-ink"],
              ["Dana Whitfield", "1420 Maple St, 2B", "Late, reminder sent", "bg-amber-bg text-amber-ink"],
              ["Kitchen faucet leaking", "Repair request, 1420 Maple St, 1B", "Plumber booked", "bg-line-2 text-ink-2"],
            ].map(([a, b, c, cls], i) => (
              <div key={a} className={`flex items-center justify-between gap-3 py-3.5 ${i < 2 ? "border-b border-line-2" : ""}`}>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold">{a}</span>
                  <span className="text-[13px] text-muted">{b}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-[13px] font-semibold whitespace-nowrap ${cls}`}>{c}</span>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-[#C3CBDD]">Sample numbers, shown to give you the idea.</p>
        </div>
      </section>

      <section id="features" className="bg-page">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 py-20 flex flex-col gap-10">
          <h2 className="font-display font-semibold text-[38px] leading-[1.1]">What you can do with it</h2>
          <div className="flex flex-wrap gap-6">
            {features.map((f) => (
              <article key={f.title} className="flex-[1_1_240px] min-w-0 bg-white border border-line rounded-[14px] p-6.5 flex flex-col gap-3">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#0B6FD6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">{f.icon}</svg>
                <h3 className="text-[19px] font-bold">{f.title}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 sm:px-8 py-20 flex flex-col gap-10">
        <h2 className="font-display font-semibold text-[38px] leading-[1.1]">How you get started</h2>
        <ol className="flex flex-wrap gap-8 lg:gap-12">
          {steps.map(([t, b], i) => (
            <li key={t} className="flex-[1_1_260px] min-w-0 flex flex-col gap-2.5">
              <span className="font-display font-semibold text-[44px] leading-none text-link">{i + 1}</span>
              <h3 className="text-[19px] font-bold">{t}</h3>
              <p className="text-[15px] leading-relaxed text-ink-2">{b}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="pricing" className="bg-page">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 py-20 flex flex-wrap items-center gap-10 lg:gap-16">
          <div className="flex-[1_1_360px] min-w-0 flex flex-col gap-4">
            <h2 className="font-display font-semibold text-[38px] leading-[1.1]">Pricing</h2>
            <p className="max-w-[460px] text-[17px] leading-relaxed text-ink-2">
              You pay per unit, each month. There is no minimum number of units, so you can start with one.
            </p>
          </div>
          <div className="flex-[1_1_360px] min-w-0 bg-white border border-line rounded-2xl p-8 flex flex-col gap-5">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-display font-semibold text-[44px] leading-none">$2</span>
              <span className="text-base text-muted">per unit, per month. $12 minimum.</span>
            </div>
            <ul className="flex flex-col gap-3 text-[15px] text-ink-2">
              {[
                "Rent collection, repairs, leases, and accounting",
                "Tenant logins at no extra charge",
                "Free bank transfers for tenants",
                "Cancel any time",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#0B6FD6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-none"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="min-h-[52px] inline-flex items-center justify-center rounded-[10px] bg-navy text-white text-base font-semibold">Start free</Link>
            <p className="text-[13px] text-muted">Free during early access. Billing starts when we leave early access, and we&apos;ll tell you first.</p>
          </div>
        </div>
      </section>

      <section className="bg-navy">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 py-18 flex flex-wrap items-center justify-between gap-6 lg:gap-12">
          <div className="flex flex-col gap-2.5">
            <h2 className="font-display font-semibold text-[36px] leading-[1.1] text-white">Try it with your own properties</h2>
            <p className="text-[17px] text-[#C3CBDD]">Setting up your first property takes a few minutes.</p>
          </div>
          <Link href="/signup" className="min-h-[52px] px-7 inline-flex items-center rounded-[10px] bg-spark text-navy text-base font-bold">Start free</Link>
        </div>
      </section>

      <footer className="max-w-[1200px] mx-auto px-6 sm:px-8 py-7 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <span>© {new Date().getFullYear()} TenantSpark</span>
        <div className="flex flex-wrap gap-1">
          <Link href="/terms" className="min-h-11 px-2.5 inline-flex items-center text-ink-2">Terms</Link>
          <Link href="/privacy" className="min-h-11 px-2.5 inline-flex items-center text-ink-2">Privacy</Link>
          <a href="mailto:hello@tenantspark.com" className="min-h-11 px-2.5 inline-flex items-center text-ink-2">Contact</a>
        </div>
      </footer>
    </div>
  );
}
