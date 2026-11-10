import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { TenantForm } from "@/components/tenant-form";
import { updateTenant } from "../../actions";

export const metadata = { title: "Edit tenant" };

export default async function EditTenantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, account } = await requireAccount();
  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", id).eq("account_id", account.id).maybeSingle();
  if (!tenant) notFound();
  return (
    <>
      <PageHeader title="Edit tenant" subtitle={tenant.full_name} />
      <TenantForm action={updateTenant} tenant={tenant} error={error} submitLabel="Save changes" />
    </>
  );
}
