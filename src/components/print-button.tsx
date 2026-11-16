"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center min-h-11 px-4.5 rounded-lg text-sm font-semibold bg-white text-ink border border-field hover:bg-page">
      Print or save as PDF
    </button>
  );
}
