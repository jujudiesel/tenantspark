import Link from "next/link";
import { requireTenant } from "@/lib/tenant";
import { Button, Card, Field, Notice, Select, Textarea } from "@/components/ui";
import { LOCATIONS } from "@/lib/maintenance";
import { createRequest } from "../actions";

export const metadata = { title: "Request a repair" };

export default async function NewRepairPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { leases } = await requireTenant();
  const active = leases.find((l) => l.status === "active");

  if (!active) {
    return (
      <Card className="p-6 flex flex-col gap-2">
        <h1 className="font-display font-semibold text-2xl">Request a repair</h1>
        <p className="text-[15px] text-ink-2">You need an active lease to send a repair request.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Link href="/tenant/repairs" aria-label="Back to repairs" className="w-11 h-11 -ml-2 inline-flex items-center justify-center text-ink">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]"><path d="M15 5l-7 7 7 7" /></svg>
        </Link>
        <h1 className="font-display font-semibold text-[22px] leading-tight">Request a repair</h1>
      </div>

      <Card className="p-5 sm:p-6">
        <form action={createRequest} className="flex flex-col gap-4" encType="multipart/form-data">
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Field label="What's wrong?" name="title" required placeholder="Kitchen faucet is leaking" autoComplete="off" />
          <Select label="Where is it?" name="location" options={LOCATIONS.map((l) => ({ value: l, label: l }))} />
          <Textarea label="Details" name="description" rows={3} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-photos" className="text-sm font-semibold">Photos <span className="text-muted font-normal">(optional, up to 6)</span></label>
            <input id="f-photos" name="photos" type="file" accept="image/*" multiple className="box-border w-full min-h-12 px-3 py-2.5 rounded-[10px] border border-field-strong bg-white text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-navy file:text-white file:text-sm file:font-semibold" />
            <span className="text-[13px] text-muted">On a phone you can take a photo right here.</span>
          </div>

          <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
            <legend className="text-sm font-semibold mb-2">How urgent is it?</legend>
            {[
              ["routine", "It can wait a few days", "Dripping faucet, sticky door, light out"],
              ["urgent", "Needs attention soon", "No hot water, appliance down, toilet not working"],
              ["emergency", "Emergency, needs help now", "Flooding, no heat in winter, gas smell, no power"],
            ].map(([v, l, hint], i) => (
              <label key={v} className="flex items-start gap-3 min-h-12 px-3.5 py-2.5 rounded-[10px] border border-field bg-white has-[:checked]:border-navy">
                <input type="radio" name="urgency" value={v} defaultChecked={i === 0} className="mt-0.5 w-5 h-5 accent-navy" />
                <span className="flex flex-col"><span className="text-[15px] font-medium">{l}</span><span className="text-[13px] text-muted">{hint}</span></span>
              </label>
            ))}
          </fieldset>
          <p className="text-[13px] text-red-ink">If someone is in danger or you smell gas, call 911 or your gas company first.</p>

          <label className="flex items-center gap-3 min-h-11 text-[15px]">
            <input type="checkbox" name="permission_to_enter" value="yes" defaultChecked className="w-5 h-5 accent-navy" />
            It&apos;s okay to come in if I&apos;m not home
          </label>

          <Button type="submit" className="min-h-[52px] text-base">Send request</Button>
        </form>
      </Card>
    </>
  );
}
