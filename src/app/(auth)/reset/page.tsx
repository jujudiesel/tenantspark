import { Button, Field, Notice } from "@/components/ui";
import { setNewPassword } from "../actions";

export const metadata = { title: "Choose a new password" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <form action={setNewPassword} className="flex flex-col gap-5">
      <h1 className="font-display font-semibold text-[34px] leading-[1.1]">Choose a new password</h1>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field label="New password" name="password" type="password" required autoComplete="new-password" hint="At least 8 characters" />
      <Button type="submit" className="min-h-[52px] text-base">
        Save password
      </Button>
    </form>
  );
}
