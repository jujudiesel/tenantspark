import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export const Wrap = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`max-w-[1200px] mx-auto px-5 sm:px-8 ${className}`}>{children}</div>
);

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-link">{children}</p>
);

export const H2 = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <h2 className={`font-display font-semibold text-[32px] sm:text-[40px] leading-[1.08] tracking-[-0.3px] ${className}`}>{children}</h2>
);

export const Check = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#0B6FD6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-none mt-0.5"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

export const PrimaryLink = ({ href, children, light = false }: { href: string; children: ReactNode; light?: boolean }) => (
  <Link href={href} className={`min-h-[52px] px-7 inline-flex items-center justify-center rounded-[10px] text-base font-semibold ${light ? "bg-spark text-navy font-bold" : "bg-navy text-white"}`}>{children}</Link>
);

export const SecondaryLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="min-h-[52px] px-7 inline-flex items-center justify-center rounded-[10px] border border-field text-base font-semibold hover:bg-page">{children}</Link>
);

/** A screenshot in a thin browser or phone frame. */
export function Shot({ src, alt, kind = "browser", priority = false, className = "" }: { src: string; alt: string; kind?: "browser" | "phone"; priority?: boolean; className?: string }) {
  if (kind === "phone") {
    return (
      <div className={`mx-auto w-[260px] sm:w-[300px] rounded-[36px] bg-navy p-2.5 shadow-[0_24px_60px_rgba(14,23,48,0.22)] ${className}`}>
        <div className="rounded-[28px] overflow-hidden bg-white">
          <Image src={src} alt={alt} width={1170} height={2532} priority={priority} sizes="300px" className="w-full h-auto block" />
        </div>
      </div>
    );
  }
  return (
    <div className={`rounded-[14px] border border-line bg-white shadow-[0_24px_60px_rgba(14,23,48,0.14)] overflow-hidden ${className}`}>
      <div className="h-8 bg-page border-b border-line flex items-center gap-1.5 px-3.5">
        <span className="w-2.5 h-2.5 rounded-full bg-field" /><span className="w-2.5 h-2.5 rounded-full bg-field" /><span className="w-2.5 h-2.5 rounded-full bg-field" />
        <span className="ml-3 h-4 flex-1 max-w-[280px] rounded bg-line-2" />
      </div>
      <Image src={src} alt={alt} width={2880} height={1800} priority={priority} sizes="(min-width: 1200px) 1100px, 100vw" className="w-full h-auto block" />
    </div>
  );
}

/** Alternating image/text row. */
export function FeatureRow({
  eyebrow,
  title,
  body,
  bullets,
  href,
  shot,
  shotKind = "browser",
  flip = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  href?: string;
  shot: string;
  shotKind?: "browser" | "phone";
  flip?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-10 lg:gap-16 ${flip ? "flex-row-reverse" : ""}`}>
      <div className="flex-[1_1_380px] min-w-0 flex flex-col gap-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="font-display font-semibold text-[28px] sm:text-[34px] leading-[1.1]">{title}</h3>
        <p className="text-[17px] leading-relaxed text-ink-2 max-w-[520px]">{body}</p>
        <ul className="flex flex-col gap-2.5 text-[15px] text-ink-2">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2.5"><Check />{b}</li>
          ))}
        </ul>
        {href ? <Link href={href} className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-semibold text-link hover:text-link-dark">Learn more <span aria-hidden="true">→</span></Link> : null}
      </div>
      <div className="flex-[1_1_440px] min-w-0">
        <Shot src={shot} alt={title} kind={shotKind} />
      </div>
    </div>
  );
}

export function FAQ({ items, title = "Questions people ask" }: { items: [string, string][]; title?: string }) {
  return (
    <div className="flex flex-col gap-8">
      <H2>{title}</H2>
      <div className="flex flex-col border-t border-line">
        {items.map(([q, a]) => (
          <details key={q} className="group border-b border-line">
            <summary className="list-none cursor-pointer min-h-14 py-4 flex items-center justify-between gap-4 text-[17px] font-semibold">
              {q}
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-none text-muted transition-transform group-open:rotate-45"><path d="M12 5v14M5 12h14" /></svg>
            </summary>
            <p className="pb-5 text-[16px] leading-relaxed text-ink-2 max-w-[760px]">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function FinalCta({ title = "Try it with your own properties", body = "Setting up your first property takes a few minutes. Free during early access." }: { title?: string; body?: string }) {
  return (
    <section className="bg-navy">
      <Wrap className="py-16 sm:py-20 flex flex-wrap items-center justify-between gap-6 lg:gap-12">
        <div className="flex flex-col gap-2.5">
          <h2 className="font-display font-semibold text-[32px] sm:text-[38px] leading-[1.1] text-white">{title}</h2>
          <p className="text-[17px] text-[#C3CBDD] max-w-[560px]">{body}</p>
        </div>
        <PrimaryLink href="/signup" light>Start free</PrimaryLink>
      </Wrap>
    </section>
  );
}

export const APPS = ["Gmail", "Google Sheets", "QuickBooks", "Slack", "Trello", "Mailchimp", "Google Drive", "Dropbox", "Twilio", "Asana", "Notion", "HubSpot", "Airtable", "Google Calendar", "Outlook", "Salesforce"];

export function AppWall() {
  return (
    <div className="flex flex-wrap gap-2.5">
      {APPS.map((a) => (
        <span key={a} className="min-h-11 px-4 inline-flex items-center rounded-full bg-white border border-line text-[15px] font-semibold">{a}</span>
      ))}
      <span className="min-h-11 px-4 inline-flex items-center rounded-full bg-navy text-white text-[15px] font-semibold">and 8,000 more</span>
    </div>
  );
}
