import { Button, Field, Notice, Textarea } from "@/components/ui";

type Unit = { id: string; label: string; property_id: string };
type Property = { id: string; name: string };
type Category = { id: string; kind: string; name: string; archived: boolean };

export function EntryForm({
  action,
  kind,
  properties,
  units,
  categories,
  entry,
  error,
  cancelHref,
}: {
  action: (formData: FormData) => Promise<void>;
  kind: "income" | "expense";
  properties: Property[];
  units: Unit[];
  categories: Category[];
  entry?: { id: string; amount_cents: number; entry_date: string; property_id: string | null; unit_id: string | null; category_id: string | null; vendor: string | null; memo: string | null; receipt_path: string | null; maintenance_request_id: string | null };
  error?: string;
  cancelHref: string;
}) {
  const cats = categories.filter((c) => c.kind === kind && (!c.archived || c.id === entry?.category_id));
  const fromRepair = Boolean(entry?.maintenance_request_id);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="flex flex-col gap-5 max-w-[640px]" encType="multipart/form-data">
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      <input type="hidden" name="kind" value={kind} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      {fromRepair ? <Notice>This expense comes from a repair request. The amount and vendor follow the repair; you can still change the category, date and memo.</Notice> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Amount" name="amount" type="number" step="0.01" min="0.01" required inputMode="decimal" defaultValue={entry ? (entry.amount_cents / 100).toFixed(2) : null} placeholder="0.00" />
        <Field label="Date" name="entry_date" type="date" required defaultValue={entry?.entry_date ?? today} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="f-category_id" className="text-sm font-semibold">Category</label>
        <select id="f-category_id" name="category_id" defaultValue={entry?.category_id ?? ""} className="box-border w-full min-h-12 px-3 rounded-[10px] border border-field-strong bg-white text-base">
          <option value="">Choose one</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-property_id" className="text-sm font-semibold">Property <span className="text-muted font-normal">(optional)</span></label>
          <select id="f-property_id" name="property_id" defaultValue={entry?.property_id ?? ""} className="box-border w-full min-h-12 px-3 rounded-[10px] border border-field-strong bg-white text-base">
            <option value="">Whole portfolio</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-unit_id" className="text-sm font-semibold">Unit <span className="text-muted font-normal">(optional)</span></label>
          <select id="f-unit_id" name="unit_id" defaultValue={entry?.unit_id ?? ""} className="box-border w-full min-h-12 px-3 rounded-[10px] border border-field-strong bg-white text-base">
            <option value="">Not unit-specific</option>
            {units.map((u) => <option key={u.id} value={u.id}>{properties.find((p) => p.id === u.property_id)?.name}, {u.label}</option>)}
          </select>
        </div>
      </div>

      <Field label={kind === "expense" ? "Paid to" : "Received from"} name="vendor" defaultValue={entry?.vendor} placeholder={kind === "expense" ? "Home Depot, Joe's Plumbing, DTE" : "Who paid you"} />
      <Textarea label="Memo" name="memo" rows={2} defaultValue={entry?.memo} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="f-receipt" className="text-sm font-semibold">Receipt <span className="text-muted font-normal">(optional, photo or PDF)</span></label>
        <input id="f-receipt" name="receipt" type="file" accept="image/*,application/pdf" className="box-border w-full min-h-12 px-3 py-2.5 rounded-[10px] border border-field-strong bg-white text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-navy file:text-white file:text-sm file:font-semibold" />
        {entry?.receipt_path ? <a href={`/receipts/${entry.id}`} target="_blank" rel="noopener" className="text-[13px] font-semibold text-link">View current receipt</a> : null}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit">{entry ? "Save changes" : kind === "expense" ? "Save expense" : "Save income"}</Button>
        <Button href={cancelHref} variant="secondary">Cancel</Button>
      </div>
    </form>
  );
}
