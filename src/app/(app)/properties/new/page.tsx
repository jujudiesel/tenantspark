import { PageHeader } from "@/components/ui";
import { PropertyForm } from "@/components/property-form";
import { createProperty } from "../actions";

export const metadata = { title: "Add a property" };

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <>
      <PageHeader title="Add a property" subtitle="One address. You can add units after." />
      <PropertyForm action={createProperty} error={error} submitLabel="Save property" />
    </>
  );
}
