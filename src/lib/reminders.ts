import { SITE, button, esc, landlordContacts, loadSettings, notify, para, wrapHtml, type Message } from "@/lib/notify";

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Db = { from: (table: string) => Any; rpc?: Any };

const money = (c: number) => (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
const nice = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
};
const first = (name: string | null | undefined) => (name ?? "there").split(" ")[0];
const TENANT_FOOT = "You get these because your landlord manages your rental with TenantSpark. Questions about your rent or lease go to your landlord.";
const LANDLORD_FOOT = `Change what you get under Settings, Notifications at ${SITE}/settings/notifications.`;

function tenantMsg(subject: string, lines: string[], cta: { href: string; label: string } | null, sms: string): Message {
  const text = `${lines.join("\n\n")}${cta ? `\n\n${cta.label}: ${cta.href}` : ""}\n\n${TENANT_FOOT}`;
  const html = wrapHtml(subject, para(...lines.map(esc)) + (cta ? button(cta.href, cta.label) : ""), esc(TENANT_FOOT));
  return { subject, text, html, sms };
}
function landlordMsg(subject: string, lines: string[], cta: { href: string; label: string } | null): Message {
  const text = `${lines.join("\n\n")}${cta ? `\n\n${cta.label}: ${cta.href}` : ""}\n\n${LANDLORD_FOOT}`;
  const html = wrapHtml(subject, para(...lines.map(esc)) + (cta ? button(cta.href, cta.label) : ""), esc(LANDLORD_FOOT));
  return { subject, text, html };
}

type Charge = { id: string; account_id: string; due_date: string; amount_cents: number; late_fee_cents: number; paid_cents: number; status: string; description: string | null; leases: { id: string; units: { label: string; properties: { name: string } } ; lease_tenants: { tenants: { id: string; full_name: string; email: string | null; phone: string | null } }[] } };

async function tenantsOf(c: Charge) {
  return (c.leases?.lease_tenants ?? []).map((lt) => lt.tenants).filter((t) => t && (t.email || t.phone));
}

/** Daily: rent due soon, due today, late, lease ending. Returns counts. */
export async function runDailyReminders(db: Db, today: string) {
  const d = (offset: number) => {
    const [y, m, day] = today.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, day + offset)).toISOString().slice(0, 10);
  };
  const out = { due_soon: 0, due_today: 0, late: 0, lease_ending: 0 };
  const settingsCache = new Map<string, Record<string, boolean>>();
  const settingsFor = async (accountId: string) => {
    if (!settingsCache.has(accountId)) settingsCache.set(accountId, await loadSettings(db, accountId));
    return settingsCache.get(accountId)!;
  };
  const chargeSel = "id, account_id, due_date, amount_cents, late_fee_cents, paid_cents, status, description, leases(id, units(label, properties(name)), lease_tenants(tenants(id, full_name, email, phone)))";

  // Due in 3 days and due today
  for (const [offset, kind] of [[3, "due_soon"], [0, "due_today"]] as const) {
    const { data } = await db.from("rent_charges").select(chargeSel).eq("due_date", d(offset)).in("status", ["due", "partial"]);
    for (const c of (data ?? []) as Charge[]) {
      const s = await settingsFor(c.account_id);
      if (!s[`rent_${kind}`]) continue;
      const owed = c.amount_cents + c.late_fee_cents - c.paid_cents;
      if (owed <= 0) continue;
      const where = `${c.leases.units.properties.name}, ${c.leases.units.label}`;
      for (const t of await tenantsOf(c)) {
        const subject = kind === "due_soon" ? `Rent of ${money(owed)} is due ${nice(c.due_date)}` : `Rent of ${money(owed)} is due today`;
        const msg = tenantMsg(
          subject,
          [`Hi ${first(t.full_name)},`, `${c.description ?? "Rent"} for ${where} is ${money(owed)}, due ${nice(c.due_date)}.`, "You can pay from your portal, or the way you usually do."],
          { href: `${SITE}/tenant/pay`, label: "Pay rent" },
          `TenantSpark: ${money(owed)} rent for ${where} is due ${kind === "due_today" ? "today" : nice(c.due_date)}. Pay: ${SITE}/tenant/pay`,
        );
        await notify(db, { accountId: c.account_id, tenantId: t.id, kind: `rent.${kind}`, dedupeKey: `rent.${kind}:${c.id}:${t.id}`, email: t.email, phone: t.phone, sms: s.sms_enabled, message: msg });
        out[kind]++;
      }
    }
  }

  // Late: past due date + grace, unpaid. First time, then every 7 days.
  const { data: open } = await db.from("rent_charges").select(chargeSel).in("status", ["due", "partial"]).lt("due_date", today);
  const graceCache = new Map<string, number>();
  const graceFor = async (accountId: string) => {
    if (!graceCache.has(accountId)) {
      const { data } = await db.from("payment_settings").select("grace_days").eq("account_id", accountId).maybeSingle();
      graceCache.set(accountId, data?.grace_days ?? 5);
    }
    return graceCache.get(accountId)!;
  };
  for (const c of (open ?? []) as Charge[]) {
    const s = await settingsFor(c.account_id);
    if (!s.rent_late) continue;
    const grace = await graceFor(c.account_id);
    const daysLate = Math.round((Date.parse(today) - Date.parse(c.due_date)) / 86400000);
    if (daysLate <= grace) continue;
    const since = daysLate - grace - 1; // days since it became late
    if (since % 7 !== 0) continue;
    const owed = c.amount_cents + c.late_fee_cents - c.paid_cents;
    if (owed <= 0) continue;
    const where = `${c.leases.units.properties.name}, ${c.leases.units.label}`;
    for (const t of await tenantsOf(c)) {
      const msg = tenantMsg(
        `Rent for ${where} is past due`,
        [`Hi ${first(t.full_name)},`, `${c.description ?? "Rent"} of ${money(owed)} was due ${nice(c.due_date)} and hasn't been paid in full.${c.late_fee_cents ? ` That includes a late fee of ${money(c.late_fee_cents)}.` : ""}`, "If you've already paid another way, let your landlord know so they can record it."],
        { href: `${SITE}/tenant/pay`, label: "Pay now" },
        `TenantSpark: ${money(owed)} rent for ${where} is past due (was due ${nice(c.due_date)}). Pay: ${SITE}/tenant/pay`,
      );
      await notify(db, { accountId: c.account_id, tenantId: t.id, kind: "rent.late", dedupeKey: `rent.late:${c.id}:${t.id}:${today}`, email: t.email, phone: t.phone, sms: s.sms_enabled, message: msg });
      out.late++;
    }
  }

  // Lease ending in 60 or 30 days: tenant and landlord.
  for (const days of [60, 30]) {
    const { data } = await db.from("leases").select("id, account_id, end_date, rent_cents, units(label, properties(name)), lease_tenants(tenants(id, full_name, email, phone))").eq("status", "active").eq("end_date", d(days));
    for (const l of (data ?? []) as Any[]) {
      const s = await settingsFor(l.account_id);
      if (!s.lease_ending) continue;
      const where = `${l.units.properties.name}, ${l.units.label}`;
      for (const lt of l.lease_tenants ?? []) {
        const t = lt.tenants;
        if (!t) continue;
        const msg = tenantMsg(
          `Your lease at ${where} ends in ${days} days`,
          [`Hi ${first(t.full_name)},`, `Your lease ends ${nice(l.end_date)}. If you'd like to stay, reach out to your landlord about renewing.`],
          { href: `${SITE}/tenant/lease`, label: "See your lease" },
          `TenantSpark: your lease at ${where} ends ${nice(l.end_date)} (${days} days). Talk to your landlord about renewing.`,
        );
        await notify(db, { accountId: l.account_id, tenantId: t.id, kind: "lease.ending", dedupeKey: `lease.ending:${l.id}:${t.id}:${days}`, email: t.email, phone: t.phone, sms: s.sms_enabled, message: msg });
      }
      const names = (l.lease_tenants ?? []).map((lt: Any) => lt.tenants?.full_name).filter(Boolean).join(", ");
      for (const ll of await landlordContacts(db, l.account_id)) {
        const msg = landlordMsg(`Lease ending in ${days} days: ${where}`, [`${names || "The lease"} at ${where} ends ${nice(l.end_date)}. Rent is ${money(l.rent_cents)} a month.`, "Decide whether to renew, raise the rent, or list the unit."], { href: `${SITE}/leases/${l.id}`, label: "Open the lease" });
        await notify(db, { accountId: l.account_id, kind: "lease.ending.landlord", dedupeKey: `lease.ending.landlord:${l.id}:${ll.email}:${days}`, email: ll.email, message: msg });
      }
      out.lease_ending++;
    }
  }
  return out;
}

/** Event-driven: called by the webhook dispatcher for every event. */
export async function notifyForEvent(db: Db, event: { id: string; account_id: string; type: string; object_id: string }, payload: Any | null) {
  const s = await loadSettings(db, event.account_id);
  const obj = payload?.repair ?? payload?.payment ?? payload?.document ?? payload?.charge ?? null;
  if (!obj) return;
  const where = obj.property ? `${obj.property.name}${obj.unit ? `, ${obj.unit.label}` : ""}` : "";

  if ((event.type === "repair.note" || event.type === "repair.updated") && s.repair_updates && obj.tenant) {
    // Latest visible landlord note, for the body.
    const { data: note } = await db.from("maintenance_notes").select("body").eq("request_id", obj.id).eq("visible_to_tenant", true).eq("author_role", "landlord").order("created_at", { ascending: false }).limit(1).maybeSingle();
    const line = event.type === "repair.updated" ? `Status: ${String(obj.status).replace("_", " ")}.` : note?.body ?? "There's a new update.";
    const msg = tenantMsg(`Update on "${obj.title}"`, [`Hi ${first(obj.tenant.name)},`, line], { href: `${SITE}/tenant/repairs/${obj.id}`, label: "See the request" }, `TenantSpark: update on "${obj.title}": ${line} ${SITE}/tenant/repairs/${obj.id}`);
    await notify(db, { accountId: event.account_id, tenantId: obj.tenant.id, kind: event.type, dedupeKey: `${event.type}:${event.id}`, email: obj.tenant.email, phone: obj.tenant.phone, sms: s.sms_enabled, message: msg });
  }

  if ((event.type === "repair.created" || event.type === "repair.tenant_reply") && s.repair_updates) {
    const who = obj.tenant?.name ?? "A tenant";
    const subject = event.type === "repair.created" ? `New repair request: ${obj.title}` : `${who} replied on "${obj.title}"`;
    const lines = event.type === "repair.created"
      ? [`${who} sent a repair request for ${where}.`, `${obj.urgency === "emergency" ? "Marked as an EMERGENCY. " : obj.urgency === "urgent" ? "Marked urgent. " : ""}${obj.description ?? ""}`.trim()]
      : [`${who} added a comment on the repair at ${where}.`];
    for (const ll of await landlordContacts(db, event.account_id)) {
      await notify(db, { accountId: event.account_id, kind: `${event.type}.landlord`, dedupeKey: `${event.type}:${event.id}:${ll.email}`, email: ll.email, message: landlordMsg(subject, lines, { href: `${SITE}/maintenance/${obj.id}`, label: "Open the request" }) });
    }
  }

  if (event.type === "payment.received" && s.payment_receipt) {
    const amt = money(Math.round((obj.amount ?? 0) * 100));
    if (obj.tenant) {
      const msg = tenantMsg(`Receipt: ${amt} received`, [`Hi ${first(obj.tenant.name)},`, `We received ${amt} for ${where}${obj.method ? ` by ${obj.method === "ach" ? "bank transfer" : obj.method}` : ""}. Thank you.`], { href: `${SITE}/tenant/pay`, label: "Payment history" }, `TenantSpark: received ${amt} for ${where}. Thank you.`);
      await notify(db, { accountId: event.account_id, tenantId: obj.tenant.id, kind: "payment.receipt", dedupeKey: `payment.receipt:${event.id}`, email: obj.tenant.email, phone: obj.tenant.phone, sms: s.sms_enabled, message: msg });
    }
    for (const ll of await landlordContacts(db, event.account_id)) {
      await notify(db, { accountId: event.account_id, kind: "payment.received.landlord", dedupeKey: `payment.received:${event.id}:${ll.email}`, email: ll.email, message: landlordMsg(`Rent paid: ${obj.tenant?.name ?? "Tenant"} paid ${amt}`, [`${amt} came in for ${where}${obj.method ? ` by ${obj.method === "ach" ? "bank transfer" : obj.method}` : ""}.`], { href: `${SITE}/rent`, label: "Open rent" }) });
    }
  }

  if (event.type === "document.sent" && s.document_sent) {
    for (const t of obj.tenants ?? []) {
      const msg = tenantMsg(`Please sign: ${obj.title}`, [`Hi ${first(t.name)},`, `Your landlord sent "${obj.title}" for ${where} to sign. It takes a minute from your phone.`], { href: `${SITE}/tenant/sign/${obj.id}`, label: "Review and sign" }, `TenantSpark: please sign "${obj.title}" for ${where}: ${SITE}/tenant/sign/${obj.id}`);
      await notify(db, { accountId: event.account_id, tenantId: t.id, kind: "document.sent", dedupeKey: `document.sent:${event.id}:${t.id}`, email: t.email, phone: t.phone, sms: s.sms_enabled, message: msg });
    }
  }

  if (event.type === "lease.signed") {
    for (const ll of await landlordContacts(db, event.account_id)) {
      await notify(db, { accountId: event.account_id, kind: "lease.signed.landlord", dedupeKey: `lease.signed:${event.id}:${ll.email}`, email: ll.email, message: landlordMsg(`Signed: ${obj.title}`, [`Everyone has signed "${obj.title}" for ${where}. The stamped PDF is on the lease.`], { href: `${SITE}/leases/${obj.lease_id}`, label: "Open the lease" }) });
    }
  }
}

/** Invite email, sent right when a landlord creates the invite. */
export async function sendInvite(db: Db, opts: { accountId: string; tenant: { id: string; full_name: string; email: string | null; phone: string | null }; landlord: string; url: string; sms: boolean }) {
  const t = opts.tenant;
  const msg = tenantMsg(
    `${opts.landlord} set up your tenant portal`,
    [`Hi ${first(t.full_name)},`, `${opts.landlord} uses TenantSpark to manage your rental. Your portal is where you can see your lease, pay rent, and send repair requests from your phone.`, "Open the link to pick a password."],
    { href: opts.url, label: "Set up my login" },
    `${opts.landlord} set up your tenant portal on TenantSpark. Pick a password here: ${opts.url}`,
  );
  return notify(db, { accountId: opts.accountId, tenantId: t.id, kind: "invite", dedupeKey: `invite:${t.id}:${Date.now()}`, email: t.email, phone: t.phone, sms: opts.sms, message: msg });
}
