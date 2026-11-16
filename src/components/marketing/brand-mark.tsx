import icons from "./brand-icons.json";

type Icon = { hex: string; path: string };
const I = icons as Record<string, Icon>;
const LIGHT = new Set(["FFE01B", "FFFFFF", "F4F6FA"]);

/** A brand mark from simple-icons, or a lettered tile when we don't have one. */
export function BrandMark({ name, color, size = 44 }: { name: string; color?: string; size?: number }) {
  const icon = I[name];
  const r = Math.round(size * 0.27);
  if (icon) {
    const fill = LIGHT.has(icon.hex.toUpperCase()) ? "#241C15" : `#${icon.hex}`;
    return (
      <span className="inline-flex items-center justify-center bg-white border border-line flex-none" style={{ width: size, height: size, borderRadius: r }}>
        <svg viewBox="0 0 24 24" role="img" aria-label={name} width={size * 0.55} height={size * 0.55} fill={fill}><path d={icon.path} /></svg>
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="inline-flex items-center justify-center text-white font-display font-semibold flex-none" style={{ width: size, height: size, borderRadius: r, background: color ?? "#0E1730", fontSize: size * 0.42 }}>
      {name.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}
