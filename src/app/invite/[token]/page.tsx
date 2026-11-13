import Link from "next/link";
import { BoltBadge, Wordmark } from "@/components/logo";
import { Button, Field, Notice } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/data";
import { acceptInvite, tenantSignUp } from "./actions";

export const metadata = { title: "Set up your tenant portal" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const valid = UUID.test(token);
  type Preview = { full_name: string; email: string | null; landlord: string };
  const { data: preview } = valid
    ? ((await supabase.rpc("invite_preview", { token }).maybeSingle()) as { data: Preview | null })
    : { data: null as Preview | null };
  const { user } = await getSessionUser();

  return (
    <div className="min-h-screen bg-page flex flex-col items-center p-6 gap-8">
      <Link href="/" className="inline-flex items-center gap-2.5 mt-6">
        <BoltBadge size={36} />
        <Wordmark size={24} />
      </Link>

      <div className="w-full max-w-[440px] bg-white border border-line rounded-[14px] p-7 flex flex-col gap-5">
        {!preview ? (
          <>
            <h1 className="font-display font-semibold text-2xl">This invite link isn&apos;t active</h1>
            <p className="text-[15px] leading-relaxed text-ink-2">
              It may have been used already, or your landlord may have sent a new one. If you already made your login,{" "}
              <Link href="/login" className="font-semibold text-link">log in here</Link>. Otherwise ask your landlord for a fresh link.
            </p>
          </>
        ) : user ? (
          <form action={acceptInvite} className="flex flex-col gap-4">
            <input type="hidden" name="token" value={token} />
            <h1 className="font-display font-semibold text-2xl">Connect this login to your lease</h1>
            <p className="text-[15px] leading-relaxed text-ink-2">
              You&apos;re signed in as <strong className="font-semibold text-ink">{user.email}</strong>. {preview.landlord} set up this portal for{" "}
              <strong className="font-semibold text-ink">{preview.full_name}</strong>.
            </p>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <Button type="submit" className="min-h-[52px] text-base">Yes, that&apos;s me</Button>
          </form>
        ) : (
          <form action={tenantSignUp} className="flex flex-col gap-4">
            <input type="hidden" name="token" value={token} />
            <div className="flex flex-col gap-1.5">
              <h1 className="font-display font-semibold text-2xl">Hi {preview.full_name.split(" ")[0]}</h1>
              <p className="text-[15px] leading-relaxed text-ink-2">
                {preview.landlord} set up a tenant portal for you. Create a login to see your lease, what&apos;s due, and send repair requests.
              </p>
            </div>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <Field label="Email" name="email" type="email" required defaultValue={preview.email} autoComplete="email" />
            <Field label="Choose a password" name="password" type="password" required autoComplete="new-password" hint="At least 8 characters" />
            <Button type="submit" className="min-h-[52px] text-base">Create my login</Button>
            <p className="text-[13px] text-muted">
              Already have a TenantSpark login? <Link href={`/login?next=/invite/${token}`} className="font-semibold text-link">Log in</Link> and we&apos;ll connect it.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
