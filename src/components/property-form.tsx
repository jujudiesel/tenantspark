import { Button, Field, Notice, Select, Textarea } from "@/components/ui";

export type PropertyRow = {
  id?: string;
  name?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  property_type?: string | null;
  notes?: string | null;
};

export function PropertyForm({
  action,
  property,
  error,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  property?: PropertyRow;
  error?: string;
  submitLabel: string;
}) {
  const isNew = !property?.id;
  return (
    <form action={action} className="flex flex-col gap-5 max-w-[640px]">
      {property?.id ? <input type="hidden" name="id" value={property.id} /> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      <Select
        label="What kind of property is it?"
        name="property_type"
        defaultValue={property?.property_type ?? "single_family"}
        options={[
          { value: "single_family", label: "Single family house" },
          { value: "multi_family", label: "Duplex, triplex or apartment building" },
          { value: "condo", label: "Condo" },
          { value: "townhouse", label: "Townhouse" },
          { value: "commercial", label: "Commercial" },
          { value: "other", label: "Other" },
        ]}
      />

      <Field label="Street address" name="address_line1" required defaultValue={property?.address_line1} autoComplete="address-line1" />
      <Field label="Apt, suite, building" name="address_line2" defaultValue={property?.address_line2} autoComplete="address-line2" />
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_140px] gap-4">
        <Field label="City" name="city" required defaultValue={property?.city} autoComplete="address-level2" />
        <Field label="State" name="state" required defaultValue={property?.state ?? "MI"} autoComplete="address-level1" />
        <Field label="Zip" name="zip" required defaultValue={property?.zip} autoComplete="postal-code" inputMode="numeric" />
      </div>
      <Field
        label="Nickname"
        name="name"
        defaultValue={property?.name && property.name !== property.address_line1 ? property.name : undefined}
        placeholder="Cedar Court"
        hint="How it shows up in lists. Leave blank to use the street address."
      />

      {isNew ? (
        <div className="flex flex-col gap-4 p-5 rounded-[12px] bg-page">
          <p className="text-sm text-ink-2">
            For a house, condo or townhouse we&apos;ll create one unit for you. These details are optional.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Bedrooms" name="bedrooms" inputMode="decimal" step="0.5" min="0" />
            <Field label="Bathrooms" name="bathrooms" inputMode="decimal" step="0.5" min="0" />
            <Field label="Market rent" name="market_rent" inputMode="decimal" placeholder="1,400" />
          </div>
        </div>
      ) : null}

      <Textarea label="Notes" name="notes" defaultValue={property?.notes} />

      <div className="flex flex-wrap gap-2.5">
        <Button type="submit">{submitLabel}</Button>
        <Button href={property?.id ? `/properties/${property.id}` : "/properties"} variant="secondary">Cancel</Button>
      </div>
    </form>
  );
}
