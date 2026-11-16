import Link from "next/link";
import { Eyebrow, Wrap } from "@/components/marketing/sections";

export const metadata = { title: "Contact", description: "Reach the TenantSpark team." };

export default function ContactPage() {
  return (
    <section className="bg-page min-h-[60vh]">
      <Wrap className="pt-14 sm:pt-20 pb-20 flex flex-wrap gap-10 lg:gap-16">
        <div className="flex-[1_1_380px] min-w-0 flex flex-col gap-5">
          <Eyebrow>Contact</Eyebrow>
          <h1 className="font-display font-semibold text-[40px] sm:text-[54px] leading-[1.04] tracking-[-0.5px]">Talk to a person</h1>
          <p className="text-[18px] leading-normal text-ink-2 max-w-[520px]">Email is the fastest way. A person who builds TenantSpark reads it, usually the same day.</p>
        </div>
        <div className="flex-[1_1_360px] min-w-0 flex flex-col gap-4">
          {[
            ["Support and questions", "hello@tenantspark.com", "mailto:hello@tenantspark.com"],
            ["Something broken or a security issue", "security@tenantspark.com", "mailto:security@tenantspark.com"],
            ["Developers and integrations", "API docs", "/developers"],
          ].map(([t, l, href]) => (
            <div key={t} className="bg-white border border-line rounded-[14px] p-6 flex flex-col gap-1.5">
              <h2 className="text-[15px] font-semibold text-muted">{t}</h2>
              {href.startsWith("/") ? <Link href={href} className="text-[18px] font-semibold text-link">{l}</Link> : <a href={href} className="text-[18px] font-semibold text-link">{l}</a>}
            </div>
          ))}
          <p className="text-[14px] text-muted">TenantSpark, Detroit, Michigan.</p>
        </div>
      </Wrap>
    </section>
  );
}
