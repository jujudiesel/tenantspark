"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { str } from "@/lib/data";
import { siteUrl } from "@/lib/site";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = str(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const fullName = str(formData.get("full_name"));
  const companyName = str(formData.get("company_name"));
  const unitCount = str(formData.get("unit_count"));

  if (!email || password.length < 8 || !fullName) {
    redirect(`/signup?error=${encodeURIComponent("Fill in your name, email, and a password of at least 8 characters.")}`);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=/dashboard`,
      data: { full_name: fullName, company_name: companyName, unit_count: unitCount, role: "landlord" },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // If email confirmation is off, Supabase returns a session and we can go straight in.
  if (data.session) redirect("/dashboard");

  redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
}

export async function logIn(formData: FormData) {
  const supabase = await createClient();
  const email = str(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = str(formData.get("next")) ?? "/dashboard";

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Enter your email and password.")}`);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent("That email and password don't match.")}&next=${encodeURIComponent(next)}`);
  }
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function sendReset(formData: FormData) {
  const supabase = await createClient();
  const email = str(formData.get("email"));
  if (!email) redirect(`/forgot?error=${encodeURIComponent("Enter your email.")}`);
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/reset`,
  });
  redirect(`/forgot?sent=1`);
}

export async function setNewPassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) redirect(`/reset?error=${encodeURIComponent("Use at least 8 characters.")}`);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/reset?error=${encodeURIComponent(error.message)}`);
  // Landlords go to the dashboard; tenants have no account membership and get sent on to the portal.
  const { data: claims } = await supabase.auth.getClaims();
  const { data: member } = claims ? await supabase.from("account_members").select("account_id").eq("user_id", claims.claims.sub).limit(1).maybeSingle() : { data: null };
  redirect(member ? "/dashboard" : "/tenant");
}
