import { Notice } from "@/components/ui";

export const metadata = { title: "Check your email" };

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display font-semibold text-[34px] leading-[1.1]">Check your email</h1>
      <p className="text-base leading-normal text-ink-2">
        We sent a confirmation link to <strong className="font-semibold text-ink">{email}</strong>. Click it to finish
        creating your account.
      </p>
      <Notice>Didn&apos;t get it? Check your spam folder. The link is good for 24 hours.</Notice>
    </div>
  );
}
