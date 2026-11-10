import Link from "next/link";
import { BoltBadge, Wordmark } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap min-h-screen bg-white">
      <aside className="flex-[1_1_380px] min-w-0 bg-navy px-8 py-10 sm:px-12 flex flex-col gap-14">
        <Link href="/" aria-label="TenantSpark home" className="inline-flex items-center gap-2.5 min-h-11 self-start">
          <BoltBadge size={36} />
          <Wordmark size={24} onDark />
        </Link>
        <div className="flex flex-col gap-7">
          <h2 className="font-display font-semibold text-[40px] leading-[1.08] text-white max-w-[420px]">
            Set up your first property in a few minutes
          </h2>
          <ul className="flex flex-col gap-4 text-base leading-snug text-[#DCE2EE]">
            {[
              "Free while we're in early access, no card needed",
              "Works for one unit or fifty",
              "Rent goes straight to your bank account",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#1492FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px] flex-none">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="flex-[1.4_1_480px] min-w-0 px-6 py-14 sm:px-8 flex items-center justify-center">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
