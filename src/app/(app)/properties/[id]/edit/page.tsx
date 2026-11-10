import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { PropertyForm } from "@/components/property-form";
import { updateProperty } from "../../actions";

export const metadata = { title: "Edit property" };

export default async function EditPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, account } = await requireAccount();
  const { data: property } = await supabase.from("properties").select("*").eq("id", id).eq("account_id", account.id).maybeSingle();
  if (!property) notFound();

  return (
    <>
      <PageHeader title="Edit property" subtitle={property.name} />
      <PropertyForm action={updateProperty} property={property} error={error} submitLabel="Save changes" />
    </>
  );
}
