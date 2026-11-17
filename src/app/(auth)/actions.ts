"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { str } from "@/lib/data";
import { siteUrl } from "@/lib/site";
import { adminClient } from "@/lib/supabase/admin";
import { button, emailConfigured, para, sendEmail, wrapHtml } from "@/lib/notify";

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
  const base = await siteUrl();

  // Preferred: a link that works from any device or browser, sent through our own mail.
  // Supabase's own reset email only works in the browser that asked for it, which confuses people on phones.
  if (process.env.SUPABASE_SECRET_KEY && emailConfigured()) {
    const { data } = await adminClient().auth.admin.generateLink({ type: "recovery", email });
    const token = data?.properties?.hashed_token;
    if (token) {
      const link = `${base}/auth/callback?token_hash=${encodeURIComponent(token)}&type=recovery&next=/reset`;
      const subject = "Reset your TenantSpark password";
      await sendEmail(email, {
        subject,
        text: `Someone asked to reset the password for this TenantSpark login. If that was you, open this link to pick a new one:\n\n${link}\n\nThe link works once and expires in an hour. If you didn't ask for this, you can ignore it.`,
        html: wrapHtml(subject, para("Someone asked to reset the password for this TenantSpark login. If that was you, pick a new one here:") + button(link, "Set a new password") + para("The link works once and expires in an hour. If you didn't ask for this, you can ignore it."), "TenantSpark"),
      });
    }
    // Same message whether or not the email exists, so nobody can probe for accounts.
    redirect(`/forgot?sent=1`);
  }

  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${base}/auth/callback?next=/reset` });
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
