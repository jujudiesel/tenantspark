import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data";

export type TenantLease = {
  id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  rent_cents: number;
  deposit_cents: number;
  rent_due_day: number;
  units: {
    id: string;
    label: string;
    properties: { id: string; name: string; address_line1: string; address_line2: string | null; city: string; state: string; zip: string };
  };
};

/** The signed-in user's tenant records and leases. Landlords get sent to their dashboard. */
export async function requireTenant() {
  const { supabase, user } = await requireUser();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, full_name, email, phone, account_id, accounts(name), lease_tenants(leases(id, status, start_date, end_date, rent_cents, deposit_cents, rent_due_day, units(id, label, properties(id, name, address_line1, address_line2, city, state, zip))))")
    .eq("user_id", user.id);

  if (!tenants || tenants.length === 0) {
    const { data: membership } = await supabase.from("account_members").select("account_id").eq("user_id", user.id).limit(1).maybeSingle();
    if (membership) redirect("/dashboard");
    return { supabase, user, tenant: null, leases: [] as TenantLease[], landlord: null as string | null };
  }

  const tenant = tenants[0];
  const leases = tenants
    .flatMap((t) => ((t.lease_tenants as unknown as { leases: TenantLease }[]) ?? []).map((lt) => lt.leases))
    .filter(Boolean)
    .sort((a, b) => (a.status === "active" ? -1 : 1) - (b.status === "active" ? -1 : 1) || (a.start_date < b.start_date ? 1 : -1));
  const landlord = (tenant.accounts as unknown as { name: string } | null)?.name ?? null;

  return { supabase, user, tenant, leases, landlord };
}

export function nextDueDate(dueDay: number, from = new Date()) {
  const y = from.getFullYear();
  const m = from.getMonth();
  const thisMonth = new Date(y, m, dueDay);
  if (thisMonth >= new Date(y, m, from.getDate())) return thisMonth;
  return new Date(y, m + 1, dueDay);
}
