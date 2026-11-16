import { Check, Eyebrow, FAQ, FinalCta, H2, PrimaryLink, Wrap } from "@/components/marketing/sections";

export const metadata = { title: "Pricing", description: "$2 per unit a month, $12 minimum. Every feature included. No contract." };

const included = [
  "Unlimited properties and tenants",
  "Online rent by bank transfer or card",
  "Autopay, late fees, grace periods",
  "Cash and check recording",
  "Lease documents and e-signing",
  "Repair requests with photos",
  "Tenant portal, free for tenants",
  "Dashboard, search, reports",
  "Zapier, webhooks and API",
  "Email support from people who built it",
];

const examples: [string, string][] = [
  ["1 to 6 units", "$12 a month"],
  ["10 units", "$20 a month"],
  ["25 units", "$50 a month"],
  ["50 units", "$100 a month"],
];

const faq: [string, string][] = [
  ["What counts as a unit?", "A place someone rents. A single-family house is one unit. A duplex is two. A 12-unit building is twelve."],
  ["Why a $12 minimum?", "It covers the cost of running your account. Up to six units you pay $12; after that it's $2 each."],
  ["Is there a contract or setup fee?", "No. Month to month, cancel from Settings whenever you want."],
  ["Are there payment fees?", "Not for you. Tenants pay nothing on bank transfers and a small convenience fee on card payments. You set that fee, and you can set it to zero."],
  ["Do tenants pay for the portal?", "Never."],
  ["What does early access mean?", "Right now TenantSpark is free while we finish the last pieces. When billing starts we'll email you first with the date, and you can leave before then without paying anything."],
  ["Do you charge for support?", "No. Email hello@tenantspark.com and a person who built the product answers."],
];

export default function PricingPage() {
  return (
    <>
      <section className="bg-page border-b border-line">
        <Wrap className="pt-14 sm:pt-20 pb-16 flex flex-col gap-10">
          <div className="max-w-[680px] flex flex-col gap-5">
            <Eyebrow>Pricing</Eyebrow>
            <h1 className="font-display font-semibold text-[42px] sm:text-[60px] leading-[1.04] tracking-[-0.5px]">One price. Everything in.</h1>
            <p className="text-[19px] leading-normal text-ink-2">No tiers, no add-ons, no sales call. Pay for the units you manage and nothing else.</p>
          </div>
          <div className="flex flex-wrap gap-6 items-stretch">
            <div className="flex-[1_1_380px] min-w-0 bg-white border border-line rounded-2xl p-8 sm:p-10 flex flex-col gap-6">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-display font-semibold text-[72px] leading-none">$2</span>
                <span className="text-[17px] text-muted">per unit, per month</span>
              </div>
              <p className="text-[15px] text-ink-2">$12 minimum a month. Free during early access.</p>
              <PrimaryLink href="/signup">Start free</PrimaryLink>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[15px] text-ink-2">
                {included.map((t) => <li key={t} className="flex gap-2.5"><Check />{t}</li>)}
              </ul>
            </div>
            <div className="flex-[1_1_280px] min-w-0 flex flex-col gap-4">
              <div className="bg-white border border-line rounded-2xl p-7 flex flex-col gap-4">
                <h2 className="text-[15px] font-bold uppercase tracking-wide text-muted">What it comes to</h2>
                <dl className="flex flex-col divide-y divide-line-2">
                  {examples.map(([u, p]) => (
                    <div key={u} className="py-3 flex items-baseline justify-between gap-4">
                      <dt className="text-[16px] font-medium">{u}</dt>
                      <dd className="text-[16px] font-semibold tabular">{p}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="bg-navy text-white rounded-2xl p-7 flex flex-col gap-2">
                <h2 className="text-[15px] font-bold uppercase tracking-wide text-[#C3CBDD]">Compared with</h2>
                <p className="text-[15px] leading-relaxed text-[#DCE2EE]">Most property management software starts around $50 to $70 a month and charges extra for e-signing, screening and support. For 10 units, that&apos;s three times the price.</p>
              </div>
            </div>
          </div>
        </Wrap>
      </section>

      <section>
        <Wrap className="py-20 max-w-[900px]">
          <FAQ items={faq} title="Pricing questions" />
        </Wrap>
      </section>

      <section className="bg-page border-t border-line">
        <Wrap className="py-16 flex flex-col gap-3 max-w-[760px]">
          <H2>Coming later, priced separately</H2>
          <p className="text-[17px] leading-relaxed text-ink-2">Tenant screening (credit and background reports, paid by the applicant) and a direct QuickBooks sync. Everything else stays in the $2.</p>
        </Wrap>
      </section>

      <FinalCta />
    </>
  );
}
