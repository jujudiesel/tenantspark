import { createHmac, randomUUID } from "node:crypto";
import type { adminClient } from "@/lib/supabase/admin";
import { EVENT_TYPES, loadObject } from "@/lib/api/objects";
import { notifyForEvent } from "@/lib/reminders";

type Db = ReturnType<typeof adminClient>;

/** Builds the webhook body for an event: { id, type, created_at, <object>: {...} }. Null if the object is gone. */
export async function buildPayload(db: Db, event: { id: string; type: string; object_id: string; created_at: string; account_id: string }) {
  const def = EVENT_TYPES[event.type];
  if (!def) return null;
  const object = await loadObject(db, def.object, event.object_id, event.account_id);
  if (!object) return null;
  return { id: event.id, type: event.type, created_at: event.created_at, [def.object]: object };
}

async function post(url: string, body: string, secret: string, type: string) {
  const sig = createHmac("sha256", secret).update(body).digest("hex");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "TenantSpark-Webhooks/1.0", "X-TenantSpark-Event": type, "X-TenantSpark-Signature": `sha256=${sig}`, "X-TenantSpark-Delivery": randomUUID() },
      body,
      signal: ctrl.signal,
    });
    return { status: res.status, error: res.ok ? null : `HTTP ${res.status}` };
  } catch (e) {
    return { status: null, error: e instanceof Error ? e.message : "request failed" };
  } finally {
    clearTimeout(t);
  }
}

/** Sends one event to every matching subscription on its account. Safe to call twice. */
export async function deliverEvent(db: Db, eventId: string) {
  const { data: event } = await db.from("events").select("id, account_id, type, object_id, created_at").eq("id", eventId).maybeSingle();
  if (!event) return { sent: 0 };

  // Email and text reminders ride on the same events as webhooks. Deduped inside, so retries are safe.
  try {
    const payloadForNotify = await buildPayload(db, event);
    await notifyForEvent(db, event, payloadForNotify);
  } catch (e) {
    console.error("notify failed", e);
  }

  const { data: subs } = await db
    .from("webhook_subscriptions")
    .select("id, url, secret, event_type")
    .eq("account_id", event.account_id)
    .eq("active", true)
    .or(`event_type.eq.*,event_type.eq.${event.type}`);
  if (!subs?.length) return { sent: 0 };

  const payload = await buildPayload(db, event);
  if (!payload) return { sent: 0 };
  const body = JSON.stringify(payload);

  let sent = 0;
  for (const s of subs) {
    const { data: existing } = await db.from("webhook_deliveries").select("id, delivered_at, attempts").eq("subscription_id", s.id).eq("event_id", event.id).maybeSingle();
    if (existing?.delivered_at) continue;
    if ((existing?.attempts ?? 0) >= 8) continue;
    const r = await post(s.url, body, s.secret, event.type);
    const ok = r.status != null && r.status >= 200 && r.status < 300;
    await db.from("webhook_deliveries").upsert(
      { subscription_id: s.id, event_id: event.id, attempts: (existing?.attempts ?? 0) + 1, status_code: r.status, delivered_at: ok ? new Date().toISOString() : null, last_error: r.error },
      { onConflict: "subscription_id,event_id" },
    );
    if (ok) sent++;
    // Zapier (and others) say 410 when a hook was deleted on their side.
    if (r.status === 410) await db.from("webhook_subscriptions").update({ active: false }).eq("id", s.id);
  }
  return { sent };
}

/** Retries anything that never got through, newest first. Used by the daily job. */
export async function sweepUndelivered(db: Db, limit = 200) {
  const since = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data: events } = await db.from("events").select("id").gt("created_at", since).order("created_at", { ascending: false }).limit(limit);
  let sent = 0;
  for (const e of events ?? []) sent += (await deliverEvent(db, e.id)).sent;
  return { checked: events?.length ?? 0, sent };
}
