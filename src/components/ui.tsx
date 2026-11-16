import Link from "next/link";
import type { ReactNode } from "react";

export function Button({
  children,
  href,
  variant = "primary",
  type = "button",
  disabled,
  className = "",
  ...rest
}: {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "spark" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const base =
    "inline-flex items-center justify-center min-h-11 px-4.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-navy text-white hover:bg-navy-3",
    secondary: "bg-white text-ink border border-field hover:bg-page",
    spark: "bg-spark text-navy hover:bg-[#3ea4ff]",
    danger: "bg-white text-red-ink border border-field hover:bg-red-bg",
  }[variant];
  if (href) {
    return (
      <Link href={href} className={`${base} ${styles} ${className}`}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} disabled={disabled} className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-line rounded-[14px] ${className}`}>{children}</section>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display font-semibold text-[32px] leading-[1.1]">{title}</h1>
        {subtitle ? <p className="text-[15px] text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  hint,
  autoComplete,
  inputMode,
  step,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number | null;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  step?: string;
  min?: string;
}) {
  const id = `f-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {required ? null : <span className="text-muted font-normal"> (optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        step={step}
        min={min}
        className="box-border w-full min-h-12 px-3.5 rounded-[10px] border border-field-strong bg-white text-ink text-base focus:outline-2 focus:outline-spark focus:outline-offset-1"
      />
      {hint ? <span className="text-[13px] text-muted">{hint}</span> : null}
    </div>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
}) {
  const id = `f-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="box-border w-full min-h-12 px-3 rounded-[10px] border border-field-strong bg-white text-ink text-base focus:outline-2 focus:outline-spark focus:outline-offset-1"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Textarea({
  label,
  name,
  defaultValue,
  rows = 3,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
}) {
  const id = `f-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label} <span className="text-muted font-normal">(optional)</span>
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        className="box-border w-full px-3.5 py-3 rounded-[10px] border border-field-strong bg-white text-ink text-base leading-snug resize-y focus:outline-2 focus:outline-spark focus:outline-offset-1"
      />
    </div>
  );
}

export function Pill({
  tone,
  children,
}: {
  tone: "blue" | "amber" | "gray" | "navy" | "green" | "red";
  children: ReactNode;
}) {
  const styles = {
    blue: "bg-blue-bg text-blue-ink",
    amber: "bg-amber-bg text-amber-ink",
    gray: "bg-line-2 text-ink-2",
    navy: "bg-navy text-white",
    green: "bg-green-bg text-green-ink",
    red: "bg-red-bg text-red-ink",
  }[tone];
  return (
    <span className={`inline-block px-2.5 py-1 rounded-xl text-[13px] font-semibold whitespace-nowrap ${styles}`}>
      {children}
    </span>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const styles = {
    info: "bg-page text-ink-2",
    error: "bg-red-bg text-red-ink",
    success: "bg-green-bg text-green-ink",
  }[tone];
  return <div className={`px-4 py-3.5 rounded-[10px] text-sm leading-normal ${styles}`}>{children}</div>;
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 p-7">
      <h2 className="font-display font-semibold text-xl">{title}</h2>
      <p className="text-[15px] text-muted max-w-prose">{body}</p>
      {action}
    </div>
  );
}

export function money(cents: number | null | undefined) {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function moneyExact(cents: number | null | undefined) {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
