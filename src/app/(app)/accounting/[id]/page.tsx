import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/data";
import { Button, PageHeader } from "@/components/ui";
import { EntryForm } from "@/components/entry-form";
import { deleteEntry, updateEntry } from "../actions";

export default async function EditEntryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, account } = await requireAccount();
  const [{ data: entry }, { data: properties }, { data: units }, { data: categories }] = await Promise.all([
    supabase.from("ledger_entries").select("*").eq("id", id).eq("account_id", account.id).maybeSingle(),
    supabase.from("properties").select("id, name").eq("account_id", account.id).order("name"),
    supabase.from("units").select("id, label, property_id").eq("account_id", account.id),
    supabase.from("categories").select("id, kind, name, archived").eq("account_id", account.id).order("sort"),
  ]);
  if (!entry) notFound();
  return (
    <>
      <PageHeader
        title={entry.kind === "income" ? "Edit income" : "Edit expense"}
        actions={
          entry.maintenance_request_id ? (
            <Button href={`/maintenance/${entry.maintenance_request_id}`} variant="secondary">Open the repair</Button>
          ) : (
            <form action={deleteEntry}>
              <input type="hidden" name="id" value={entry.id} />
              <Button type="submit" variant="danger">Delete</Button>
            </form>
          )
        }
      />
      <EntryForm action={updateEntry} kind={entry.kind} properties={properties ?? []} units={units ?? []} categories={categories ?? []} entry={entry} error={error} cancelHref="/accounting" />
    </>
  );
}
