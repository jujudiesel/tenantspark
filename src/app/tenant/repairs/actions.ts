"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/tenant";
import { str } from "@/lib/data";
import { isImage, sanitizeFileName } from "@/lib/maintenance";

const BUCKET = "maintenance-photos";

export async function createRequest(formData: FormData) {
  const { supabase, tenant, user } = await requireTenant();
  if (!tenant) redirect("/tenant");
  const back = (msg: string) => redirect(`/tenant/repairs/new?error=${encodeURIComponent(msg)}`);

  const title = str(formData.get("title"));
  if (!title || title.length < 3) back("Tell us what's wrong in a few words.");

  const { data: id, error } = (await supabase.rpc("create_tenant_request", {
    p_title: title,
    p_description: str(formData.get("description")),
    p_location: str(formData.get("location")),
    p_urgency: str(formData.get("urgency")) ?? "routine",
    p_enter: formData.get("permission_to_enter") === "yes",
  })) as { data: string | null; error: { message: string } | null };
  if (error || !id) back(error?.message.replace(/^.*?: /, "") ?? "Could not send the request.");

  // Photos are optional. A bad photo shouldn't lose the request.
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 6);
  for (const f of files) {
    if (!isImage(f) || f.size > 10 * 1024 * 1024) continue;
    const path = `${tenant.account_id}/${id}/${Date.now()}-${sanitizeFileName(f.name)}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type || "image/jpeg" });
    if (!upErr) await supabase.rpc("add_tenant_photo", { r: id, p_path: path, p_type: f.type || "image/jpeg" });
  }
  void user;
  revalidatePath("/tenant");
  revalidatePath("/tenant/repairs");
  redirect(`/tenant/repairs/${id}?sent=1`);
}

export async function addTenantNote(formData: FormData) {
  const { supabase, tenant } = await requireTenant();
  if (!tenant) redirect("/tenant");
  const id = String(formData.get("request_id"));
  const body = str(formData.get("body"));
  if (!body) redirect(`/tenant/repairs/${id}`);
  await supabase.rpc("add_tenant_note", { r: id, p_body: body });
  revalidatePath(`/tenant/repairs/${id}`);
  redirect(`/tenant/repairs/${id}`);
}

export async function addTenantPhotos(formData: FormData) {
  const { supabase, tenant } = await requireTenant();
  if (!tenant) redirect("/tenant");
  const id = String(formData.get("request_id"));
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 6);
  for (const f of files) {
    if (!isImage(f) || f.size > 10 * 1024 * 1024) continue;
    const path = `${tenant.account_id}/${id}/${Date.now()}-${sanitizeFileName(f.name)}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type || "image/jpeg" });
    if (!upErr) await supabase.rpc("add_tenant_photo", { r: id, p_path: path, p_type: f.type || "image/jpeg" });
  }
  revalidatePath(`/tenant/repairs/${id}`);
  redirect(`/tenant/repairs/${id}`);
}
