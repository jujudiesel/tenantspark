import { PageHeader } from "@/components/ui";
import { TenantForm } from "@/components/tenant-form";
import { createTenant } from "../actions";

export const metadata = { title: "Add a tenant" };

export default async function NewTenantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; unit?: string }>;
}) {
  const { error, unit } = await searchParams;
  return (
    <>
      <PageHeader title="Add a tenant" subtitle={unit ? "Next you'll set up their lease." : "You can put them on a lease after."} />
      <TenantForm action={createTenant} error={error} submitLabel={unit ? "Save and set up lease" : "Save tenant"} unitId={unit} />
    </>
  );
}
