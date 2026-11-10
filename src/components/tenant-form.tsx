import { Button, Field, Notice, Textarea } from "@/components/ui";

export type TenantRow = {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

export function TenantForm({
  action,
  tenant,
  error,
  submitLabel,
  unitId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  tenant?: TenantRow;
  error?: string;
  submitLabel: string;
  unitId?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-5 max-w-[560px]">
      {tenant?.id ? <input type="hidden" name="id" value={tenant.id} /> : null}
      {unitId ? <input type="hidden" name="unit_id" value={unitId} /> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field label="Full name" name="full_name" required defaultValue={tenant?.full_name} autoComplete="off" />
      <Field label="Email" name="email" type="email" defaultValue={tenant?.email} hint="Needed to invite them to the tenant portal." autoComplete="off" />
      <Field label="Phone" name="phone" type="tel" defaultValue={tenant?.phone} inputMode="tel" autoComplete="off" />
      <Textarea label="Notes" name="notes" defaultValue={tenant?.notes} />
      <div className="flex flex-wrap gap-2.5">
        <Button type="submit">{submitLabel}</Button>
        <Button href={tenant?.id ? `/tenants/${tenant.id}` : "/tenants"} variant="secondary">Cancel</Button>
      </div>
    </form>
  );
}
