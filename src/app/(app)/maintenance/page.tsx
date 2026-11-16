import Link from "next/link";
import { requireAccount } from "@/lib/data";
import { Button, Card, Empty, Notice, PageHeader, Pill, fmtDate, moneyExact } from "@/components/ui";
import { STATUS, URGENCY } from "@/lib/maintenance";

export const metadata = { title: "Maintenance" };

type Filter = "open" | "new" | "scheduled" | "in_progress" | "done";

export default async function MaintenancePage({ searchParams }: { searchParams: Promise<{ filter?: string; error?: string }> }) {
  const sp = await searchParams;
  const { supabase, account } = await requireAccount();
  const filter = (["open", "new", "scheduled", "in_progress", "done"].includes(sp.filter ?? "") ? sp.filter : "open") as Filter;

  const { data } = await supabase
    .from("maintenance_requests")
    .select("id, title, location, urgency, status, scheduled_for, assigned_to, cost_cents, created_at, done_at, units(label), properties(name), tenants(full_name)")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false });

  type Row = {
    id: string; title: string; location: string | null; urgency: string; status: string; scheduled_for: string | null; assigned_to: string | null;
    cost_cents: number | null; created_at: string; done_at: string | null;
    units: { label: string } | null; properties: { name: string } | null; tenants: { full_name: string } | null;
  };
  const rows = ((data ?? []) as unknown as Row[]);
  const isOpen = (r: Row) => !["done", "closed"].includes(r.status);
  const rank = { emergency: 0, urgent: 1, routine: 2 } as Record<string, number>;
  const open = rows.filter(isOpen).sort((a, b) => rank[a.urgency] - rank[b.urgency] || (a.created_at < b.created_at ? -1 : 1));
  const closed = rows.filter((r) => !isOpen(r));

  const counts: Record<Filter, number> = {
    open: open.length,
    new: open.filter((r) => r.status === "new").length,
    scheduled: open.filter((r) => r.status === "scheduled").length,
    in_progress: open.filter((r) => r.status === "in_progress").length,
    done: closed.length,
  };
  const shown = filter === "open" ? open : filter === "done" ? closed : open.filter((r) => r.status === filter);
  const labels: Record<Filter, string> = { open: "All open", new: "New", scheduled: "Scheduled", in_progress: "In progress", done: "Done" };

  const now = new Date().getTime();
  const age = (iso: string) => {
    const days = Math.floor((now - new Date(iso).getTime()) / 86400000);
    return days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  };

  return (
    <>
      <PageHeader
        title="Maintenance"
        subtitle={open.length === 0 ? "Nothing open." : `${open.length} open ${open.length === 1 ? "request" : "requests"}`}
        actions={<Button href="/maintenance/new">Log a request</Button>}
      />

      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}

      {rows.length === 0 ? (
        <Card>
          <Empty
            title="No repair requests yet"
            body="Tenants send requests from their portal with photos and how urgent it is. You can also log one yourself from a call or a walk-through."
            action={<Button href="/maintenance/new">Log a request</Button>}
          />
        </Card>
      ) : (
        <Card>
          <div className="px-6 pt-5 pb-3 flex flex-wrap gap-2" role="tablist" aria-label="Filter requests">
            {(Object.keys(labels) as Filter[]).map((f) => (
              <Link
                key={f}
                href={f === "open" ? "/maintenance" : `/maintenance?filter=${f}`}
                role="tab"
                aria-selected={filter === f}
                className={`min-h-9 px-3.5 inline-flex items-center gap-1.5 rounded-full text-sm font-semibold border ${filter === f ? "bg-navy text-white border-navy" : "bg-white text-ink-2 border-line hover:border-field-strong"}`}
              >
                {labels[f]} <span className={`tabular ${filter === f ? "text-white/70" : "text-muted"}`}>{counts[f]}</span>
              </Link>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="px-6 pb-6 text-[15px] text-muted">Nothing here.</p>
          ) : (
            <ul>
              {shown.map((r) => (
                <li key={r.id}>
                  <Link href={`/maintenance/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 border-t border-line-2 hover:bg-page/60">
                    <span className="flex flex-col gap-0.5 flex-[1_1_280px] min-w-0">
                      <span className="text-[15px] font-semibold truncate">{r.title}</span>
                      <span className="text-[13px] text-muted">
                        {r.properties?.name}{r.units ? `, ${r.units.label}` : ""}{r.tenants ? `. ${r.tenants.full_name}` : ""}{r.location ? `. ${r.location}` : ""}
                      </span>
                    </span>
                    <span className="text-[13px] text-muted flex-[0_1_200px]">
                      {r.status === "scheduled" && r.scheduled_for
                        ? `Scheduled ${fmtDate(r.scheduled_for)}${r.assigned_to ? `, ${r.assigned_to}` : ""}`
                        : r.status === "done" || r.status === "closed"
                          ? `${r.done_at ? `Done ${fmtDate(r.done_at.slice(0, 10))}` : "Closed"}${r.cost_cents != null ? `, ${moneyExact(r.cost_cents)}` : ""}`
                          : `Sent ${age(r.created_at)}${r.assigned_to ? `, ${r.assigned_to}` : ""}`}
                    </span>
                    <span className="flex items-center gap-2">
                      {isOpen(r) && r.urgency !== "routine" ? <Pill tone={URGENCY[r.urgency].tone}>{URGENCY[r.urgency].label}</Pill> : null}
                      <Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}
