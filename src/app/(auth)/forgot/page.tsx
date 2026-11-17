import Link from "next/link";
import { Button, Field, Notice } from "@/components/ui";
import { sendReset } from "../actions";
import { emailConfigured } from "@/lib/notify";

export const metadata = { title: "Reset your password" };

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  return (
    <form action={sendReset} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display font-semibold text-[34px] leading-[1.1]">Reset your password</h1>
        <p className="text-[15px] text-muted">We&apos;ll email you a link to set a new one.{emailConfigured() ? "" : " Open it on the same device you asked from."}</p>
      </div>
      {sent ? <Notice tone="success">If that email has an account, a reset link is on its way.</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Button type="submit" className="min-h-[52px] text-base">
        Send reset link
      </Button>
      <p className="text-sm">
        <Link href="/login" className="font-semibold text-link hover:text-link-dark">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
