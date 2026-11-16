import { H2, Wrap } from "./sections";

// Four card types. Each has a color pair, a bold stroke, and a simple building drawing.
// Swap `photo` in later for a real licensed image; the stroke and label stay on top.
type Card = { label: string; sub: string; from: string; to: string; stroke: string; building: React.ReactNode; photo?: string };

const Bldg = {
  house: (
    <>
      <path d="M20 150 L20 90 L70 50 L120 90 L120 150 Z" />
      <path d="M90 60 L90 44 L102 44 L102 70" />
      <rect x="58" y="110" width="24" height="40" />
      <rect x="32" y="100" width="16" height="16" />
      <rect x="92" y="100" width="16" height="16" />
    </>
  ),
  duplex: (
    <>
      <path d="M10 150 L10 70 L55 40 L100 70 L100 150 Z" />
      <path d="M100 150 L100 70 L145 40 L190 70 L190 150 Z" />
      <rect x="44" y="115" width="20" height="35" /><rect x="134" y="115" width="20" height="35" />
      <rect x="24" y="85" width="14" height="14" /><rect x="70" y="85" width="14" height="14" />
      <rect x="114" y="85" width="14" height="14" /><rect x="160" y="85" width="14" height="14" />
    </>
  ),
  apartments: (
    <>
      <rect x="20" y="20" width="110" height="130" />
      <rect x="140" y="60" width="50" height="90" />
      {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={34 + c * 30} y={34 + r * 26} width="16" height="14" />))}
      {[0, 1, 2].map((r) => <rect key={r} x="154" y={74 + r * 24} width="22" height="12" />)}
      <rect x="64" y="124" width="22" height="26" />
    </>
  ),
  townhomes: (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 60} 0)`}>
          <path d="M10 150 L10 60 L40 40 L70 60 L70 150 Z" />
          <rect x="30" y="118" width="18" height="32" />
          <rect x="20" y="80" width="12" height="14" /><rect x="48" y="80" width="12" height="14" />
        </g>
      ))}
    </>
  ),
};

const cards: Card[] = [
  { label: "Residential", sub: "Any home you rent out", from: "#0E1730", to: "#1B2A52", stroke: "#1492FF", building: Bldg.house, photo: "/photos/residential.jpg" },
  { label: "Multifamily", sub: "Duplexes to 50-unit buildings", from: "#8A4300", to: "#FFAE3D", stroke: "#0E1730", building: Bldg.apartments, photo: "/photos/apartments.jpg" },
  { label: "Single-family", sub: "One house, one tenant", from: "#0B6FD6", to: "#1492FF", stroke: "#FFAE3D", building: Bldg.duplex, photo: "/photos/single-family.jpg" },
  { label: "Commercial", sub: "Shops, offices, mixed use", from: "#156337", to: "#2E9E5B", stroke: "#F4F6FA", building: Bldg.townhomes, photo: "/photos/commercial.jpg" },
];

function Stroke({ color, variant }: { color: string; variant: number }) {
  const d = [
    "M-20 120 C 60 -20, 220 10, 180 150 C 150 250, 20 230, 40 140",
    "M-30 60 C 80 -30, 160 120, 260 20",
    "M-10 200 C 40 60, 90 300, 170 60 C 200 -20, 260 60, 250 160",
    "M-20 40 C 120 -40, 120 240, 260 120",
  ][variant % 4];
  return (
    <svg aria-hidden="true" viewBox="0 0 240 260" preserveAspectRatio="none" className="absolute inset-x-0 top-0 w-full h-[62%]">
      <path d={d} fill="none" stroke={color} strokeWidth="34" strokeLinecap="round" opacity="0.95" />
    </svg>
  );
}

export function PortfolioCards() {
  return (
    <section>
      <Wrap className="py-20 sm:py-24 flex flex-col gap-10">
        <div className="max-w-[640px] flex flex-col gap-3">
          <H2>Built for the places small landlords own</H2>
          <p className="text-[17px] leading-relaxed text-ink-2">One house or forty units across town. Every unit works the same way, and you pay the same $2 for each.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {cards.map((c, i) => (
            <div
              key={c.label}
              className="relative aspect-[3/4.6] rounded-[20px] overflow-hidden shadow-[0_18px_40px_rgba(14,23,48,0.16)]"
              style={{ background: c.photo ? `url(${c.photo}) center/cover` : `linear-gradient(170deg, ${c.from} 0%, ${c.to} 100%)` }}
            >
              <Stroke color={c.stroke} variant={i} />
              {c.photo ? null : (
                <svg aria-hidden="true" viewBox="0 0 200 160" className="absolute bottom-0 inset-x-0 w-full h-[46%] fill-white/22">
                  {c.building}
                </svg>
              )}
              <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col gap-1 text-white">
                <h3 className="font-display font-semibold text-[22px] sm:text-[28px] leading-tight">{c.label}</h3>
                <p className="text-[13px] sm:text-[15px] text-white/80">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  );
}
