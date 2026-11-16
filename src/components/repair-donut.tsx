/** A small donut with a legend. Plain SVG, no library. */
export function RepairDonut({ counts }: { counts: { label: string; value: number; color: string }[] }) {
  const total = counts.reduce((s, c) => s + c.value, 0);
  const r = 40;
  const stroke = 14;
  const C = 2 * Math.PI * r;
  // Precompute each arc's start so the render stays pure.
  const arcs = counts.reduce<{ c: (typeof counts)[number]; len: number; start: number }[]>((acc, c) => {
    const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].len : 0;
    acc.push({ c, len: total ? (c.value / total) * C : 0, start });
    return acc;
  }, []);
  const label = counts.map((c) => `${c.value} ${c.label.toLowerCase()}`).join(", ");
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" role="img" aria-label={`${total} open repairs: ${label}`} className="w-[108px] h-[108px] flex-none">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#EEF1F6" strokeWidth={stroke} />
        {arcs.map(({ c, len, start }) =>
          c.value ? (
            <circle
              key={c.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={c.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-start}
              transform="rotate(-90 50 50)"
            />
          ) : null,
        )}
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="font-display" fontSize="22" fontWeight="600" fill="#0E1730">{total}</text>
      </svg>
      <ul className="flex flex-col gap-1.5 text-sm">
        {counts.map((c) => (
          <li key={c.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="w-2.5 h-2.5 rounded-[3px]" style={{ background: c.color }} />
            <span className="text-ink-2">{c.label}</span>
            <span className="font-semibold tabular ml-1">{c.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
