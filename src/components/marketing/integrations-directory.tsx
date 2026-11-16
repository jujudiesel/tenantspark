"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, type Tag } from "./integrations-data";
import { BrandMark } from "./brand-mark";

const TAG: Record<Tag, string> = {
  "Built in": "bg-navy text-white",
  Zapier: "bg-[#FFF0E6] text-[#A33300]",
  API: "bg-blue-bg text-blue-ink",
  Planned: "bg-line-2 text-ink-2",
};

export function IntegrationsDirectory() {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const cats = useMemo(
    () => (term ? CATEGORIES.map((c) => ({ ...c, items: c.items.filter((i) => `${i.name} ${i.blurb} ${i.tag} ${c.title}`.toLowerCase().includes(term)) })).filter((c) => c.items.length) : CATEGORIES),
    [term],
  );
  const total = cats.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="flex flex-wrap lg:flex-nowrap gap-10 lg:gap-14 items-start">
      <aside className="w-full lg:w-[240px] flex-none lg:sticky lg:top-24 flex flex-col gap-4">
        <label className="relative block">
          <span className="sr-only">Search integrations</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search apps"
            className="box-border w-full min-h-11 pl-10 pr-3 rounded-[10px] border border-line bg-white text-[15px] placeholder:text-muted focus:outline-2 focus:outline-spark focus:outline-offset-1"
          />
        </label>
        <nav aria-label="Categories" className="hidden lg:flex flex-col">
          {CATEGORIES.map((c) => (
            <a key={c.id} href={`#${c.id}`} className="min-h-10 px-3 inline-flex items-center justify-between rounded-[9px] text-[15px] font-medium text-ink-2 hover:bg-page hover:text-ink">
              {c.title}
              <span className="text-[12px] text-muted tabular">{c.items.length}</span>
            </a>
          ))}
        </nav>
        <div className="lg:hidden flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <a key={c.id} href={`#${c.id}`} className="min-h-9 px-3 inline-flex items-center rounded-full border border-line text-[13px] font-semibold">{c.title}</a>
          ))}
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col gap-14">
        {term ? <p className="text-[15px] text-muted">{total} {total === 1 ? "match" : "matches"} for &quot;{q.trim()}&quot;</p> : null}
        {cats.length === 0 ? <p className="text-[17px] text-muted">Nothing by that name. Anything on Zapier can still be connected; try the Zapier card under Build your own.</p> : null}
        {cats.map((c) => (
          <section key={c.id} id={c.id} className="scroll-mt-28 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="font-display font-semibold text-[26px] leading-tight">{c.title}</h2>
              <p className="text-[15px] text-ink-2">{c.blurb}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {c.items.map((i) => {
                const inner = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <BrandMark name={i.name} color={i.color} />
                      <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold ${TAG[i.tag]}`}>{i.tag}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[16px] font-bold">{i.name}</h3>
                      <p className="text-[14px] leading-relaxed text-ink-2">{i.blurb}</p>
                    </div>
                  </>
                );
                const cls = "bg-white border border-line rounded-[14px] p-5 flex flex-col gap-4 min-h-[150px]";
                return i.href ? (
                  <Link key={i.name + i.blurb} href={i.href} className={`${cls} hover:border-field hover:shadow-[0_8px_24px_rgba(14,23,48,0.08)]`}>{inner}</Link>
                ) : (
                  <div key={i.name + i.blurb} className={cls}>{inner}</div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
