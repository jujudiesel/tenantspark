import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/tenant";
import { Button, Card, Notice, Pill, Textarea, fmtDate } from "@/components/ui";
import { STATUS, URGENCY } from "@/lib/maintenance";
import { addTenantNote, addTenantPhotos } from "../actions";

export default async function TenantRepairPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { id } = await params;
  const { sent } = await searchParams;
  const { supabase, landlord } = await requireTenant();
  const { data: r } = await supabase
    .from("maintenance_requests")
    .select("*, maintenance_notes(id, author_name, author_role, body, created_at), maintenance_photos(id, created_at)")
    .eq("id", id)
    .maybeSingle();
  if (!r) notFound();

  const notes = ((r.maintenance_notes as { id: string; author_name: string; author_role: string; body: string; created_at: string }[]) ?? []).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  const photos = ((r.maintenance_photos as { id: string }[]) ?? []);
  const isOpen = !["done", "closed"].includes(r.status);

  return (
    <>
      <div className="flex items-center gap-1">
        <Link href="/tenant/repairs" aria-label="Back to repairs" className="w-11 h-11 -ml-2 inline-flex items-center justify-center text-ink">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]"><path d="M15 5l-7 7 7 7" /></svg>
        </Link>
        <h1 className="font-display font-semibold text-[22px] leading-tight">{r.title}</h1>
      </div>

      {sent ? <Notice tone="success">Sent. {landlord ?? "Your landlord"} can see it now and will update it here.</Notice> : null}

      <Card className="p-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill>
          <Pill tone={URGENCY[r.urgency].tone}>{URGENCY[r.urgency].label}</Pill>
          {r.location ? <span className="text-sm text-muted">{r.location}</span> : null}
        </div>
        {r.status === "scheduled" && r.scheduled_for ? (
          <p className="text-[15px]"><strong className="font-semibold">Scheduled for {fmtDate(r.scheduled_for)}</strong>{r.assigned_to ? ` with ${r.assigned_to}` : ""}.</p>
        ) : r.assigned_to && isOpen ? (
          <p className="text-[15px]">Being handled by <strong className="font-semibold">{r.assigned_to}</strong>.</p>
        ) : null}
        {r.description ? <p className="text-[15px] leading-relaxed text-ink-2 whitespace-pre-line">{r.description}</p> : null}
        <p className="text-[13px] text-muted">
          Sent {fmtDate(r.created_at.slice(0, 10))}. {r.permission_to_enter ? "Okay to enter when you're not home." : "Someone must be home for entry."}
        </p>
        {photos.length ? (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <a key={p.id} href={`/photos/${p.id}`} target="_blank" rel="noopener" className="block aspect-square rounded-[10px] overflow-hidden bg-line-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/photos/${p.id}`} alt="" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        ) : null}
        {isOpen ? (
          <form action={addTenantPhotos} className="flex flex-wrap items-center gap-2" encType="multipart/form-data">
            <input type="hidden" name="request_id" value={r.id} />
            <input name="photos" type="file" accept="image/*" multiple className="text-sm file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-white file:border file:border-field file:text-sm file:font-semibold" />
            <Button type="submit" variant="secondary">Add photos</Button>
          </form>
        ) : null}
      </Card>

      <Card>
        <div className="px-5 pt-5 pb-2"><h2 className="text-[15px] font-semibold">Updates</h2></div>
        <ul>
          {notes.map((n) => (
            <li key={n.id} className="px-5 py-3.5 border-t border-line-2 flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold">{n.author_role === "tenant" ? "You" : n.author_role === "system" ? "TenantSpark" : n.author_name}</span>
                <span className="text-[12px] text-muted">{new Date(n.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              </div>
              <p className="text-[15px] leading-relaxed text-ink-2 whitespace-pre-line">{n.body}</p>
            </li>
          ))}
        </ul>
        {isOpen ? (
          <form action={addTenantNote} className="px-5 py-4 border-t border-line flex flex-col gap-3">
            <input type="hidden" name="request_id" value={r.id} />
            <Textarea label="Add a comment" name="body" rows={2} />
            <div><Button type="submit" variant="secondary">Send</Button></div>
          </form>
        ) : (
          <p className="px-5 py-4 border-t border-line text-sm text-muted">This request is closed. Send a new one if the problem comes back.</p>
        )}
      </Card>
    </>
  );
}
