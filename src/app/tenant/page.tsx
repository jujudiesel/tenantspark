import Link from "next/link";
import { requireTenant, nextDueDate } from "@/lib/tenant";
import { Card, Pill, fmtDate, moneyExact } from "@/components/ui";
import { STATUS } from "@/lib/maintenance";

export const metadata = { title: "Tenant portal" };

export default async function TenantHome() {
  const { supabase, user, tenant, leases, landlord } = await requireTenant();

  if (!tenant) {
    return (
      <Card className="p-7 flex flex-col gap-3">
        <h1 className="font-display font-semibold text-2xl">You&apos;re signed in</h1>
        <p className="text-[15px] leading-relaxed text-ink-2">
          {user.email} isn&apos;t connected to a lease yet. If your landlord sent you an invite link, open it while signed in and we&apos;ll connect it.
        </p>
      </Card>
    );
  }

  const active = leases.find((l) => l.status === "active");
  const [{ data: toSign }, { data: openCharges }, { data: settings }, { data: repairs }] = active
    ? await Promise.all([
        supabase.from("lease_documents").select("id, title").eq("lease_id", active.id).eq("status", "sent"),
        supabase.from("rent_charges").select("id, due_date, amount_cents, late_fee_cents, paid_cents, description, payments(status)").eq("lease_id", active.id).in("status", ["due", "partial"]).order("due_date").limit(1),
        supabase.from("payment_settings").select("charges_enabled").eq("account_id", tenant.account_id).maybeSingle(),
        supabase.from("maintenance_requests").select("id, title, status, scheduled_for").in("status", ["new", "scheduled", "in_progress"]).order("created_at", { ascending: false }).limit(3),
      ])
    : [{ data: [] as { id: string; title: string }[] }, { data: [] }, { data: null }, { data: [] }];
  const openRepairs = (repairs ?? []) as { id: string; title: string; status: string; scheduled_for: string | null }[];

  const nextCharge = openCharges?.[0];
  const owed = nextCharge ? nextCharge.amount_cents + nextCharge.late_fee_cents - nextCharge.paid_cents : 0;
  const processing = nextCharge ? ((nextCharge.payments as unknown as { status: string }[]) ?? []).some((p) => p.status === "pending") : false;
  const online = Boolean(settings?.charges_enabled);
  const due = active ? nextDueDate(active.rent_due_day) : null;
  const first = tenant.full_name.split(" ")[0];

  return (
    <>
      <div className="flex flex-col gap-0.5">
        <h1 className="font-display font-semibold text-[26px] leading-tight">Hi {first}</h1>
        {active ? (
          <p className="text-sm text-muted">
            {active.units.properties.address_line1}{active.units.label !== "Whole home" ? `, ${active.units.label}` : ""}
          </p>
        ) : null}
      </div>

      {toSign && toSign.length > 0 ? (
        <Link href={`/tenant/sign/${toSign[0].id}`} className="flex items-center justify-between gap-3 p-5 rounded-[14px] bg-navy text-white">
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold">Your lease is ready to sign</span>
            <span className="text-sm text-[#C3CBDD]">{toSign[0].title}. Takes about a minute.</span>
          </span>
          <span className="flex-none px-4 py-2.5 rounded-lg bg-spark text-navy text-sm font-bold">Sign now</span>
        </Link>
      ) : null}

      {active ? (
        <section className="bg-navy rounded-[18px] p-6 flex flex-col gap-4 text-white">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[#C3CBDD]">{nextCharge ? nextCharge.description : "Monthly rent"}</span>
            <span className="font-display font-semibold text-[46px] leading-none tabular">{moneyExact(nextCharge ? owed : active.rent_cents)}</span>
            <span className="text-sm text-[#C3CBDD]">
              {nextCharge ? `Due ${fmtDate(nextCharge.due_date)}` : `Next due ${due!.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`}
            </span>
          </div>
          {nextCharge && online && !processing ? (
            <Link href="/tenant/pay" className="min-h-[50px] inline-flex items-center justify-center rounded-[10px] bg-spark text-navy text-base font-bold">Pay rent</Link>
          ) : processing ? (
            <div className="p-4 rounded-[10px] bg-navy-2 text-sm text-[#DCE2EE]"><span className="font-semibold text-white">Payment processing.</span> Bank transfers take 2 to 4 business days.</div>
          ) : !online ? (
            <div className="flex flex-col gap-2 p-4 rounded-[10px] bg-navy-2 text-sm text-[#DCE2EE]">
              <span className="font-semibold text-white">Online payments aren&apos;t set up yet</span>
              <span>Pay {landlord ?? "your landlord"} the way you do now.</span>
            </div>
          ) : (
            <div className="p-4 rounded-[10px] bg-navy-2 text-sm text-[#DCE2EE]">Nothing due right now.</div>
          )}
        </section>
      ) : (
        <Card className="p-6 flex flex-col gap-2">
          <h2 className="font-display font-semibold text-xl">No active lease</h2>
          <p className="text-[15px] text-ink-2">Your landlord hasn&apos;t set up a current lease for you yet.</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/tenant/repairs/new" className="box-border min-h-[84px] p-4 rounded-[14px] bg-white border border-line flex flex-col justify-between gap-2 text-sm font-semibold">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#0B6FD6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]"><path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18l3 3 6.5-6.5a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.1-.7-.7-2.1z" /></svg>
          Request a repair
        </Link>
        <Link href="/tenant/lease" className="box-border min-h-[84px] p-4 rounded-[14px] bg-white border border-line flex flex-col justify-between gap-2 text-sm font-semibold">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#0B6FD6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]"><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 13h6M9 17h6" /></svg>
          Lease details
        </Link>
        <Link href="/tenant/documents" className="box-border min-h-[84px] p-4 rounded-[14px] bg-white border border-line flex flex-col justify-between gap-2 text-sm font-semibold">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#0B6FD6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8.5 7.5h7M8.5 11.5h7M8.5 15.5h4" /></svg>
          Documents
        </Link>
        <Link href="/tenant/repairs" className="box-border min-h-[84px] p-4 rounded-[14px] bg-white border border-line flex flex-col justify-between gap-2 text-sm font-semibold">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#0B6FD6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
          My repairs{openRepairs.length ? ` (${openRepairs.length})` : ""}
        </Link>
      </div>

      {openRepairs.length ? (
        <Card>
          <div className="px-5 pt-5 pb-2"><h2 className="text-[15px] font-semibold">Open repairs</h2></div>
          <ul>
            {openRepairs.map((r) => (
              <li key={r.id}>
                <Link href={`/tenant/repairs/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-line-2">
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[15px] font-semibold truncate">{r.title}</span>
                    {r.status === "scheduled" && r.scheduled_for ? <span className="text-[13px] text-muted">Scheduled {fmtDate(r.scheduled_for)}</span> : null}
                  </span>
                  <Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="p-5 flex flex-col gap-1">
        <h2 className="text-[15px] font-semibold">Your landlord</h2>
        <p className="text-[15px] text-ink-2">{landlord}</p>
      </Card>

      {active?.end_date ? (
        <p className="text-[13px] text-muted">Lease runs {fmtDate(active.start_date)} to {fmtDate(active.end_date)}.</p>
      ) : null}
    </>
  );
}
