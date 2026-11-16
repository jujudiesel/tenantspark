import Link from "next/link";
import icons from "./brand-icons.json";
import { Eyebrow, Wrap } from "./sections";

// Brand marks from the simple-icons set (CC0), used to show what TenantSpark connects to.
type Icon = { hex: string; path: string };
const I = icons as Record<string, Icon>;

function Hex({ name, size = 92, muted = false }: { name: string; size?: number; muted?: boolean }) {
  const icon = I[name];
  if (!icon) return null;
  // Mailchimp's mark is yellow on white; give light marks a dark fill so they read.
  const light = ["FFE01B"].includes(icon.hex);
  return (
    <div
      className={`relative flex items-center justify-center bg-white ${muted ? "opacity-60" : ""}`}
      style={{ width: size, height: size * 1.1, clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)", filter: "drop-shadow(0 6px 16px rgba(14,23,48,0.10))" }}
      title={name}
    >
      <svg viewBox="0 0 24 24" role="img" aria-label={name} width={size * 0.4} height={size * 0.4} fill={light ? "#241C15" : `#${icon.hex}`}>
        <path d={icon.path} />
      </svg>
    </div>
  );
}

// Two clusters, left and right of the headline, like a honeycomb.
const LEFT: [string, number, number, number?][] = [
  ["Trello", 0, 0], ["Zapier", 1, 0.5], ["Asana", 0, 1, 1], ["MailChimp", 1, 1.5], ["Stripe", 0, 2, 1], ["QuickBooks", 1, 2.5],
];
const RIGHT: [string, number, number, number?][] = [
  ["Gmail", 0, 0], ["Notion", 1, 0.5, 1], ["Google Drive", 0, 1], ["Dropbox", 1, 1.5, 1], ["Google Sheets", 0, 2], ["Airtable", 1, 2.5, 1],
];

function Cluster({ items }: { items: typeof LEFT }) {
  const size = 92;
  const colW = size * 0.86;
  const rowH = size * 0.8;
  return (
    <div className="relative" style={{ width: colW * 2 + size * 0.2, height: rowH * 3 + size * 0.5 }} aria-hidden="true">
      {items.map(([name, col, row, muted]) => (
        <div key={name} className="absolute" style={{ left: col * colW, top: row * rowH }}>
          <Hex name={name} size={size} muted={Boolean(muted)} />
        </div>
      ))}
    </div>
  );
}

export function Honeycomb() {
  return (
    <section className="bg-page border-y border-line overflow-hidden">
      <Wrap className="py-20 sm:py-24 flex flex-col items-center gap-10">
        <div className="hidden lg:flex items-center justify-between w-full gap-8">
          <Cluster items={LEFT} />
          <div className="max-w-[520px] flex flex-col items-center text-center gap-5">
            <Eyebrow>One connection. All your tools.</Eyebrow>
            <h2 className="font-display font-semibold text-[40px] sm:text-[48px] leading-[1.06] tracking-[-0.4px]">Your work doesn&apos;t stop at TenantSpark</h2>
            <p className="text-[17px] leading-relaxed text-ink-2">Rent payments, repair requests and signed leases flow into QuickBooks, Google Sheets, Gmail, Slack and 8,000 other apps through Zapier. Set it up once in Settings.</p>
            <Link href="/features/integrations" className="inline-flex items-center gap-1.5 text-[16px] font-semibold text-link hover:text-link-dark">See our integrations <span aria-hidden="true">→</span></Link>
          </div>
          <Cluster items={RIGHT} />
        </div>

        {/* Phone and tablet: headline, then one wrapped row of hexes */}
        <div className="lg:hidden flex flex-col items-center text-center gap-6">
          <Eyebrow>One connection. All your tools.</Eyebrow>
          <h2 className="font-display font-semibold text-[34px] leading-[1.06] tracking-[-0.3px]">Your work doesn&apos;t stop at TenantSpark</h2>
          <p className="text-[16px] leading-relaxed text-ink-2 max-w-[520px]">Rent payments, repair requests and signed leases flow into QuickBooks, Google Sheets, Gmail, Slack and 8,000 other apps through Zapier.</p>
          <div className="flex flex-wrap justify-center gap-2 max-w-[460px]" aria-hidden="true">
            {[...LEFT, ...RIGHT].map(([name]) => <Hex key={name} name={name} size={72} />)}
          </div>
          <Link href="/features/integrations" className="inline-flex items-center gap-1.5 text-[16px] font-semibold text-link hover:text-link-dark">See our integrations <span aria-hidden="true">→</span></Link>
        </div>
        <p className="sr-only">Connects with {Object.keys(I).join(", ")} and more.</p>
      </Wrap>
    </section>
  );
}
