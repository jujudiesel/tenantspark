"use client";

import { useEffect, useState } from "react";

type Group = { id: string; title: string; items: { id: string; method?: string; title: string }[] };

/** Left-hand reference nav. Highlights the section currently on screen. */
export function DocsNav({ groups }: { groups: Group[] }) {
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ids = groups.flatMap((g) => [g.id, ...g.items.map((i) => i.id)]);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const onScroll = () => {
      const line = 120;
      let current = els[0].id;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [groups]);

  const color = (m?: string) => (m === "GET" ? "text-green-ink" : m === "DELETE" ? "text-red-ink" : "text-link");

  return (
    <nav aria-label="API reference" className="text-[14px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="lg:hidden w-full h-11 px-4 rounded-lg border border-line bg-white flex items-center justify-between font-semibold"
        aria-expanded={open}
      >
        Jump to
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>
      <div className={`${open ? "flex" : "hidden"} lg:flex flex-col gap-4 mt-3 lg:mt-0`}>
        {groups.map((g) => (
          <div key={g.id} className="flex flex-col">
            <a
              href={`#${g.id}`}
              onClick={() => setOpen(false)}
              className={`py-1 font-semibold ${active === g.id ? "text-ink" : "text-ink-2 hover:text-ink"}`}
            >
              {g.title}
            </a>
            {g.items.map((i) => (
              <a
                key={i.id}
                href={`#${i.id}`}
                onClick={() => setOpen(false)}
                className={`py-1 pl-3 flex items-baseline gap-2 border-l-2 ${active === i.id ? "border-navy text-ink" : "border-line-2 text-muted hover:text-ink"}`}
              >
                {i.method ? <span className={`text-[10px] font-bold w-9 flex-none ${color(i.method)}`}>{i.method === "DELETE" ? "DEL" : i.method}</span> : null}
                <span className="leading-snug">{i.title}</span>
              </a>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
