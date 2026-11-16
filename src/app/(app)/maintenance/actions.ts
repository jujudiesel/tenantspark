"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount, dollarsToCents, str } from "@/lib/data";
import { isImage, sanitizeFileName, STATUS } from "@/lib/maintenance";

const BUCKET = "maintenance-photos";

async function landlordName(supabase: Awaited<ReturnType<typeof requireAccount>>["supabase"], userId: string, fallback: string) {
  const { data } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  return data?.full_name?.trim() || fallback;
}

async function addNote(
  supabase: Awaited<ReturnType<typeof requireAccount>>["supabase"],
  opts: { request_id: string; account_id: string; user_id: string; name: string; body: string; visible: boolean; role?: "landlord" | "system" },
) {
  await supabase.from("maintenance_notes").insert({
    request_id: opts.request_id,
    account_id: opts.account_id,
    author_user_id: opts.user_id,
    author_name: opts.name,
    author_role: opts.role ?? "landlord",
    body: opts.body,
    visible_to_tenant: opts.visible,
  });
}

async function uploadPhotos(
  supabase: Awaited<ReturnType<typeof requireAccount>>["supabase"],
  account_id: string,
  request_id: string,
  user_id: string,
  files: FormDataEntryValue[],
) {
  const list = files.filter((f): f is File => f instanceof File && f.size > 0).slice(0, 6);
  for (const f of list) {
    if (!isImage(f) || f.size > 10 * 1024 * 1024) continue;
    const path = `${account_id}/${request_id}/${Date.now()}-${sanitizeFileName(f.name)}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type || "image/jpeg" });
    if (!error) {
      await supabase.from("maintenance_photos").insert({ request_id, account_id, storage_path: path, content_type: f.type || "image/jpeg", uploaded_by: user_id });
    }
  }
}

function refresh(id?: string) {
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  if (id) {
    revalidatePath(`/maintenance/${id}`);
    revalidatePath(`/tenant/repairs/${id}`);
  }
  revalidatePath("/tenant/repairs");
  revalidatePath("/tenant");
}

/** Landlord logs a request themselves (phone call, walk-through, their own inspection). */
export async function createRequest(formData: FormData) {
  const { supabase, account, user } = await requireAccount();
  const back = (msg: string) => redirect(`/maintenance/new?error=${encodeURIComponent(msg)}`);

  const title = str(formData.get("title"));
  const unit_id = str(formData.get("unit_id"));
  const urgency = str(formData.get("urgency")) ?? "routine";
  if (!title || title.length < 3) back("Say what's wrong in a few words.");
  if (!unit_id) back("Pick a unit.");
  if (!["routine", "urgent", "emergency"].includes(urgency)) back("Pick how urgent it is.");

  const { data: unit } = await supabase.from("units").select("id, property_id").eq("id", unit_id!).eq("account_id", account.id).maybeSingle();
  if (!unit) back("Unit not found.");

  // Tie to the active lease on that unit, if there is one, so the tenant sees it in their portal.
  const { data: lease } = await supabase
    .from("leases")
    .select("id, lease_tenants(tenant_id, is_primary)")
    .eq("unit_id", unit!.id)
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lts = (lease?.lease_tenants as { tenant_id: string; is_primary: boolean }[] | undefined) ?? [];
  const tenant_id = lts.find((lt) => lt.is_primary)?.tenant_id ?? lts[0]?.tenant_id ?? null;

  const { data: created, error } = await supabase
    .from("maintenance_requests")
    .insert({
      account_id: account.id,
      property_id: unit!.property_id,
      unit_id: unit!.id,
      lease_id: lease?.id ?? null,
      tenant_id,
      title,
      description: str(formData.get("description")),
      location: str(formData.get("location")),
      urgency,
      permission_to_enter: formData.get("permission_to_enter") === "yes",
      assigned_to: str(formData.get("assigned_to")),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !created) back(error?.message ?? "Could not save the request.");

  const name = await landlordName(supabase, user.id, account.name);
  await addNote(supabase, { request_id: created!.id, account_id: account.id, user_id: user.id, name, body: "Request logged.", visible: true, role: "system" });
  await uploadPhotos(supabase, account.id, created!.id, user.id, formData.getAll("photos"));
  refresh(created!.id);
  redirect(`/maintenance/${created!.id}`);
}

/** Move a request along: new -> scheduled -> in_progress -> done -> closed. Writes a note the tenant can see. */
export async function updateStatus(formData: FormData) {
  const { supabase, account, user } = await requireAccount();
  const id = String(formData.get("request_id"));
  const status = str(formData.get("status"));
  const back = (msg: string) => redirect(`/maintenance/${id}?error=${encodeURIComponent(msg)}`);
  if (!status || !(status in STATUS)) back("Unknown status.");

  const patch: Record<string, unknown> = { status };
  let line = "";
  if (status === "scheduled") {
    const when = str(formData.get("scheduled_for"));
    if (!when) back("Pick a date.");
    patch.scheduled_for = when;
    const who = str(formData.get("assigned_to"));
    if (who) patch.assigned_to = who;
    const [y, m, d] = when!.split("-").map(Number);
    const nice = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    line = `Scheduled for ${nice}${who ? ` with ${who}` : ""}.`;
  } else if (status === "in_progress") {
    line = "Work has started.";
  } else if (status === "done") {
    patch.done_at = new Date().toISOString();
    const cost = dollarsToCents(formData.get("cost"));
    if (cost != null) patch.cost_cents = cost;
    line = str(formData.get("summary")) ?? "Marked done. Let us know if the problem comes back.";
  } else if (status === "closed") {
    line = str(formData.get("summary")) ?? "Closed.";
  } else if (status === "new") {
    patch.scheduled_for = null;
    line = "Reopened.";
  }

  const { error } = await supabase.from("maintenance_requests").update(patch).eq("id", id).eq("account_id", account.id);
  if (error) back(error.message);

  const name = await landlordName(supabase, user.id, account.name);
  await addNote(supabase, { request_id: id, account_id: account.id, user_id: user.id, name, body: line, visible: true });
  refresh(id);
  redirect(`/maintenance/${id}`);
}

/** Edit who's handling it and what it cost without changing status. */
export async function updateDetails(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("request_id"));
  const patch: Record<string, unknown> = {
    assigned_to: str(formData.get("assigned_to")),
    cost_cents: dollarsToCents(formData.get("cost")),
  };
  const urgency = str(formData.get("urgency"));
  if (urgency && ["routine", "urgent", "emergency"].includes(urgency)) patch.urgency = urgency;
  const when = str(formData.get("scheduled_for"));
  if (when !== null) patch.scheduled_for = when || null;
  const { error } = await supabase.from("maintenance_requests").update(patch).eq("id", id).eq("account_id", account.id);
  if (error) redirect(`/maintenance/${id}?error=${encodeURIComponent(error.message)}`);
  refresh(id);
  redirect(`/maintenance/${id}?saved=1`);
}

/** Landlord note. Visible to the tenant unless marked private. */
export async function addLandlordNote(formData: FormData) {
  const { supabase, account, user } = await requireAccount();
  const id = String(formData.get("request_id"));
  const body = str(formData.get("body"));
  if (!body) redirect(`/maintenance/${id}`);
  const visible = formData.get("private") !== "yes";
  const name = await landlordName(supabase, user.id, account.name);
  await addNote(supabase, { request_id: id, account_id: account.id, user_id: user.id, name, body, visible });
  refresh(id);
  redirect(`/maintenance/${id}`);
}

export async function addLandlordPhotos(formData: FormData) {
  const { supabase, account, user } = await requireAccount();
  const id = String(formData.get("request_id"));
  await uploadPhotos(supabase, account.id, id, user.id, formData.getAll("photos"));
  refresh(id);
  redirect(`/maintenance/${id}`);
}

export async function deletePhoto(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("request_id"));
  const photo_id = String(formData.get("photo_id"));
  const { data: photo } = await supabase.from("maintenance_photos").select("storage_path").eq("id", photo_id).eq("account_id", account.id).maybeSingle();
  if (photo) {
    await supabase.storage.from(BUCKET).remove([photo.storage_path]);
    await supabase.from("maintenance_photos").delete().eq("id", photo_id);
  }
  refresh(id);
  redirect(`/maintenance/${id}`);
}
