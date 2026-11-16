"use client";

import { useState, useSyncExternalStore } from "react";
import type { Param } from "@/lib/api/spec";

/**
 * "Try it" for the API reference. The key lives in the reader's browser only (localStorage) and is
 * sent straight to /api/v1 from their browser. Nothing here logs or stores it anywhere else.
 */

const STORAGE = "ts_docs_key";
const listeners = new Set<() => void>();
function readKey() {
  try {
    return localStorage.getItem(STORAGE) ?? "";
  } catch {
    return "";
  }
}
function writeKey(k: string) {
  try {
    if (k) localStorage.setItem(STORAGE, k);
    else localStorage.removeItem(STORAGE);
  } catch {}
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
/** The key the reader pasted, shared by every Try it on the page. Empty on the server. */
function useApiKey() {
  const key = useSyncExternalStore(subscribe, readKey, () => "");
  return { key, setKey: writeKey };
}
const now = () => performance.now();

export function KeyBar() {
  const { key, setKey } = useApiKey();
  const [show, setShow] = useState(false);
  return (
    <div className="rounded-xl border border-line bg-white p-4 flex flex-col gap-2">
      <label htmlFor="docs-key" className="text-[13px] font-semibold text-ink">Your API key</label>
      <div className="flex gap-2">
        <input
          id="docs-key"
          type={show ? "text" : "password"}
          value={key}
          onChange={(e) => setKey(e.target.value.trim())}
          placeholder="ts_live_..."
          autoComplete="off"
          spellCheck={false}
          className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-field text-[14px] font-mono"
        />
        <button type="button" onClick={() => setShow((s) => !s)} className="h-10 px-3 rounded-lg border border-field text-[13px] font-semibold hover:bg-page">
          {show ? "Hide" : "Show"}
        </button>
        {key ? (
          <button type="button" onClick={() => setKey("")} className="h-10 px-3 rounded-lg border border-field text-[13px] font-semibold hover:bg-page">Clear</button>
        ) : null}
      </div>
      <p className="text-[12px] text-muted m-0">
        Paste a key to run the examples on this page against your own account. It stays in this browser only. Make one under Settings, Integrations.
      </p>
    </div>
  );
}

type Props = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  params: Param[];
  body?: Record<string, unknown>;
};

export function TryIt({ method, path, params, body }: Props) {
  const { key } = useApiKey();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [bodyText, setBodyText] = useState(body ? JSON.stringify(body, null, 2) : "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ status: number; ms: number; text: string } | null>(null);

  const pathParams = params.filter((p) => p.in === "path");
  const queryParams = params.filter((p) => p.in === "query");

  async function run() {
    setBusy(true);
    setResult(null);
    const t0 = now();
    try {
      let url = path;
      for (const p of pathParams) url = url.replace(`{${p.name}}`, encodeURIComponent(values[p.name] ?? ""));
      const qs = new URLSearchParams();
      for (const p of queryParams) if (values[p.name]) qs.set(p.name, values[p.name]);
      if ([...qs.keys()].length) url += `?${qs}`;
      const init: RequestInit = { method, headers: { Authorization: `Bearer ${key}` } };
      if (method === "POST") {
        init.headers = { ...init.headers, "Content-Type": "application/json" };
        init.body = bodyText;
      }
      const res = await fetch(url, init);
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
      setResult({ status: res.status, ms: Math.round(now() - t0), text: pretty });
    } catch (e) {
      setResult({ status: 0, ms: Math.round(now() - t0), text: e instanceof Error ? e.message : "Request failed" });
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start h-9 px-3.5 rounded-lg border border-field text-[13px] font-semibold hover:bg-page">
        Try it
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">Try it</span>
        <button type="button" onClick={() => setOpen(false)} className="text-[13px] text-muted hover:text-ink">Close</button>
      </div>
      {!key ? <p className="text-[13px] text-amber-ink bg-amber-bg rounded-lg px-3 py-2 m-0">Paste your API key at the top of the page first.</p> : null}
      {[...pathParams, ...queryParams].length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {[...pathParams, ...queryParams].map((p) => (
            <label key={p.name} className="flex flex-col gap-1 text-[12px] text-muted">
              <span>
                <code className="text-ink">{p.name}</code>
                {p.required ? <span className="text-red-ink"> *</span> : null}
              </span>
              <input
                value={values[p.name] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
                placeholder={p.type}
                className="h-9 px-2.5 rounded-lg border border-field text-[13px] font-mono text-ink"
              />
            </label>
          ))}
        </div>
      ) : null}
      {method === "POST" ? (
        <label className="flex flex-col gap-1 text-[12px] text-muted">
          Body (JSON)
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={Math.min(14, bodyText.split("\n").length + 1)}
            spellCheck={false}
            className="px-2.5 py-2 rounded-lg border border-field text-[13px] font-mono text-ink leading-relaxed"
          />
        </label>
      ) : null}
      {method === "POST" || method === "DELETE" ? (
        <p className="text-[12px] text-muted m-0">This writes to your account. It is real.</p>
      ) : null}
      <button
        type="button"
        onClick={run}
        disabled={busy || !key}
        className="self-start h-9 px-4 rounded-lg bg-navy text-white text-[13px] font-semibold disabled:opacity-40"
      >
        {busy ? "Sending…" : `Send ${method}`}
      </button>
      {result ? (
        <div className="flex flex-col gap-1.5">
          <div className="text-[12px] text-muted">
            <span className={`font-bold ${result.status >= 200 && result.status < 300 ? "text-green-ink" : "text-red-ink"}`}>{result.status || "Error"}</span>
            {" · "}{result.ms} ms
          </div>
          <pre className="text-[12px] leading-relaxed px-3 py-2.5 rounded-lg bg-page border border-line overflow-x-auto whitespace-pre max-h-[420px] overflow-y-auto"><code>{result.text}</code></pre>
        </div>
      ) : null}
    </div>
  );
}
