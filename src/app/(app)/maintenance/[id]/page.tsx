import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/data";
import { Button, Card, Field, Notice, PageHeader, Pill, Textarea, fmtDate, moneyExact } from "@/components/ui";
import { STATUS, URGENCY } from "@/lib/maintenance";
import { addLandlordNote, addLandlordPhotos, deletePhoto, updateDetails, updateStatus } from "../actions";

export default async function MaintenanceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, account } = await requireAccount();

  const { data } = await supabase
    .from("maintenance_requests")
    .select("*, units(id, label), properties(id, name), tenants(id, full_name, phone, email), maintenance_notes(id, author_name, author_role, body, visible_to_tenant, created_at), maintenance_photos(id, created_at)")
    .eq("id", id)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!data) notFound();

  type Note = { id: string; author_name: string; author_role: string; body: string; visible_to_tenant: boolean; created_at: string };
  const r = data as unknown as Omit<typeof data, "units" | "properties" | "tenants" | "maintenance_notes" | "maintenance_photos"> & {
    units: { id: string; label: string } | null;
    properties: { id: string; name: string } | null;
    tenants: { id: string; full_name: string; phone: string | null; email: string | null } | null;
    maintenance_notes: Note[];
    maintenance_photos: { id: string; created_at: string }[];
  };
  const notes = [...(r.maintenance_notes ?? [])].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  const photos = r.maintenance_photos ?? [];
  const isOpen = !["done", "closed"].includes(r.status);
  const today = new Date().toISOString().slice(0, 10);
  const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link href="/maintenance" className="text-sm font-semibold text-link hover:text-link-dark">All requests</Link>
        <PageHeader
          title={r.title}
          subtitle={`${r.properties?.name ?? ""}${r.units ? `, ${r.units.label}` : ""}${r.location ? `. ${r.location}` : ""}. Sent ${fmtDate(r.created_at.slice(0, 10))}`}
          actions={
            <div className="flex items-center gap-2">
              <Pill tone={URGENCY[r.urgency].tone}>{URGENCY[r.urgency].label}</Pill>
              <Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill>
            </div>
          }
        />
      </div>

      {sp.error ? <Notice tone="error">{sp.error}</Notice> : null}
      {sp.saved ? <Notice tone="success">Saved.</Notice> : null}

      <div className="flex flex-wrap gap-6 items-start">
        <div className="flex-[3_1_460px] min-w-0 flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-4">
            {r.description ? <p className="text-[15px] leading-relaxed whitespace-pre-line">{r.description}</p> : <p className="text-[15px] text-muted">No details given.</p>}
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted">Tenant</dt>
              <dd>
                {r.tenants ? (
                  <>
                    <Link href={`/tenants/${r.tenants.id}`} className="font-semibold text-link">{r.tenants.full_name}</Link>
                    {r.tenants.phone ? <span className="text-muted"> · {r.tenants.phone}</span> : null}
                  </>
                ) : (
                  <span className="text-muted">None on this unit</span>
                )}
              </dd>
              <dt className="text-muted">Entry</dt>
              <dd>{r.permission_to_enter ? "Okay to enter when they're not home" : "Someone must be home"}</dd>
              {r.assigned_to ? (<><dt className="text-muted">Handled by</dt><dd>{r.assigned_to}</dd></>) : null}
              {r.scheduled_for ? (<><dt className="text-muted">Scheduled</dt><dd>{fmtDate(r.scheduled_for)}</dd></>) : null}
              {r.cost_cents != null ? (<><dt className="text-muted">Cost</dt><dd className="tabular">{moneyExact(r.cost_cents)}</dd></>) : null}
              {r.done_at ? (<><dt className="text-muted">Done</dt><dd>{fmtDate(r.done_at.slice(0, 10))}</dd></>) : null}
            </dl>

            {photos.length ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="relative group">
                    <a href={`/photos/${p.id}`} target="_blank" rel="noopener" className="block aspect-square rounded-[10px] overflow-hidden bg-line-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/photos/${p.id}`} alt="" className="w-full h-full object-cover" />
                    </a>
                    <form action={deletePhoto} className="absolute top-1.5 right-1.5">
                      <input type="hidden" name="request_id" value={r.id} />
                      <input type="hidden" name="photo_id" value={p.id} />
                      <button type="submit" aria-label="Remove photo" className="w-8 h-8 rounded-full bg-white/90 text-ink text-sm font-bold shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100">×</button>
                    </form>
                  </div>
                ))}
              </div>
            ) : null}
            <form action={addLandlordPhotos} className="flex flex-wrap items-center gap-2" encType="multipart/form-data">
              <input type="hidden" name="request_id" value={r.id} />
              <input name="photos" type="file" accept="image/*" multiple className="text-sm file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border file:border-field file:bg-white file:text-sm file:font-semibold" />
              <Button type="submit" variant="secondary">Add photos</Button>
            </form>
          </Card>

          <Card>
            <div className="px-6 pt-5 pb-2 flex items-baseline justify-between gap-3">
              <h2 className="font-display font-semibold text-xl">Updates</h2>
              <span className="text-[13px] text-muted">Tenant sees everything except private notes</span>
            </div>
            <ul>
              {notes.map((n) => (
                <li key={n.id} className="px-6 py-3.5 border-t border-line-2 flex flex-col gap-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold">
                      {n.author_role === "system" ? "TenantSpark" : n.author_name}
                      {n.author_role === "tenant" ? <span className="text-muted font-normal"> (tenant)</span> : null}
                      {!n.visible_to_tenant ? <Pill tone="gray">Private</Pill> : null}
                    </span>
                    <span className="text-[12px] text-muted">{when(n.created_at)}</span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-ink-2 whitespace-pre-line">{n.body}</p>
                </li>
              ))}
            </ul>
            <form action={addLandlordNote} className="px-6 py-5 border-t border-line flex flex-col gap-3">
              <input type="hidden" name="request_id" value={r.id} />
              <Textarea label="Add an update" name="body" rows={2} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="private" value="yes" className="w-4.5 h-4.5 accent-navy" />
                  Private note, tenant can&apos;t see it
                </label>
                <Button type="submit" variant="secondary">Post update</Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="flex-[2_1_300px] min-w-0 flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-4">
            <h2 className="font-display font-semibold text-xl">Next step</h2>

            {r.status === "new" || r.status === "scheduled" ? (
              <form action={updateStatus} className="flex flex-col gap-3">
                <input type="hidden" name="request_id" value={r.id} />
                <input type="hidden" name="status" value="scheduled" />
                <Field label={r.status === "scheduled" ? "Move the date" : "Schedule it"} name="scheduled_for" type="date" required defaultValue={r.scheduled_for ?? today} />
                <Field label="Who's going" name="assigned_to" defaultValue={r.assigned_to} placeholder="Me, or a vendor's name" />
                <Button type="submit" variant={r.status === "new" ? "primary" : "secondary"}>{r.status === "scheduled" ? "Update schedule" : "Schedule"}</Button>
              </form>
            ) : null}

            {r.status === "scheduled" || r.status === "new" ? (
              <form action={updateStatus}>
                <input type="hidden" name="request_id" value={r.id} />
                <input type="hidden" name="status" value="in_progress" />
                <Button type="submit" variant={r.status === "scheduled" ? "primary" : "secondary"} className="w-full">Work has started</Button>
              </form>
            ) : null}

            {isOpen ? (
              <form action={updateStatus} className="flex flex-col gap-3 pt-3 border-t border-line-2">
                <input type="hidden" name="request_id" value={r.id} />
                <input type="hidden" name="status" value="done" />
                <Field label="What it cost" name="cost" type="number" step="0.01" min="0" placeholder="0.00" defaultValue={r.cost_cents != null ? (r.cost_cents / 100).toFixed(2) : null} />
                <Textarea label="Note for the tenant" name="summary" rows={2} placeholder="Replaced the cartridge, leak is fixed." />
                <Button type="submit" variant={r.status === "in_progress" ? "primary" : "secondary"}>Mark done</Button>
              </form>
            ) : (
              <form action={updateStatus} className="flex flex-col gap-3">
                <input type="hidden" name="request_id" value={r.id} />
                <input type="hidden" name="status" value="new" />
                <p className="text-[15px] text-muted">This request is {r.status === "done" ? "done" : "closed"}. If the problem came back, reopen it.</p>
                <Button type="submit" variant="secondary">Reopen</Button>
              </form>
            )}

            {isOpen ? (
              <form action={updateStatus} className="pt-3 border-t border-line-2">
                <input type="hidden" name="request_id" value={r.id} />
                <input type="hidden" name="status" value="closed" />
                <input type="hidden" name="summary" value="Closed without work needed." />
                <button type="submit" className="text-sm font-semibold text-muted hover:text-ink min-h-9">Close without doing work</button>
              </form>
            ) : null}
          </Card>

          <Card className="p-6 flex flex-col gap-4">
            <h2 className="text-[15px] font-semibold text-muted">Details</h2>
            <form action={updateDetails} className="flex flex-col gap-3">
              <input type="hidden" name="request_id" value={r.id} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="f-urgency" className="text-sm font-semibold">Urgency</label>
                <select id="f-urgency" name="urgency" defaultValue={r.urgency} className="box-border w-full min-h-12 px-3 rounded-[10px] border border-field-strong bg-white text-base">
                  {Object.entries(URGENCY).map(([v, u]) => <option key={v} value={v}>{u.label}</option>)}
                </select>
              </div>
              <Field label="Handled by" name="assigned_to" defaultValue={r.assigned_to} />
              <Field label="Cost" name="cost" type="number" step="0.01" min="0" defaultValue={r.cost_cents != null ? (r.cost_cents / 100).toFixed(2) : null} />
              <Button type="submit" variant="secondary">Save</Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
