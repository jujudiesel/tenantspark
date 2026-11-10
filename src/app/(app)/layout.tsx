import { requireAccount } from "@/lib/data";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { account, supabase } = await requireAccount();
  const [{ count: propertyCount }, { count: unitCount }] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("account_id", account.id),
    supabase.from("units").select("id", { count: "exact", head: true }).eq("account_id", account.id),
  ]);

  return (
    <div className="flex flex-wrap min-h-screen bg-page">
      <Sidebar accountName={account.name} propertyCount={propertyCount ?? 0} unitCount={unitCount ?? 0} />
      <main className="flex-[999_1_560px] min-w-0 px-5 py-6 sm:px-10 sm:py-8 pb-12 flex flex-col gap-6">{children}</main>
    </div>
  );
}
