import { Eyebrow, FinalCta, H2, Wrap } from "@/components/marketing/sections";

export const metadata = { title: "About", description: "Why TenantSpark exists and who makes it." };

export default function AboutPage() {
  return (
    <>
      <section className="bg-page border-b border-line">
        <Wrap className="pt-14 sm:pt-20 pb-16 max-w-[800px] flex flex-col gap-5">
          <Eyebrow>About</Eyebrow>
          <h1 className="font-display font-semibold text-[40px] sm:text-[56px] leading-[1.04] tracking-[-0.5px]">Made by a landlord who got tired of the spreadsheet</h1>
          <p className="text-[19px] leading-normal text-ink-2">TenantSpark is built in Detroit by a small team that manages its own rentals. We built the tool we wanted and priced it the way we wished the others were priced.</p>
        </Wrap>
      </section>

      <section>
        <Wrap className="py-20 max-w-[800px] flex flex-col gap-12 text-[17px] leading-relaxed text-ink-2">
          <div className="flex flex-col gap-4">
            <H2>The problem</H2>
            <p>If you own a few rentals, the software choices are odd. The big platforms are built for companies with hundreds of units and a staff. They cost $50 to $300 a month before add-ons, want a demo call before you see a price, and bury the three things you actually need under forty you don&apos;t.</p>
            <p>So most small landlords use a spreadsheet, Venmo, a folder of PDFs and a long text thread with each tenant. It works until it doesn&apos;t.</p>
          </div>
          <div className="flex flex-col gap-4">
            <H2>What we did about it</H2>
            <p>We took the parts that matter for one to fifty units, built them properly, and left out the rest. Rent that collects itself. Leases signed on a phone. Repairs with photos, tracked to done. A tenant portal that doesn&apos;t need an app store. One price per unit, shown on the website.</p>
            <p>Payments run through Stripe, so your money never passes through us. Your data is walled off from every other landlord&apos;s at the database level. And if you leave, you take your data with you.</p>
          </div>
          <div className="flex flex-col gap-4">
            <H2>How we work</H2>
            <ul className="flex flex-col gap-2 list-disc pl-5">
              <li>Plain language, on the site and in the product.</li>
              <li>Price on the page. No sales calls.</li>
              <li>Support answered by the people who build it.</li>
              <li>We manage rentals on TenantSpark ourselves, so we feel the rough edges first.</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <H2>Get in touch</H2>
            <p>Questions, ideas, something broken: <a href="mailto:hello@tenantspark.com" className="font-semibold text-link">hello@tenantspark.com</a>. We read everything.</p>
          </div>
        </Wrap>
      </section>

      <FinalCta />
    </>
  );
}
