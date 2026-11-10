import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/data";
import { Button, Field, Notice, PageHeader, Textarea } from "@/components/ui";
import { deleteUnit, updateUnit } from "../../../actions";

export const metadata = { title: "Edit unit" };

export default async function EditUnitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; unitId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, unitId } = await params;
  const { error } = await searchParams;
  const { supabase, account } = await requireAccount();
  const { data: unit } = await supabase
    .from("units")
    .select("*, properties(name)")
    .eq("id", unitId)
    .eq("property_id", id)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!unit) notFound();
  const propertyName = (unit.properties as unknown as { name: string } | null)?.name;

  return (
    <>
      <PageHeader title={`Edit ${unit.label}`} subtitle={propertyName} />
      <form action={updateUnit} className="flex flex-col gap-5 max-w-[640px]">
        <input type="hidden" name="id" value={unit.id} />
        <input type="hidden" name="property_id" value={id} />
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Field label="Unit name" name="label" required defaultValue={unit.label} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Bedrooms" name="bedrooms" inputMode="decimal" step="0.5" min="0" defaultValue={unit.bedrooms} />
          <Field label="Bathrooms" name="bathrooms" inputMode="decimal" step="0.5" min="0" defaultValue={unit.bathrooms} />
          <Field label="Sq ft" name="square_feet" inputMode="numeric" defaultValue={unit.square_feet} />
          <Field label="Market rent" name="market_rent" inputMode="decimal" defaultValue={unit.market_rent_cents != null ? (unit.market_rent_cents / 100).toString() : undefined} />
        </div>
        <Textarea label="Notes" name="notes" defaultValue={unit.notes} />
        <div className="flex flex-wrap gap-2.5">
          <Button type="submit">Save changes</Button>
          <Button href={`/properties/${id}`} variant="secondary">Cancel</Button>
        </div>
      </form>

      <details className="max-w-[640px]">
        <summary className="cursor-pointer text-sm text-muted select-none">Remove this unit</summary>
        <form action={deleteUnit} className="mt-3 flex flex-wrap items-center gap-3 p-4 rounded-[10px] bg-red-bg">
          <input type="hidden" name="id" value={unit.id} />
          <input type="hidden" name="property_id" value={id} />
          <p className="text-sm text-red-ink flex-1 min-w-[200px]">This deletes the unit and any leases on it. It can&apos;t be undone.</p>
          <Button type="submit" variant="danger">Delete unit</Button>
        </form>
      </details>
    </>
  );
}
