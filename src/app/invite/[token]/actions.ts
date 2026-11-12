"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { str } from "@/lib/data";

export async function tenantSignUp(formData: FormData) {
  const supabase = await createClient();
  const token = String(formData.get("token"));
  const email = str(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const back = (msg: string) => redirect(`/invite/${token}?error=${encodeURIComponent(msg)}`);

  if (!email || password.length < 8) back("Enter your email and a password of at least 8 characters.");

  const { data: preview } = (await supabase.rpc("invite_preview", { token }).maybeSingle()) as { data: { full_name: string } | null };
  if (!preview) back("This invite link isn't active.");

  const { data, error } = await supabase.auth.signUp({
    email: email!,
    password,
    options: { data: { full_name: preview!.full_name, role: "tenant" } },
  });
  if (error) {
    if (/already registered/i.test(error.message)) back("That email already has a login. Use the Log in link below.");
    back(error.message);
  }
  if (!data.session) back("Check your email to confirm your address, then open this link again.");

  const { error: rpcError } = await supabase.rpc("accept_invite", { token });
  if (rpcError) back("Your login was created but the invite couldn't be connected. Open the link again.");

  redirect("/tenant");
}

export async function acceptInvite(formData: FormData) {
  const supabase = await createClient();
  const token = String(formData.get("token"));
  const { error } = await supabase.rpc("accept_invite", { token });
  if (error) redirect(`/invite/${token}?error=${encodeURIComponent("This invite link isn't active.")}`);
  redirect("/tenant");
}
