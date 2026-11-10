import { requireAccount } from "@/lib/data";
import { Button, Field, Notice, PageHeader, Textarea } from "@/components/ui";
import { createLease } from "../actions";

export const metadata = { title: "New lease" };

export default async function NewLeasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; unit?: string; tenant?: string }>;
}) {
  const { error, unit: unitParam, tenant: tenantParam } = await searchParams;
  const { supabase, account } = await requireAccount();

  const [{ data: units }, { data: tenants }] = await Promise.all([
    supabase
      .from("units")
      .select("id, label, market_rent_cents, properties(name), leases(status)")
      .eq("account_id", account.id),
    supabase.from("tenants").select("id, full_name, email").eq("account_id", account.id).order("full_name"),
  ]);

  type U = { id: string; label: string; market_rent_cents: number | null; properties: { name: string }; leases: { status: string }[] };
  const unitRows = ((units as unknown as U[]) ?? []).sort((a, b) =>
    `${a.properties.name} ${a.label}`.localeCompare(`${b.properties.name} ${b.label}`, undefined, { numeric: true }),
  );
  const chosenUnit = unitRows.find((u) => u.id === unitParam);
  const chosenHasActive = chosenUnit?.leases?.some((l) => l.status === "active") ?? false;
  const today = new Date().toISOString().slice(0, 10);

  if (unitRows.length === 0 || (tenants?.length ?? 0) === 0) {
    return (
      <>
        <PageHeader title="New lease" />
        <Notice>
          You need at least one unit and one tenant before you can set up a lease.{" "}
          {unitRows.length === 0 ? <a href="/properties/new" className="font-semibold text-link">Add a property</a> : null}
          {unitRows.length === 0 && (tenants?.length ?? 0) === 0 ? " and " : null}
          {(tenants?.length ?? 0) === 0 ? <a href="/tenants/new" className="font-semibold text-link">add a tenant</a> : null}.
        </Notice>
      </>
    );
  }

  return (
    <>
      <PageHeader title="New lease" subtitle="Who lives where, for how much, and for how long." />
      <form action={createLease} className="flex flex-col gap-5 max-w-[640px]">
        {error ? <Notice tone="error">{error}</Notice> : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-unit_id" className="text-sm font-semibold">Unit</label>
          <select
            id="f-unit_id"
            name="unit_id"
            required
            defaultValue={unitParam ?? ""}
            className="box-border w-full min-h-12 px-3 rounded-[10px] border border-field-strong bg-white text-base"
          >
            <option value="" disabled>Choose a unit</option>
            {unitRows.map((u) => {
              const rented = u.leases?.some((l) => l.status === "active");
              return (
                <option key={u.id} value={u.id}>
                  {u.properties.name}, {u.label}{rented ? " (currently rented)" : ""}
                </option>
              );
            })}
          </select>
        </div>

        {chosenHasActive ? (
          <label className="flex items-start gap-3 p-4 rounded-[10px] bg-amber-bg text-sm text-amber-ink">
            <input type="checkbox" name="replace_active" value="yes" className="mt-0.5 w-5 h-5 accent-navy" />
            <span>This unit already has an active lease. Check this to end that lease today and replace it with the new one.</span>
          </label>
        ) : null}

        <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
          <legend className="text-sm font-semibold mb-2">Tenants on this lease</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tenants!.map((t) => (
              <label key={t.id} className="flex items-center gap-3 min-h-12 px-3.5 rounded-[10px] border border-field bg-white text-[15px] has-[:checked]:border-navy">
                <input type="checkbox" name="tenant_ids" value={t.id} defaultChecked={t.id === tenantParam} className="w-5 h-5 accent-navy" />
                <span className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{t.full_name}</span>
                  {t.email ? <span className="text-[13px] text-muted truncate">{t.email}</span> : null}
                </span>
              </label>
            ))}
          </div>
          <a href={`/tenants/new${unitParam ? `?unit=${unitParam}` : ""}`} className="text-sm font-semibold text-link self-start mt-1">Add a new tenant</a>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Start date" name="start_date" type="date" required defaultValue={today} />
          <Field label="End date" name="end_date" type="date" hint="Leave blank for month to month." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Monthly rent" name="rent" required inputMode="decimal" defaultValue={chosenUnit?.market_rent_cents != null ? (chosenUnit.market_rent_cents / 100).toString() : undefined} placeholder="1,400" />
          <Field label="Security deposit" name="deposit" inputMode="decimal" placeholder="1,400" />
          <Field label="Rent due on day" name="rent_due_day" inputMode="numeric" defaultValue={1} min="1" hint="1 to 28" />
        </div>
        <Textarea label="Notes" name="notes" />

        <div className="flex flex-wrap gap-2.5">
          <Button type="submit">Save lease</Button>
          <Button href="/leases" variant="secondary">Cancel</Button>
        </div>
      </form>
    </>
  );
}
