import Link from "next/link";
import { BoltBadge, Wordmark } from "@/components/logo";
import { FEATURES } from "./nav";

const cols = [
  { title: "Product", links: FEATURES.map((f) => ({ href: f.href, label: f.label })).concat([{ href: "/pricing", label: "Pricing" }]) },
  { title: "For tenants", links: [{ href: "/for-tenants", label: "Tenant portal" }, { href: "/login", label: "Log in" }, { href: "/forgot", label: "Forgot password" }] },
  { title: "Company", links: [{ href: "/about", label: "About" }, { href: "/contact", label: "Contact" }, { href: "/developers", label: "API docs" }] },
  { title: "Legal", links: [{ href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy" }] },
];

export function SiteFooter() {
  return (
    <footer className="bg-white border-t border-line">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14 flex flex-wrap gap-10 lg:gap-16">
        <div className="flex-[1_1_240px] flex flex-col gap-4">
          <Link href="/" aria-label="TenantSpark home" className="inline-flex items-center gap-2.5">
            <BoltBadge size={32} />
            <Wordmark size={21} />
          </Link>
          <p className="text-[15px] leading-relaxed text-ink-2 max-w-[300px]">Property management software for landlords with 1 to 50 units. Made in Detroit.</p>
          <a href="mailto:hello@tenantspark.com" className="text-[15px] font-semibold text-link">hello@tenantspark.com</a>
        </div>
        {cols.map((c) => (
          <div key={c.title} className="flex-[1_1_140px] flex flex-col gap-2.5">
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted">{c.title}</h2>
            <ul className="flex flex-col gap-1">
              {c.links.map((l) => (
                <li key={l.href + l.label}><Link href={l.href} className="min-h-9 inline-flex items-center text-[15px] text-ink-2 hover:text-ink">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line-2">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
          <span>© {new Date().getFullYear()} TenantSpark</span>
          <span>Rent payments processed by Stripe.</span>
        </div>
      </div>
    </footer>
  );
}
