export type Feature = {
  slug: string;
  nav: string;
  title: string;
  lead: string;
  shot: string;
  shotKind?: "browser" | "phone";
  points: { title: string; body: string }[];
  detail: { title: string; body: string; bullets: string[]; shot: string; shotKind?: "browser" | "phone" };
  faq: [string, string][];
};

export const FEATURE_PAGES: Feature[] = [
  {
    slug: "rent-collection",
    nav: "Rent collection",
    title: "Rent collection that runs itself",
    lead: "Charges post on the 1st. Tenants pay from their phone or turn on autopay. You see who's paid, who's late and who's partial on one screen, and the money lands in your bank.",
    shot: "/shots/rent.png",
    points: [
      { title: "Bank transfer or card", body: "Tenants choose. Bank transfers are free for them. Card payments carry a small convenience fee the tenant pays, not you." },
      { title: "Autopay", body: "A tenant turns it on once and rent goes out on the due date every month. You can see who has it on." },
      { title: "Late fees and grace periods", body: "Set the late fee and how many days of grace. It's added on its own after that, and you can waive it with one click." },
      { title: "Cash and checks too", body: "Still get some rent by hand? Record it in two clicks so the books stay right." },
      { title: "Straight to your bank", body: "Payments go through Stripe to the account you connect. We never hold your money." },
      { title: "Receipts and history", body: "Every payment is logged with the method, date and note. Tenants see their own history in the portal." },
    ],
    detail: {
      title: "One page for the month",
      body: "The Rent page shows every charge for the month with paid, late and partial filters. Record a payment, void a charge or waive a late fee without leaving it.",
      bullets: ["Collected, still owed and billed totals at the top", "Move month to month", "Click any tenant to open their file"],
      shot: "/shots/rent.png",
    },
    faq: [
      ["Do I pay a fee on rent?", "No. Bank transfers are free for everyone. Tenants who pay by card pay a convenience fee, which you can set."],
      ["How fast does the money arrive?", "Card payments settle in about two business days. Bank transfers take two to four. Stripe pays out to your bank on a rolling schedule you can see in Settings."],
      ["Can I collect deposits or one-off charges?", "Monthly rent and late fees today. One-off charges like deposits and utilities are on the way."],
    ],
  },
  {
    slug: "leases",
    nav: "Leases and e-sign",
    title: "Leases signed on a phone, stamped and stored",
    lead: "Upload the lease you already use. Send it to everyone on the lease. They sign by typing their name. You get a PDF with every signature and timestamp stamped on it.",
    shot: "/shots/tenant-lease.png",
    shotKind: "phone",
    points: [
      { title: "Your lease, not ours", body: "Upload any PDF. We don't make you use a template." },
      { title: "Roommates handled", body: "Put several tenants on one lease. The document is done when all of them have signed." },
      { title: "Signed copy for everyone", body: "Tenants see the signed PDF in their portal. You keep the original and the stamped copy." },
      { title: "Terms live with the unit", body: "Rent, deposit, due day, start and end dates. Rent charges come from these, so there's nothing to re-enter." },
      { title: "Renewals in view", body: "Leases ending in the next 90 days show on your dashboard so nothing sneaks up on you." },
      { title: "No per-signature bill", body: "Included in the $2 a unit. Sign as many documents as you need." },
    ],
    detail: {
      title: "A lease file you can trust",
      body: "Each lease keeps its documents, who has signed and when, the unit, and the tenants on it. Every signature records the name typed, the time, and the device it came from.",
      bullets: ["Send, resend or replace a document", "See who still needs to sign", "Download the stamped PDF any time"],
      shot: "/shots/tenant-lease.png",
      shotKind: "phone",
    },
    faq: [
      ["Is a typed signature legal?", "In the US, yes, under the ESIGN Act, as long as the signer agrees to sign electronically and the record is kept. TenantSpark records consent, time and device with every signature. For anything unusual, ask a local attorney."],
      ["Can I use my state's lease form?", "Yes. Upload any PDF you have the right to use."],
      ["What if a tenant doesn't have email?", "Invite them by text. The invite link works the same way."],
    ],
  },
  {
    slug: "maintenance",
    nav: "Maintenance",
    title: "Repairs tracked from the first text to the last invoice",
    lead: "A tenant sends a request with photos and how urgent it is. You schedule the vendor, post updates the tenant can see, keep notes they can't, and close it with the cost.",
    shot: "/shots/repair-detail.png",
    points: [
      { title: "Photos from the tenant's phone", body: "They take the picture right in the form. You see the problem before you call anyone." },
      { title: "Urgency you can sort by", body: "Routine, urgent or emergency. Emergencies go to the top of the list and the dashboard." },
      { title: "Schedule and assign", body: "Pick a date and who's going. The tenant sees both in their portal without a phone call." },
      { title: "Updates both ways", body: "You post updates, the tenant replies. Mark a note private and only you see it." },
      { title: "Okay to enter", body: "Tenants say up front whether it's fine to come in when they're out." },
      { title: "Cost and history", body: "Close it with what it cost. Every request stays on the unit's record." },
    ],
    detail: {
      title: "Log one yourself too",
      body: "Got a call or found something on a walk-through? Log it against the unit. If a tenant lives there, it shows up in their portal like any other request.",
      bullets: ["Open, new, scheduled, in progress and done filters", "Reopen anything if the problem comes back", "Dashboard shows open repairs by status"],
      shot: "/shots/maintenance.png",
    },
    faq: [
      ["Can vendors log in?", "Not yet. Today you relay the job to the vendor by text or email. Vendor logins and payouts are on the roadmap."],
      ["Do tenants get notified of updates?", "They see updates in the portal now. Email and text notifications are coming before launch."],
    ],
  },
  {
    slug: "tenant-portal",
    nav: "Tenant portal",
    title: "A tenant portal that works on any phone",
    lead: "Tenants see what's due, pay it, sign documents and send repair requests. Fewer calls and texts to you, and everything they do is logged.",
    shot: "/shots/tenant-home.png",
    shotKind: "phone",
    points: [
      { title: "No app to install", body: "It's a website that fits a phone. Tenants can add it to their home screen and it behaves like an app." },
      { title: "Invite by text or email", body: "You send a link. They pick a password. Done. You can resend it or send a password reset any time." },
      { title: "Pay in a few taps", body: "Bank transfer or card, with autopay if they want it. Their payment history is right there." },
      { title: "Sign on the spot", body: "Lease and other documents open in the portal and get signed by typing a name." },
      { title: "Repairs with photos", body: "The request form is built for a phone: what's wrong, where, a photo, how urgent." },
      { title: "Free for tenants", body: "Never a charge to the tenant for using the portal." },
    ],
    detail: {
      title: "Built for the phone first",
      body: "Big buttons, short forms, and a bottom bar with the four things tenants actually do: home, pay, lease, repairs.",
      bullets: ["Works in Safari and Chrome on any phone", "Also fine on a laptop", "English today, Spanish coming"],
      shot: "/shots/tenant-repair-form.png",
      shotKind: "phone",
    },
    faq: [
      ["Can a tenant see other tenants or other units?", "No. A tenant sees only their own lease, charges, documents and repair requests."],
      ["What if they forget their password?", "They click Forgot password on the login page, or you send them a reset link from their tenant page."],
    ],
  },
  {
    slug: "integrations",
    nav: "Integrations",
    title: "Works with the tools you already use",
    lead: "Connect TenantSpark to Zapier once. From then on, rent payments, repair requests, new leases and signed documents can go to QuickBooks, a spreadsheet, Slack, your email, or thousands of other apps.",
    shot: "/shots/integrations.png",
    points: [
      { title: "Zapier", body: "Thirteen instant triggers (rent paid, rent late, new repair, lease signed and more) and actions to create tenants, open repairs and record payments." },
      { title: "QuickBooks and Sheets", body: "Send every payment to your books or a spreadsheet the moment it lands." },
      { title: "Reminders through Gmail, SMS or Slack", body: "Late rent? Text yourself. New repair? Post it in a channel. Lease signed? Send a welcome email." },
      { title: "Trello, Asana, Notion", body: "Turn repair requests into cards or tasks for your handyman." },
      { title: "Webhooks and an API", body: "Building something yourself? Every event is available as a signed webhook and the full data is behind a REST API." },
      { title: "Keys you control", body: "Make and revoke API keys from Settings. See what's connected and what fired." },
    ],
    detail: {
      title: "Set up in Settings",
      body: "Make an API key, paste it into Zapier when it asks, and pick a trigger. Zapier handles the rest. You can see every connection and recent activity on the Integrations page.",
      bullets: ["One key per tool, revoke any time", "Recent activity shows what your integrations can react to", "API docs at tenantspark.com/developers"],
      shot: "/shots/integrations.png",
    },
    faq: [
      ["Does Zapier cost extra?", "Zapier has a free plan that covers simple two-step zaps. Bigger plans are between you and Zapier. TenantSpark charges nothing for the connection."],
      ["Is there a direct QuickBooks sync?", "Through Zapier today. A direct QuickBooks Online sync with class and customer mapping is planned."],
    ],
  },
];
