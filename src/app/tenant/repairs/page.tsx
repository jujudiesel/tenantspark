import Link from "next/link";
import { requireTenant } from "@/lib/tenant";
import { Button, Card, Pill, fmtDate } from "@/components/ui";
import { STATUS, URGENCY } from "@/lib/maintenance";

export const metadata = { title: "Repairs" };

export default async function TenantRepairsPage() {
  const { supabase, tenant } = await requireTenant();
  const { data: requests } = tenant
    ? await supabase
        .from("maintenance_requests")
        .select("id, title, location, urgency, status, scheduled_for, created_at")
        .order("created_at", { ascending: false })
    : { data: [] };

  const open = (requests ?? []).filter((r) => !["done", "closed"].includes(r.status));
  const closed = (requests ?? []).filter((r) => ["done", "closed"].includes(r.status));

  const Row = ({ r }: { r: NonNullable<typeof requests>[number] }) => (
    <li>
      <Link href={`/tenant/repairs/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-4 border-t border-line-2 hover:bg-page/60">
        <span className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[15px] font-semibold truncate">{r.title}</span>
          <span className="text-[13px] text-muted">
            {r.location ? `${r.location}. ` : ""}Sent {fmtDate(r.created_at.slice(0, 10))}
            {r.status === "scheduled" && r.scheduled_for ? `. Scheduled ${fmtDate(r.scheduled_for)}` : ""}
          </span>
        </span>
        <span className="flex items-center gap-2 flex-none">
          {r.urgency !== "routine" ? <Pill tone={URGENCY[r.urgency].tone}>{URGENCY[r.urgency].label}</Pill> : null}
          <Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill>
        </span>
      </Link>
    </li>
  );

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display font-semibold text-[26px] leading-tight">Repairs</h1>
        <Button href="/tenant/repairs/new">Request a repair</Button>
      </div>

      <Card>
        <div className="px-5 pt-5 pb-2"><h2 className="text-[15px] font-semibold">Open</h2></div>
        {open.length === 0 ? <p className="px-5 pb-5 text-sm text-muted">Nothing open right now.</p> : <ul>{open.map((r) => <Row key={r.id} r={r} />)}</ul>}
      </Card>

      {closed.length > 0 ? (
        <Card>
          <div className="px-5 pt-5 pb-2"><h2 className="text-[15px] font-semibold">Done</h2></div>
          <ul>{closed.map((r) => <Row key={r.id} r={r} />)}</ul>
        </Card>
      ) : null}
    </>
  );
}
