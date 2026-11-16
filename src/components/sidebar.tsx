"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BoltBadge, Wordmark } from "@/components/logo";
import { logOut } from "@/app/(auth)/actions";

const items: { href: string; label: string; icon: React.ReactNode; soon?: boolean }[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  },
  {
    href: "/properties",
    label: "Properties",
    icon: <><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" /><path d="M15 10h4a1 1 0 0 1 1 1v10" /><path d="M2 21h20" /><path d="M8 8h3M8 12h3M8 16h3" /></>,
  },
  {
    href: "/tenants",
    label: "Tenants",
    icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18.5 14.5a6.5 6.5 0 0 1 3 5.5" /></>,
  },
  {
    href: "/leases",
    label: "Leases",
    icon: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 13h6M9 17h6" /></>,
  },
  {
    href: "/rent",
    label: "Rent",
    icon: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19" /><path d="M6.5 15h4" /></>,
  },
  {
    href: "/maintenance",
    label: "Maintenance",
    icon: <path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18l3 3 6.5-6.5a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.1-.7-.7-2.1z" />,
  },
  {
    href: "/accounting",
    label: "Accounting",
    icon: <><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  },
  {
    href: "/settings/payments",
    label: "Settings",
    icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  },
];

export function Sidebar({
  accountName,
  propertyCount,
  unitCount,
}: {
  accountName: string;
  propertyCount: number;
  unitCount: number;
}) {
  const path = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const router = useRouter();

  // Cmd/Ctrl+K focuses search from anywhere in the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav aria-label="Main" className="flex-[1_1_232px] max-w-full lg:max-w-[248px] bg-white border-b lg:border-b-0 lg:border-r border-line px-3.5 py-5 flex flex-col gap-5">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2 min-h-10" aria-label="TenantSpark dashboard">
        <BoltBadge size={30} />
        <Wordmark size={19} />
      </Link>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
        className="relative"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input
          ref={searchRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          aria-label="Search tenants, properties, units and leases"
          className="box-border w-full min-h-10 pl-9 pr-12 rounded-[9px] border border-line bg-page text-sm placeholder:text-muted focus:outline-2 focus:outline-spark focus:outline-offset-1 focus:bg-white"
        />
        <kbd aria-hidden="true" className="hidden lg:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted border border-line rounded px-1.5 py-0.5 bg-white">⌘K</kbd>
      </form>

      <div className="flex flex-row flex-wrap lg:flex-col gap-0.5">
        {items.map((it) => {
          const active = path === it.href || path.startsWith(it.href.split("/").slice(0, 2).join("/") + "/") || path === it.href.split("/").slice(0, 2).join("/");
          if (it.soon) {
            return (
              <span key={it.href} className="flex items-center gap-3 min-h-10 px-3 rounded-[9px] text-[14px] font-medium text-muted/70 cursor-default" title="Coming soon">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-none">{it.icon}</svg>
                {it.label}
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-muted/70">Soon</span>
              </span>
            );
          }
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 min-h-10 px-3 rounded-[9px] text-[14px] ${
                active ? "bg-page text-ink font-semibold" : "text-ink-2 font-medium hover:bg-page/70 hover:text-ink"
              }`}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke={active ? "#0B6FD6" : "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-none">{it.icon}</svg>
              {it.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-row lg:flex-col items-center lg:items-stretch justify-between gap-1 pt-3 lg:pt-4 border-t border-line-2">
        <div className="flex items-center gap-3 px-2 py-1 lg:py-2">
          <span aria-hidden="true" className="w-8 h-8 rounded-full bg-navy text-white text-[13px] font-bold inline-flex items-center justify-center">
            {accountName.trim().slice(0, 1).toUpperCase() || "T"}
          </span>
          <span className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold truncate">{accountName}</span>
            <span className="text-[12px] text-muted">
              {propertyCount} {propertyCount === 1 ? "property" : "properties"}, {unitCount} {unitCount === 1 ? "unit" : "units"}
            </span>
          </span>
        </div>
        <form action={logOut}>
          <button type="submit" className="w-full text-left min-h-9 whitespace-nowrap px-3 rounded-[9px] text-[13px] font-medium text-muted hover:bg-page hover:text-ink">
            Log out
          </button>
        </form>
      </div>
    </nav>
  );
}
