export function BoltBadge({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={{ overflow: "visible", flex: "none" }}
    >
      <g transform="translate(21 0) skewX(-12)">
        <rect x="6" y="6" width="188" height="188" rx="44" fill="#1492FF" />
      </g>
      <polygon points="128,18 54,114 94,114 72,184 148,88 108,88" fill="#FFFFFF" />
    </svg>
  );
}

export function Wordmark({
  size = 24,
  onDark = false,
}: {
  size?: number;
  onDark?: boolean;
}) {
  return (
    <span
      className="font-wordmark leading-none"
      style={{ fontSize: size, letterSpacing: "-0.2px", color: onDark ? "#FFFFFF" : "#0E1730" }}
    >
      TENANT
      <span style={{ color: onDark ? "#1492FF" : "#0B6FD6" }}>SPARK</span>
    </span>
  );
}

export function Logo({ size = 36, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <BoltBadge size={size} />
      <Wordmark size={Math.round(size * 0.67)} onDark={onDark} />
    </span>
  );
}
