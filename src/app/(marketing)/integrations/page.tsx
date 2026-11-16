import Link from "next/link";
import { Eyebrow, FinalCta, PrimaryLink, SecondaryLink, Wrap } from "@/components/marketing/sections";
import { IntegrationsDirectory } from "@/components/marketing/integrations-directory";
import { INTEGRATION_COUNT } from "@/components/marketing/integrations-data";

export const metadata = { title: "Integrations", description: "Connect TenantSpark to QuickBooks, Gmail, Slack, Google Sheets and thousands of other apps through Zapier, or build on the API." };

export default function IntegrationsPage() {
  return (
    <>
      <section className="bg-page border-b border-line">
        <Wrap className="pt-12 sm:pt-16 pb-12 flex flex-col gap-6">
          <nav aria-label="Breadcrumb" className="text-[13px] text-muted"><Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden="true">/</span> Integrations</nav>
          <div className="max-w-[760px] flex flex-col gap-5">
            <Eyebrow>{INTEGRATION_COUNT} apps and counting</Eyebrow>
            <h1 className="font-display font-semibold text-[40px] sm:text-[56px] leading-[1.04] tracking-[-0.5px]">Connect TenantSpark to the rest of your work</h1>
            <p className="text-[18px] leading-normal text-ink-2 max-w-[620px]">Rent payments, repair requests, new tenants and signed leases can go to any of these the moment they happen. Most run through Zapier. A few are built in. All of it sits on a public API.</p>
            <div className="flex flex-wrap gap-3">
              <PrimaryLink href="/signup">Start free</PrimaryLink>
              <SecondaryLink href="/developers">API docs</SecondaryLink>
            </div>
          </div>
        </Wrap>
      </section>

      <section>
        <Wrap className="py-14 sm:py-16">
          <IntegrationsDirectory />
        </Wrap>
      </section>

      <section className="bg-page border-y border-line">
        <Wrap className="py-16 flex flex-wrap gap-5">
          <div className="flex-[1_1_320px] bg-white border border-line rounded-2xl p-7 flex flex-col gap-3">
            <h2 className="font-display font-semibold text-[24px]">Don&apos;t see your app?</h2>
            <p className="text-[15px] leading-relaxed text-ink-2">If it&apos;s on Zapier, it works with TenantSpark today. Make an API key in Settings, pick TenantSpark as the trigger, and pick your app as the action.</p>
            <Link href="/features/integrations" className="text-[15px] font-semibold text-link">How Zapier setup works →</Link>
          </div>
          <div className="flex-[1_1_320px] bg-white border border-line rounded-2xl p-7 flex flex-col gap-3">
            <h2 className="font-display font-semibold text-[24px]">Build your own</h2>
            <p className="text-[15px] leading-relaxed text-ink-2">A REST API for everything in your account and signed webhooks for every event. Keys are made and revoked from Settings.</p>
            <Link href="/developers" className="text-[15px] font-semibold text-link">Read the API docs →</Link>
          </div>
        </Wrap>
      </section>

      <FinalCta />
    </>
  );
}
