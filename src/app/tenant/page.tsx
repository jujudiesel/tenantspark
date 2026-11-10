import Link from "next/link";
import { BoltBadge, Wordmark } from "@/components/logo";
import { requireUser } from "@/lib/data";
import { logOut } from "@/app/(auth)/actions";

export const metadata = { title: "Tenant portal" };

// Landing spot for a signed-in user who isn't a landlord. The full tenant portal ships with rent collection.
export default async function TenantHome() {
  const { user } = await requireUser();
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-6 gap-6">
      <Link href="/" className="inline-flex items-center gap-2.5">
        <BoltBadge size={36} />
        <Wordmark size={24} />
      </Link>
      <div className="w-full max-w-[440px] bg-white border border-line rounded-[14px] p-7 flex flex-col gap-4">
        <h1 className="font-display font-semibold text-2xl">You&apos;re signed in</h1>
        <p className="text-[15px] leading-relaxed text-ink-2">
          {user.email} isn&apos;t set up as a landlord account. If you&apos;re a tenant, the tenant portal opens soon and your landlord will send you an invite.
        </p>
        <form action={logOut}>
          <button type="submit" className="min-h-11 px-4.5 rounded-lg border border-field text-sm font-semibold">Log out</button>
        </form>
      </div>
    </div>
  );
}
