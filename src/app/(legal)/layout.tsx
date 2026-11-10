import Link from "next/link";
import { BoltBadge, Wordmark } from "@/components/logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-[760px] mx-auto px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5 min-h-11">
          <BoltBadge size={32} />
          <Wordmark size={21} />
        </Link>
      </header>
      <main className="max-w-[760px] mx-auto px-6 pb-20 flex flex-col gap-5 text-[16px] leading-relaxed text-ink-2 [&_h1]:font-display [&_h1]:font-semibold [&_h1]:text-[36px] [&_h1]:leading-tight [&_h1]:text-ink [&_h2]:font-semibold [&_h2]:text-xl [&_h2]:text-ink [&_h2]:mt-4">
        {children}
      </main>
    </div>
  );
}
