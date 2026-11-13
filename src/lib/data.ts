import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string | null };

/** Who is signed in, verified from the session token without a network call. Cached per request. */
export const getSessionUser = cache(async (): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; user: SessionUser | null }> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const user = claims ? { id: claims.sub, email: (claims.email as string | undefined) ?? null } : null;
  return { supabase, user };
});

export async function requireUser() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** The landlord account the signed-in user belongs to (first one for now). Cached per request. */
export const requireAccount = cache(async () => {
  const { supabase, user } = await requireUser();
  const { data: membership } = await supabase
    .from("account_members")
    .select("account_id, role, accounts(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/tenant");

  const account = membership.accounts as unknown as { id: string; name: string };
  return { supabase, user, account, role: membership.role as string };
});

export function dollarsToCents(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).replace(/[^0-9.]/g, "");
  if (!s) return null;
  return Math.round(parseFloat(s) * 100);
}

export function str(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export function num(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
