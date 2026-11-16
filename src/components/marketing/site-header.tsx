"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BoltBadge, Wordmark } from "@/components/logo";

import { FEATURES } from "./nav";

export function SiteHeader({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const link = "min-h-11 px-3 inline-flex items-center rounded-lg text-[15px] font-medium text-ink hover:bg-page";

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-line">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 min-h-[68px] flex items-center justify-between gap-4">
        <Link href="/" aria-label="TenantSpark home" className="inline-flex items-center gap-2.5 min-h-11">
          <BoltBadge size={34} />
          <Wordmark size={22} />
        </Link>

        <nav aria-label="Site" className="hidden md:flex items-center gap-0.5">
          <div ref={ref} className="relative">
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="true"
              onClick={() => setOpen((v) => !v)}
              className={`${link} gap-1.5`}
            >
              Features
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {open ? (
              <div className="absolute left-0 top-full mt-2 w-[340px] bg-white border border-line rounded-[14px] shadow-[0_12px_40px_rgba(14,23,48,0.12)] p-2">
                {FEATURES.map((f) => (
                  <Link key={f.href} href={f.href} onClick={() => setOpen(false)} className="flex flex-col gap-0.5 px-3.5 py-3 rounded-[10px] hover:bg-page">
                    <span className="text-[15px] font-semibold">{f.label}</span>
                    <span className="text-[13px] text-muted">{f.blurb}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <Link href="/pricing" className={link}>Pricing</Link>
          <Link href="/for-tenants" className={link}>For tenants</Link>
          <Link href="/about" className={link}>About</Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {loggedIn ? (
            <Link href="/dashboard" className="min-h-11 px-4.5 inline-flex items-center rounded-[10px] bg-navy text-white text-[15px] font-semibold">Open dashboard</Link>
          ) : (
            <>
              <Link href="/login" className={link}>Log in</Link>
              <Link href="/signup" className="min-h-11 px-4.5 inline-flex items-center rounded-[10px] bg-navy text-white text-[15px] font-semibold">Start free</Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          onClick={() => setMenu((v) => !v)}
          className="md:hidden w-11 h-11 -mr-2 inline-flex items-center justify-center rounded-lg"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
            {menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {menu ? (
        <nav aria-label="Site" className="md:hidden border-t border-line bg-white px-5 py-3 flex flex-col gap-0.5">
          <span className="px-3 pt-2 pb-1 text-[12px] font-bold uppercase tracking-wide text-muted">Features</span>
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} onClick={() => setMenu(false)} className="min-h-11 px-3 inline-flex items-center rounded-lg text-[15px] font-medium">{f.label}</Link>
          ))}
          <span className="border-t border-line-2 my-1.5" />
          <Link href="/pricing" onClick={() => setMenu(false)} className="min-h-11 px-3 inline-flex items-center rounded-lg text-[15px] font-medium">Pricing</Link>
          <Link href="/for-tenants" onClick={() => setMenu(false)} className="min-h-11 px-3 inline-flex items-center rounded-lg text-[15px] font-medium">For tenants</Link>
          <Link href="/about" onClick={() => setMenu(false)} className="min-h-11 px-3 inline-flex items-center rounded-lg text-[15px] font-medium">About</Link>
          <span className="border-t border-line-2 my-1.5" />
          {loggedIn ? (
            <Link href="/dashboard" className="min-h-12 inline-flex items-center justify-center rounded-[10px] bg-navy text-white text-[15px] font-semibold">Open dashboard</Link>
          ) : (
            <div className="flex flex-col gap-2 pb-2">
              <Link href="/signup" className="min-h-12 inline-flex items-center justify-center rounded-[10px] bg-navy text-white text-[15px] font-semibold">Start free</Link>
              <Link href="/login" className="min-h-12 inline-flex items-center justify-center rounded-[10px] border border-field text-[15px] font-semibold">Log in</Link>
            </div>
          )}
        </nav>
      ) : null}
    </header>
  );
}
