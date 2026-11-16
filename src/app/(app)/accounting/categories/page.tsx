import { requireAccount } from "@/lib/data";
import { Button, Card, Field, Notice, PageHeader, Pill } from "@/components/ui";
import { addCategory, toggleCategory } from "../actions";

export const metadata = { title: "Categories" };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { supabase, account } = await requireAccount();
  await supabase.rpc("ensure_my_categories", { p_account: account.id });
  const { data: categories } = await supabase.from("categories").select("id, kind, name, is_system, archived").eq("account_id", account.id).order("sort").order("name");

  const list = (kind: "income" | "expense") => (
    <Card>
      <div className="px-6 pt-5 pb-2"><h2 className="font-display font-semibold text-xl">{kind === "income" ? "Income" : "Expense"} categories</h2></div>
      <ul>
        {(categories ?? []).filter((c) => c.kind === kind).map((c) => (
          <li key={c.id} className={`px-6 py-3 border-t border-line-2 flex items-center justify-between gap-3 ${c.archived ? "opacity-60" : ""}`}>
            <span className="text-[15px] font-medium">{c.name} {c.is_system ? <Pill tone="gray">Automatic</Pill> : null}</span>
            {c.is_system ? null : (
              <form action={toggleCategory}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="archived" value={c.archived ? "no" : "yes"} />
                <button type="submit" className="text-sm font-semibold text-muted hover:text-ink min-h-9">{c.archived ? "Restore" : "Hide"}</button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <form action={addCategory} className="px-6 py-4 border-t border-line flex flex-wrap items-end gap-3">
        <input type="hidden" name="kind" value={kind} />
        <div className="flex-1 min-w-[200px]"><Field label="New category" name="name" placeholder={kind === "income" ? "Pet rent" : "Snow removal"} /></div>
        <Button type="submit" variant="secondary">Add</Button>
      </form>
    </Card>
  );

  return (
    <>
      <PageHeader title="Categories" subtitle="The lines on your profit and loss. These match the IRS Schedule E out of the box." actions={<Button href="/accounting" variant="secondary">Back to accounting</Button>} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {list("expense")}
        {list("income")}
      </div>
    </>
  );
}
