import Link from "next/link";
import { Check, Eyebrow, FAQ, FeatureRow, FinalCta, H2, PrimaryLink, SecondaryLink, Shot, Wrap } from "@/components/marketing/sections";
import { Honeycomb } from "@/components/marketing/honeycomb";
import { PortfolioCards } from "@/components/marketing/portfolio-cards";

export const metadata = {
  title: "TenantSpark: property management software for small landlords",
  description: "Collect rent online, sign leases, and track repairs. Tenants get a portal on their phone. $2 per unit a month.",
};

const facts = [
  ["10 min", "to add your first property and invite a tenant"],
  ["$2", "per unit a month, no contract"],
  ["Free", "for tenants, always"],
  ["Stripe", "handles the money, never us"],
];

const steps: [string, string][] = [
  ["Add your properties", "Enter each address and its units. A single house counts as one unit."],
  ["Invite your tenants", "Each tenant gets a link by text or email to set up their login."],
  ["Connect your bank", "Link the account where rent should land, then let tenants pay online."],
];

const faq: [string, string][] = [
  ["Who is TenantSpark for?", "Landlords who manage their own places, from one unit to about fifty. If you have a bigger portfolio with a full-time staff, you probably want something heavier."],
  ["What does it cost?", "$2 per unit each month, with a $12 minimum. One house is one unit. During early access it's free, and we'll tell you before billing starts."],
  ["How do tenants pay?", "By bank transfer or card from their phone. Rent goes straight to your bank account through Stripe. Tenants can turn on autopay so rent arrives on the 1st without anyone thinking about it."],
  ["Is there a fee on payments?", "You pay nothing on rent. Tenants pay a small convenience fee on card payments. You set the late fee and grace period."],
  ["Can tenants sign the lease online?", "Yes. Upload your lease, send it, and every tenant on the lease signs from their phone. You get a stamped PDF with the signatures and timestamps."],
  ["What happens with repair requests?", "Tenants send them from the portal with photos and how urgent it is. You schedule a vendor, post updates the tenant can see, and mark it done with the cost. Every step is kept."],
  ["Does it work with QuickBooks or other tools?", "Yes, through Zapier. Connect TenantSpark once and send rent payments, repairs and new leases to QuickBooks, Google Sheets, Slack, Gmail and thousands of other apps."],
  ["Is my data safe?", "Each landlord's data is walled off at the database level, so one account can never see another's. Payments go through Stripe and we never store card or bank numbers."],
  ["Can I cancel?", "Any time, from Settings. Export your data first if you want it; it's yours."],
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-page border-b border-line">
        <Wrap className="pt-14 sm:pt-20 pb-10 sm:pb-16 flex flex-col gap-12">
          <div className="max-w-[760px] flex flex-col gap-6">
            <Eyebrow>For landlords with 1 to 50 units</Eyebrow>
            <h1 className="font-display font-semibold text-[42px] sm:text-[64px] leading-[1.02] tracking-[-0.6px]">
              Rent, leases and repairs in one place
            </h1>
            <p className="max-w-[600px] text-[19px] leading-normal text-ink-2">
              Tenants pay online, sign leases on their phone and send repair requests with photos. You see all of it on one screen.
            </p>
            <div className="flex flex-wrap gap-3">
              <PrimaryLink href="/signup">Start free</PrimaryLink>
              <SecondaryLink href="/pricing">See pricing</SecondaryLink>
            </div>
            <p className="text-sm text-muted">Free during early access. No card needed to start.</p>
          </div>
          <Shot src="/shots/dashboard.png" alt="TenantSpark dashboard showing outstanding balance, rent collected, open repairs and occupancy" priority />
        </Wrap>
      </section>

      {/* Facts */}
      <section className="border-b border-line">
        <Wrap className="py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {facts.map(([n, t]) => (
            <div key={n} className="flex flex-col gap-1">
              <span className="font-display font-semibold text-[30px] leading-none">{n}</span>
              <span className="text-[14px] text-muted">{t}</span>
            </div>
          ))}
        </Wrap>
      </section>

      {/* Feature rows */}
      <section>
        <Wrap className="py-20 sm:py-24 flex flex-col gap-24">
          <div className="max-w-[720px] flex flex-col gap-4">
            <Eyebrow>What it does</Eyebrow>
            <H2>The work of a landlord, without the spreadsheet and the text threads</H2>
          </div>
          <FeatureRow
            eyebrow="Rent collection"
            title="Rent that shows up on its own"
            body="Charges post on the 1st. Tenants pay by bank transfer or card, or turn on autopay. Late fees apply after your grace period. Cash and checks get recorded in two clicks."
            bullets={["Money lands in your bank through Stripe", "See paid, late and partial at a glance", "Receipts and history for every tenant"]}
            href="/features/rent-collection"
            shot="/shots/rent.png"
          />
          <FeatureRow
            flip
            eyebrow="Maintenance"
            title="Repairs tracked from the first text to the last invoice"
            body="A tenant sends a request with photos and how urgent it is. You schedule the vendor, post updates the tenant can see, keep private notes they can't, and close it with the cost."
            bullets={["Emergencies sort to the top", "Tenant sees the schedule and updates in their portal", "Cost and history stay with the unit"]}
            href="/features/maintenance"
            shot="/shots/repair-detail.png"
          />
          <FeatureRow
            eyebrow="Leases"
            title="Leases signed on a phone, stamped and stored"
            body="Upload your lease, send it to every tenant on it, and they sign by typing their name. You get a PDF with the signatures and times stamped on it. No DocuSign bill."
            bullets={["Works for one tenant or roommates", "Lease, rent and deposit terms kept with the unit", "Ending leases flagged 90 days out"]}
            href="/features/leases"
            shot="/shots/tenant-lease.png"
            shotKind="phone"
          />
          <FeatureRow
            flip
            eyebrow="Tenant portal"
            title="Tenants get a portal that works on their phone"
            body="They see what's due, pay it, sign documents and send repair requests. Fewer calls and texts to you, and everything they do is logged."
            bullets={["Add to home screen, no app store", "Password reset and invites you control", "Free for tenants"]}
            href="/features/tenant-portal"
            shot="/shots/tenant-home.png"
            shotKind="phone"
          />
        </Wrap>
      </section>

      {/* Steps */}
      <section className="bg-page border-y border-line">
        <Wrap className="py-20 flex flex-col gap-10">
          <H2>How you get started</H2>
          <ol className="flex flex-wrap gap-8 lg:gap-12">
            {steps.map(([t, b], i) => (
              <li key={t} className="flex-[1_1_260px] min-w-0 flex flex-col gap-2.5">
                <span className="font-display font-semibold text-[44px] leading-none text-link">{i + 1}</span>
                <h3 className="text-[19px] font-bold">{t}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{b}</p>
              </li>
            ))}
          </ol>
        </Wrap>
      </section>

      <PortfolioCards />

      <Honeycomb />

      {/* Pricing teaser */}
      <section className="bg-page border-y border-line">
        <Wrap className="py-20 flex flex-wrap items-center gap-10 lg:gap-16">
          <div className="flex-[1_1_360px] min-w-0 flex flex-col gap-4">
            <Eyebrow>Pricing</Eyebrow>
            <H2>$2 a unit. That&apos;s the whole price list.</H2>
            <p className="text-[17px] leading-relaxed text-ink-2 max-w-[460px]">
              Every feature is included. No setup fee, no contract, no charge for tenant logins. $12 minimum a month.
            </p>
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-link hover:text-link-dark">Pricing details <span aria-hidden="true">→</span></Link>
          </div>
          <div className="flex-[1_1_360px] min-w-0 bg-white border border-line rounded-2xl p-8 flex flex-col gap-5">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-display font-semibold text-[52px] leading-none">$2</span>
              <span className="text-base text-muted">per unit, per month</span>
            </div>
            <ul className="flex flex-col gap-2.5 text-[15px] text-ink-2">
              {["Rent collection, leases, e-sign, repairs", "Tenant portal at no extra charge", "Zapier and API access", "Cancel any time"].map((t) => (
                <li key={t} className="flex gap-2.5"><Check />{t}</li>
              ))}
            </ul>
            <PrimaryLink href="/signup">Start free</PrimaryLink>
          </div>
        </Wrap>
      </section>

      {/* FAQ */}
      <section>
        <Wrap className="py-20 max-w-[900px]">
          <FAQ items={faq} />
        </Wrap>
      </section>

      <FinalCta />
    </>
  );
}
