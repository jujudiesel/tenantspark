import Link from "next/link";
import { Button, Field, Notice, Select } from "@/components/ui";
import { signUp } from "../actions";

export const metadata = { title: "Create your account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <form action={signUp} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display font-semibold text-[34px] leading-[1.1]">Create your account</h1>
        <p className="text-[15px] text-muted">
          Already have one?{" "}
          <Link href="/login" className="font-semibold text-link hover:text-link-dark">
            Log in
          </Link>
        </p>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field label="Your name" name="full_name" required autoComplete="name" />
      <Field label="Business name" name="company_name" placeholder="Hale Rentals" autoComplete="organization" hint="Shown to your tenants. You can change it later." />
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Field label="Password" name="password" type="password" required autoComplete="new-password" hint="At least 8 characters" />
      <Select
        label="How many units do you manage?"
        name="unit_count"
        options={[
          { value: "1-5", label: "1 to 5" },
          { value: "6-20", label: "6 to 20" },
          { value: "21-50", label: "21 to 50" },
          { value: "50+", label: "More than 50" },
        ]}
      />
      <Button type="submit" className="min-h-[52px] text-base">
        Create account
      </Button>
      <p className="text-[13px] leading-normal text-muted">
        By creating an account you agree to the <Link href="/terms" className="text-link">Terms</Link> and{" "}
        <Link href="/privacy" className="text-link">Privacy Policy</Link>.
      </p>
      <Notice>
        <strong className="font-semibold text-ink">Are you a tenant?</strong> You don&apos;t sign up here. Your landlord sends you an invite link.
      </Notice>
    </form>
  );
}
