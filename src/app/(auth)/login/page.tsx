import Link from "next/link";
import { Button, Field, Notice } from "@/components/ui";
import { logIn } from "../actions";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; confirmed?: string }>;
}) {
  const { error, next, confirmed } = await searchParams;
  return (
    <form action={logIn} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display font-semibold text-[34px] leading-[1.1]">Log in</h1>
        <p className="text-[15px] text-muted">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-link hover:text-link-dark">
            Create an account
          </Link>
        </p>
      </div>
      {confirmed ? <Notice tone="success">Your email is confirmed. Log in to continue.</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Field label="Password" name="password" type="password" required autoComplete="current-password" />
      <Button type="submit" className="min-h-[52px] text-base">
        Log in
      </Button>
      <p className="text-sm">
        <Link href="/forgot" className="font-semibold text-link hover:text-link-dark">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
