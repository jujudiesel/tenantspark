import { createClient } from "@supabase/supabase-js";

/** Server-only client with the service role key. Used by webhooks and scheduled jobs that have no signed-in user. */
export function adminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
