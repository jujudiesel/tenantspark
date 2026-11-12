import { requireTenant } from "@/lib/tenant";
import { TenantNav } from "@/components/tenant-nav";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const { tenant, landlord } = await requireTenant();
  return (
    <div className="min-h-screen bg-page flex flex-col">
      <TenantNav name={tenant?.full_name ?? null} landlord={landlord} />
      <main className="flex-1 w-full max-w-[720px] mx-auto px-5 py-6 sm:px-8 sm:py-8 pb-28 sm:pb-12 flex flex-col gap-5">{children}</main>
    </div>
  );
}
