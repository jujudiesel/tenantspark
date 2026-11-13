"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoltBadge, Wordmark } from "@/components/logo";
import { logOut } from "@/app/(auth)/actions";

const items = [
  { href: "/tenant", label: "Home", icon: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" /> },
  { href: "/tenant/pay", label: "Pay", icon: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19" /><path d="M6.5 15h4" /></> },
  { href: "/tenant/lease", label: "Lease", icon: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 13h6M9 17h6" /></> },
  { href: "/tenant/documents", label: "Documents", icon: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8.5 7.5h7M8.5 11.5h7M8.5 15.5h4" /></> },
];

export function TenantNav({ name, landlord }: { name: string | null; landlord: string | null }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/tenant" ? path === "/tenant" : path.startsWith(href));
  return (
    <>
      <header className="bg-white border-b border-line">
        <div className="max-w-[720px] mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-3">
          <Link href="/tenant" className="inline-flex items-center gap-2 min-h-11" aria-label="Tenant portal home">
            <BoltBadge size={28} />
            <Wordmark size={18} />
          </Link>
          <nav aria-label="Tenant portal" className="hidden sm:flex items-center gap-1">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                aria-current={isActive(it.href) ? "page" : undefined}
                className={`min-h-11 px-3 inline-flex items-center rounded-lg text-sm ${isActive(it.href) ? "bg-page font-semibold" : "font-medium text-ink-2 hover:text-ink"}`}
              >
                {it.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-[13px] text-muted">{name}{landlord ? ` · ${landlord}` : ""}</span>
            <form action={logOut}>
              <button type="submit" className="min-h-11 px-3 rounded-lg text-sm font-medium text-ink-2 hover:text-ink">Log out</button>
            </form>
          </div>
        </div>
      </header>

      <nav aria-label="Tenant portal" className="sm:hidden fixed bottom-0 inset-x-0 z-10 grid grid-cols-4 bg-white border-t border-line px-2 pt-1.5 pb-[max(10px,env(safe-area-inset-bottom))]">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-current={isActive(it.href) ? "page" : undefined}
            className={`min-h-[52px] flex flex-col items-center justify-center gap-1 text-xs ${isActive(it.href) ? "text-link font-bold" : "text-muted font-semibold"}`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">{it.icon}</svg>
            {it.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
