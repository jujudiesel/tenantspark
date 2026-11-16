export type Tag = "Built in" | "Zapier" | "API" | "Planned";
export type Integration = { name: string; blurb: string; tag: Tag; href?: string; color?: string };
export type Category = { id: string; title: string; blurb: string; items: Integration[] };

const z = (name: string, blurb: string, color?: string): Integration => ({ name, blurb, tag: "Zapier", color });

export const CATEGORIES: Category[] = [
  {
    id: "accounting",
    title: "Accounting",
    blurb: "Every payment, fee and repair cost into your books the moment it happens.",
    items: [
      z("QuickBooks", "Send payments and expenses to QuickBooks Online."),
      z("Xero", "Post rent received and repair costs as transactions."),
      z("FreshBooks", "Invoices and payments kept in sync.", "#0075DD"),
      z("Wave", "Free accounting for small landlords."),
      z("Expensify", "Repair receipts into expense reports."),
      z("Google Sheets", "A row per payment, charge or repair."),
    ],
  },
  {
    id: "payments",
    title: "Payments",
    blurb: "Rent collection is built in. These are the other ways money moves.",
    items: [
      { name: "Stripe", blurb: "Bank transfer and card rent, autopay, payouts to your bank.", tag: "Built in", href: "/features/rent-collection" },
      z("PayPal", "Log a PayPal payment as a rent payment."),
      z("Venmo", "Record Venmo rent by hand or through a zap."),
    ],
  },
  {
    id: "esign",
    title: "E-signature",
    blurb: "Leases are signed inside TenantSpark. Use these if you already have a signing tool.",
    items: [
      { name: "TenantSpark e-sign", blurb: "Typed signature, stamped PDF, no per-signature fee.", tag: "Built in", href: "/features/leases" },
      z("DocuSign", "Send a lease to DocuSign when it's created.", "#4C00FF"),
      z("Dropbox Sign", "Same, for Dropbox Sign users."),
    ],
  },
  {
    id: "communication",
    title: "Communication",
    blurb: "Get told the moment something happens, where you already look.",
    items: [
      z("Slack", "Late rent, new repairs and signed leases in a channel.", "#4A154B"),
      z("Microsoft Teams", "The same alerts in Teams.", "#5059C9"),
      z("Twilio", "Text yourself or the tenant from your own number.", "#F22F46"),
      z("WhatsApp", "Reminders to tenants on WhatsApp."),
      z("Discord", "Alerts in a Discord server."),
      z("Telegram", "Alerts in Telegram."),
    ],
  },
  {
    id: "email",
    title: "Email",
    blurb: "Rent reminders, welcome notes and receipts from your own address.",
    items: [
      z("Gmail", "Send from your Gmail when rent is paid or late."),
      z("Microsoft Outlook", "Send from Outlook or Microsoft 365.", "#0078D4"),
      z("Mailchimp", "Add new tenants to an audience."),
      z("SendGrid", "Transactional email at volume.", "#1A82E2"),
      z("Brevo", "Email and SMS campaigns to tenants."),
      z("Kit", "Newsletters for tenants or owners."),
    ],
  },
  {
    id: "calendar",
    title: "Calendar",
    blurb: "Scheduled repairs and lease end dates on your calendar.",
    items: [
      z("Google Calendar", "An event when a repair is scheduled."),
      z("Microsoft Outlook", "The same, in your Outlook calendar.", "#0078D4"),
      z("Calendly", "Let tenants book a walkthrough."),
      z("Apple Calendar", "Through Google or Outlook sync."),
    ],
  },
  {
    id: "crm",
    title: "CRM",
    blurb: "Keep tenants and applicants in the CRM you already run.",
    items: [
      z("HubSpot", "New tenants become contacts."),
      z("Salesforce", "Tenants and units as records.", "#00A1E0"),
      z("Pipedrive", "Applicants as deals.", "#017737"),
      z("Zoho CRM", "Contacts and deals in Zoho."),
      z("Keap", "Contacts and follow-up sequences.", "#36A635"),
      z("ActiveCampaign", "Automations when a tenant moves in or out.", "#356AE6"),
    ],
  },
  {
    id: "files",
    title: "Files and storage",
    blurb: "A copy of every signed lease where you keep your files.",
    items: [
      z("Google Drive", "Signed leases into a folder per property."),
      z("Dropbox", "Same, in Dropbox."),
      z("Box", "Same, in Box."),
      z("OneDrive", "Same, in OneDrive.", "#0078D4"),
      z("Notion", "A page per lease or repair."),
      z("Evernote", "Repair notes and receipts."),
    ],
  },
  {
    id: "forms",
    title: "Forms and surveys",
    blurb: "Applications and move-in checklists that create records in TenantSpark.",
    items: [
      z("Typeform", "A rental application that creates a tenant."),
      z("Jotform", "Same, with Jotform.", "#0A1551"),
      z("Google Forms", "Move-in and move-out checklists."),
      z("Tally", "Free forms that create tenants or repairs.", "#0E1730"),
    ],
  },
  {
    id: "tasks",
    title: "Project and task management",
    blurb: "Repair requests as cards or tasks for whoever fixes things.",
    items: [
      z("Trello", "A card per repair request, moved as it progresses."),
      z("Asana", "A task per repair, assigned to your handyman."),
      z("ClickUp", "Same, in ClickUp."),
      z("monday.com", "Same, in monday.", "#FF3D57"),
      z("Todoist", "Repairs on your to-do list."),
      z("Airtable", "A base of units, tenants and repairs."),
      z("Linear", "For the technical landlord."),
      z("Basecamp", "Repairs as to-dos in a project."),
    ],
  },
  {
    id: "maintenance",
    title: "Repairs and maintenance",
    blurb: "Tracking is built in. Send jobs to the tools your vendors use.",
    items: [
      { name: "TenantSpark repairs", blurb: "Requests with photos, scheduling, updates, costs.", tag: "Built in", href: "/features/maintenance" },
      z("Jobber", "Create a job for your contractor.", "#7DB00E"),
      z("Housecall Pro", "Same, for Housecall Pro.", "#1E88E5"),
    ],
  },
  {
    id: "listings",
    title: "Properties and listings",
    blurb: "Vacant units out to the sites renters search.",
    items: [
      { name: "Zillow", "blurb": "Post a vacancy to Zillow Rentals.", tag: "Planned" },
      { name: "Facebook", "blurb": "Post a vacancy to Marketplace.", tag: "Planned" },
      { name: "Craigslist", "blurb": "A ready-to-paste listing.", tag: "Planned", color: "#5C2E91" },
      z("Webflow", "Vacancies on your own website."),
      z("WordPress", "Same, on WordPress."),
      z("Squarespace", "Same, on Squarespace."),
    ],
  },
  {
    id: "build",
    title: "Build your own",
    blurb: "Everything above runs on the same public API and webhooks you can use directly.",
    items: [
      { name: "REST API", blurb: "Properties, units, tenants, leases, charges, payments, repairs.", tag: "API", href: "/developers", color: "#0E1730" },
      { name: "Webhooks", blurb: "Signed POSTs for 16 event types, with retries.", tag: "API", href: "/developers", color: "#0B6FD6" },
      z("Zapier", "The quickest way to connect anything else."),
    ],
  },
];

export const INTEGRATION_COUNT = CATEGORIES.reduce((n, c) => n + c.items.length, 0);
