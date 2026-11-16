import { requireAccount } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { EntryForm } from "@/components/entry-form";
import { createEntry } from "../actions";

export const metadata = { title: "Add entry" };

export default async function NewEntryPage({ searchParams }: { searchParams: Promise<{ kind?: string; error?: string }> }) {
  const sp = await searchParams;
  const kind = sp.kind === "income" ? "income" : "expense";
  const { supabase, account } = await requireAccount();
  await supabase.rpc("ensure_my_categories", { p_account: account.id });
  const [{ data: properties }, { data: units }, { data: categories }] = await Promise.all([
    supabase.from("properties").select("id, name").eq("account_id", account.id).order("name"),
    supabase.from("units").select("id, label, property_id").eq("account_id", account.id),
    supabase.from("categories").select("id, kind, name, archived").eq("account_id", account.id).order("sort"),
  ]);
  return (
    <>
      <PageHeader title={kind === "income" ? "Add income" : "Add expense"} subtitle={kind === "income" ? "Money that came in outside of rent: laundry, parking, fees." : "Anything you paid for a property."} />
      <EntryForm action={createEntry} kind={kind} properties={properties ?? []} units={units ?? []} categories={categories ?? []} error={sp.error} cancelHref="/accounting" />
    </>
  );
}
