import Link from "next/link";
import { requireAccount } from "@/lib/data";
import { Button, Field, Notice, PageHeader, Select, Textarea } from "@/components/ui";
import { LOCATIONS } from "@/lib/maintenance";
import { createRequest } from "../actions";

export const metadata = { title: "Log a request" };

export default async function NewMaintenancePage({ searchParams }: { searchParams: Promise<{ error?: string; unit?: string }> }) {
  const { error, unit: unitParam } = await searchParams;
  const { supabase, account } = await requireAccount();
  const { data: units } = await supabase
    .from("units")
    .select("id, label, properties(name), leases(status, lease_tenants(tenants(full_name)))")
    .eq("account_id", account.id);

  type U = { id: string; label: string; properties: { name: string }; leases: { status: string; lease_tenants: { tenants: { full_name: string } }[] }[] };
  const rows = ((units as unknown as U[]) ?? []).sort((a, b) =>
    `${a.properties.name} ${a.label}`.localeCompare(`${b.properties.name} ${b.label}`, undefined, { numeric: true }),
  );

  if (rows.length === 0) {
    return (
      <>
        <PageHeader title="Log a request" />
        <Notice>
          Add a property with units first. <Link href="/properties/new" className="font-semibold text-link">Add a property</Link>.
        </Notice>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Log a request" subtitle="For something a tenant told you about, or something you found yourself." />
      <form action={createRequest} className="flex flex-col gap-5 max-w-[640px]" encType="multipart/form-data">
        {error ? <Notice tone="error">{error}</Notice> : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-unit_id" className="text-sm font-semibold">Unit</label>
          <select id="f-unit_id" name="unit_id" required defaultValue={unitParam ?? ""} className="box-border w-full min-h-12 px-3 rounded-[10px] border border-field-strong bg-white text-base">
            <option value="" disabled>Choose a unit</option>
            {rows.map((u) => {
              const active = u.leases?.find((l) => l.status === "active");
              const who = active?.lease_tenants?.map((lt) => lt.tenants?.full_name).filter(Boolean).join(", ");
              return (
                <option key={u.id} value={u.id}>
                  {u.properties.name}, {u.label}{who ? ` (${who})` : " (vacant)"}
                </option>
              );
            })}
          </select>
          <span className="text-[13px] text-muted">If the unit has a tenant, they&apos;ll see this request and its updates in their portal.</span>
        </div>

        <Field label="What's wrong?" name="title" required placeholder="Water heater not heating" />
        <Select label="Where is it?" name="location" options={LOCATIONS.map((l) => ({ value: l, label: l }))} />
        <Textarea label="Details" name="description" rows={3} />

        <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
          <legend className="text-sm font-semibold mb-2">How urgent?</legend>
          {[["routine", "Routine"], ["urgent", "Urgent"], ["emergency", "Emergency"]].map(([v, l], i) => (
            <label key={v} className="flex items-center gap-3 min-h-11 text-[15px]">
              <input type="radio" name="urgency" value={v} defaultChecked={i === 0} className="w-5 h-5 accent-navy" />
              {l}
            </label>
          ))}
        </fieldset>

        <Field label="Who's handling it" name="assigned_to" placeholder="Me, or a vendor's name" />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-photos" className="text-sm font-semibold">Photos <span className="text-muted font-normal">(optional)</span></label>
          <input id="f-photos" name="photos" type="file" accept="image/*" multiple className="box-border w-full min-h-12 px-3 py-2.5 rounded-[10px] border border-field-strong bg-white text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-navy file:text-white file:text-sm file:font-semibold" />
        </div>

        <label className="flex items-center gap-3 min-h-11 text-[15px]">
          <input type="checkbox" name="permission_to_enter" value="yes" className="w-5 h-5 accent-navy" />
          Tenant said it&apos;s okay to enter when they&apos;re not home
        </label>

        <div className="flex gap-3 pt-2">
          <Button type="submit">Save request</Button>
          <Button href="/maintenance" variant="secondary">Cancel</Button>
        </div>
      </form>
    </>
  );
}
