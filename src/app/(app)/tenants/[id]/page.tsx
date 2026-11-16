import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/data";
import { Button, Card, Notice, PageHeader, Pill, fmtDate, money } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { siteUrl } from "@/lib/site";
import { createInvite, deleteTenant, sendTenantReset } from "../actions";

export default async function TenantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invite?: string; emailed?: string; reset?: string; link?: string; error?: string }>;
}) {
  const { id } = await params;
  const { invite, emailed, reset, link, error } = await searchParams;
  const base = await siteUrl();
  const { supabase, account } = await requireAccount();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*, lease_tenants(leases(id, status, start_date, end_date, rent_cents, deposit_cents, units(id, label, properties(id, name))))")
    .eq("id", id)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!tenant) notFound();

  type L = {
    id: string;
    status: string;
    start_date: string;
    end_date: string | null;
    rent_cents: number;
    deposit_cents: number;
    units: { id: string; label: string; properties: { id: string; name: string } };
  };
  const leases = ((tenant.lease_tenants as unknown as { leases: L }[]) ?? [])
    .map((lt) => lt.leases)
    .filter(Boolean)
    .sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  const active = leases.find((l) => l.status === "active");

  return (
    <>
      <PageHeader
        title={tenant.full_name}
        subtitle={active ? `${active.units.properties.name}, ${active.units.label}` : "No active lease"}
        actions={
          <>
            <Button href={`/tenants/${tenant.id}/edit`} variant="secondary">Edit</Button>
            {!active ? <Button href={`/leases/new?tenant=${tenant.id}`}>Set up a lease</Button> : null}
          </>
        }
      />

      <div className="flex flex-wrap gap-6">
        <Card className="flex-[1_1_300px] min-w-0 px-7 py-6 flex flex-col gap-4">
          <h2 className="font-display font-semibold text-xl">Contact</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted">Email</dt>
              <dd className="font-medium">{tenant.email ? <a href={`mailto:${tenant.email}`} className="hover:text-link">{tenant.email}</a> : <span className="text-muted">Not added</span>}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted">Phone</dt>
              <dd className="font-medium">{tenant.phone ? <a href={`tel:${tenant.phone}`} className="hover:text-link">{tenant.phone}</a> : <span className="text-muted">Not added</span>}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted">Tenant portal</dt>
              <dd>{tenant.user_id ? <Pill tone="blue">Signed up</Pill> : <Pill tone="gray">Not invited yet</Pill>}</dd>
            </div>
          </dl>
          {!tenant.user_id && !active ? (
            <p className="text-[13px] text-muted">Put this tenant on a lease first, then invite them to the portal.</p>
          ) : null}
          {!tenant.user_id && active && !tenant.invited_at ? (
            <form action={createInvite}>
              <input type="hidden" name="id" value={tenant.id} />
              <Button type="submit" variant="secondary">Invite to tenant portal</Button>
            </form>
          ) : null}
          {!tenant.user_id && active && tenant.invited_at && tenant.invite_token ? (
            <div className="flex flex-col gap-3 p-4 rounded-[10px] bg-page">
              {invite ? <Notice tone="success">{emailed ? `Invite sent to ${tenant.email}. The link is below if you want to text it too.` : "Invite ready. Send the link below."}</Notice> : null}
              <p className="text-sm text-ink-2">
                Text or email this link to {tenant.full_name.split(" ")[0]}. They&apos;ll create a login and see their lease.
              </p>
              <code className="block text-[13px] break-all px-3 py-2.5 rounded-lg bg-white border border-line">{`${base}/invite/${tenant.invite_token}`}</code>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={`${base}/invite/${tenant.invite_token}`} />
                {tenant.email ? (
                  <a
                    href={`mailto:${tenant.email}?subject=${encodeURIComponent("Your tenant portal login")}&body=${encodeURIComponent(`Hi ${tenant.full_name.split(" ")[0]},\n\nHere's your link to set up your tenant portal. You can see your lease, what's due, and send repair requests there.\n\n${`${base}/invite/${tenant.invite_token}`}\n\nThanks`)}`}
                    className="inline-flex items-center justify-center min-h-11 px-4.5 rounded-lg text-sm font-semibold bg-white text-ink border border-field hover:bg-page"
                  >
                    Email it
                  </a>
                ) : null}
                {tenant.phone ? (
                  <a
                    href={`sms:${tenant.phone.replace(/[^0-9+]/g, "")}?&body=${encodeURIComponent(`Here's your tenant portal link: ${`${base}/invite/${tenant.invite_token}`}`)}`}
                    className="inline-flex items-center justify-center min-h-11 px-4.5 rounded-lg text-sm font-semibold bg-white text-ink border border-field hover:bg-page"
                  >
                    Text it
                  </a>
                ) : null}
              </div>
              <p className="text-[13px] text-muted">Invited {fmtDate(tenant.invited_at.slice(0, 10))}. The link stops working once they sign up.</p>
            </div>
          ) : null}
          {tenant.user_id ? (
            <div className="flex flex-col gap-3">
              {error ? <Notice tone="error">{error}</Notice> : null}
              {reset === "email" ? <Notice tone="success">Reset email sent to {tenant.email}. The link in it works for an hour.</Notice> : null}
              {reset === "link" && link ? (
                <div className="flex flex-col gap-3 p-4 rounded-[10px] bg-page">
                  <p className="text-sm text-ink-2">Send {tenant.full_name.split(" ")[0]} this link. It lets them choose a new password and works for one hour.</p>
                  <code className="block text-[13px] break-all px-3 py-2.5 rounded-lg bg-white border border-line">{link}</code>
                  <div className="flex flex-wrap gap-2">
                    <CopyButton text={link} />
                    {tenant.email ? (
                      <a
                        href={`mailto:${tenant.email}?subject=${encodeURIComponent("Reset your tenant portal password")}&body=${encodeURIComponent(`Hi ${tenant.full_name.split(" ")[0]},\n\nUse this link to choose a new password for your tenant portal. It works for one hour.\n\n${link}\n\nThanks`)}`}
                        className="inline-flex items-center justify-center min-h-11 px-4.5 rounded-lg text-sm font-semibold bg-white text-ink border border-field hover:bg-page"
                      >
                        Email it
                      </a>
                    ) : null}
                    {tenant.phone ? (
                      <a
                        href={`sms:${tenant.phone.replace(/[^0-9+]/g, "")}?&body=${encodeURIComponent(`Here's a link to reset your tenant portal password (works for 1 hour): ${link}`)}`}
                        className="inline-flex items-center justify-center min-h-11 px-4.5 rounded-lg text-sm font-semibold bg-white text-ink border border-field hover:bg-page"
                      >
                        Text it
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <form action={sendTenantReset} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={tenant.id} />
                <Button type="submit" variant="secondary">Send password reset</Button>
                <span className="text-[13px] text-muted">For when they&apos;re locked out of the portal.</span>
              </form>
            </div>
          ) : null}
        </Card>

        <Card className="flex-[2_1_380px] min-w-0 px-7 py-6 flex flex-col gap-3">
          <h2 className="font-display font-semibold text-xl">Leases</h2>
          {leases.length === 0 ? (
            <p className="text-[15px] text-muted">This tenant isn&apos;t on a lease yet.</p>
          ) : (
            <ul className="flex flex-col">
              {leases.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-line-2 last:border-0">
                  <div className="flex flex-col gap-0.5">
                    <Link href={`/leases/${l.id}`} className="text-sm font-semibold hover:text-link">
                      {l.units.properties.name}, {l.units.label}
                    </Link>
                    <span className="text-[13px] text-muted">
                      {fmtDate(l.start_date)} to {l.end_date ? fmtDate(l.end_date) : "month to month"}. {money(l.rent_cents)}/mo
                    </span>
                  </div>
                  {l.status === "active" ? <Pill tone="blue">Active</Pill> : l.status === "ended" ? <Pill tone="gray">Ended</Pill> : <Pill tone="amber">Draft</Pill>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {tenant.notes ? (
        <Card className="px-7 py-6 flex flex-col gap-2">
          <h2 className="font-display font-semibold text-xl">Notes</h2>
          <p className="text-[15px] leading-relaxed text-ink-2 whitespace-pre-line">{tenant.notes}</p>
        </Card>
      ) : null}

      <details className="max-w-[640px]">
        <summary className="cursor-pointer text-sm text-muted select-none">Remove this tenant</summary>
        <form action={deleteTenant} className="mt-3 flex flex-wrap items-center gap-3 p-4 rounded-[10px] bg-red-bg">
          <input type="hidden" name="id" value={tenant.id} />
          <p className="text-sm text-red-ink flex-1 min-w-[200px]">Removes the tenant and takes them off any leases. It can&apos;t be undone.</p>
          <Button type="submit" variant="danger">Delete tenant</Button>
        </form>
      </details>
    </>
  );
}
