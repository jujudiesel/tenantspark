"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          window.prompt("Copy this link:", text);
        }
      }}
      className="inline-flex items-center justify-center min-h-11 px-4.5 rounded-lg text-sm font-semibold whitespace-nowrap bg-navy text-white hover:bg-navy-3"
    >
      {done ? "Copied" : label}
    </button>
  );
}
