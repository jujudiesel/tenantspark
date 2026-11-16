"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    href: "/reports",
    label: "Reports",
    soon: true,
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
  return (
    <nav aria-label="Main" className="flex-[1_1_232px] max-w-full lg:max-w-[260px] bg-navy px-4 py-6 flex flex-col gap-7">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2 min-h-11" aria-label="TenantSpark dashboard">
        <BoltBadge size={34} />
        <Wordmark size={21} onDark />
      </Link>
      <div className="flex flex-row flex-wrap lg:flex-col gap-1">
        {items.map((it) => {
          const active = path === it.href || path.startsWith(it.href + "/");
          if (it.soon) {
            return (
              <span
                key={it.href}
                className="flex items-center gap-3 min-h-11 px-3 rounded-lg text-[15px] font-medium text-[#7E89A3] cursor-default"
                title="Coming soon"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-none">{it.icon}</svg>
                {it.label}
                <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-[#7E89A3]">Soon</span>
              </span>
            );
          }
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 min-h-11 px-3 rounded-lg text-[15px] ${
                active ? "bg-navy-3 text-white font-semibold" : "text-[#C3CBDD] font-medium hover:bg-navy-2 hover:text-white"
              }`}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke={active ? "#1492FF" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-none">{it.icon}</svg>
              {it.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex flex-col gap-0.5 px-3 py-3.5 rounded-[10px] bg-navy-2">
          <span className="text-sm font-semibold text-white">{accountName}</span>
          <span className="text-[13px] text-[#C3CBDD]">
            {propertyCount} {propertyCount === 1 ? "property" : "properties"}, {unitCount} {unitCount === 1 ? "unit" : "units"}
          </span>
        </div>
        <form action={logOut}>
          <button type="submit" className="w-full text-left min-h-11 px-3 rounded-lg text-sm font-medium text-[#C3CBDD] hover:bg-navy-2 hover:text-white">
            Log out
          </button>
        </form>
      </div>
    </nav>
  );
}
