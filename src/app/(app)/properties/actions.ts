"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount, dollarsToCents, num, str } from "@/lib/data";

export async function createProperty(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const name = str(formData.get("name"));
  const address_line1 = str(formData.get("address_line1"));
  const city = str(formData.get("city"));
  const state = str(formData.get("state"));
  const zip = str(formData.get("zip"));
  if (!address_line1 || !city || !state || !zip) {
    redirect(`/properties/new?error=${encodeURIComponent("Address, city, state and zip are required.")}`);
  }

  const { data, error } = await supabase
    .from("properties")
    .insert({
      account_id: account.id,
      name: name ?? address_line1,
      address_line1,
      address_line2: str(formData.get("address_line2")),
      city,
      state: state.toUpperCase().slice(0, 2),
      zip,
      property_type: str(formData.get("property_type")) ?? "single_family",
      notes: str(formData.get("notes")),
    })
    .select("id")
    .single();

  if (error || !data) redirect(`/properties/new?error=${encodeURIComponent(error?.message ?? "Could not save.")}`);

  // A single-family home is one unit. Create it so the landlord doesn't have to.
  const type = str(formData.get("property_type")) ?? "single_family";
  if (type === "single_family" || type === "condo" || type === "townhouse") {
    await supabase.from("units").insert({
      account_id: account.id,
      property_id: data.id,
      label: "Whole home",
      bedrooms: num(formData.get("bedrooms")),
      bathrooms: num(formData.get("bathrooms")),
      market_rent_cents: dollarsToCents(formData.get("market_rent")),
    });
  }

  revalidatePath("/properties");
  revalidatePath("/dashboard");
  redirect(`/properties/${data.id}`);
}

export async function updateProperty(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  const address_line1 = str(formData.get("address_line1"));
  const city = str(formData.get("city"));
  const state = str(formData.get("state"));
  const zip = str(formData.get("zip"));
  if (!address_line1 || !city || !state || !zip) {
    redirect(`/properties/${id}/edit?error=${encodeURIComponent("Address, city, state and zip are required.")}`);
  }
  const { error } = await supabase
    .from("properties")
    .update({
      name: str(formData.get("name")) ?? address_line1,
      address_line1,
      address_line2: str(formData.get("address_line2")),
      city,
      state: state.toUpperCase().slice(0, 2),
      zip,
      property_type: str(formData.get("property_type")) ?? "single_family",
      notes: str(formData.get("notes")),
    })
    .eq("id", id)
    .eq("account_id", account.id);
  if (error) redirect(`/properties/${id}/edit?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/properties/${id}`);
  revalidatePath("/properties");
  redirect(`/properties/${id}`);
}

export async function deleteProperty(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  await supabase.from("properties").delete().eq("id", id).eq("account_id", account.id);
  revalidatePath("/properties");
  revalidatePath("/dashboard");
  redirect("/properties");
}

export async function createUnit(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const property_id = String(formData.get("property_id"));
  const label = str(formData.get("label"));
  if (!label) redirect(`/properties/${property_id}?error=${encodeURIComponent("Give the unit a name, like 2B or Upstairs.")}`);

  const { error } = await supabase.from("units").insert({
    account_id: account.id,
    property_id,
    label,
    bedrooms: num(formData.get("bedrooms")),
    bathrooms: num(formData.get("bathrooms")),
    square_feet: num(formData.get("square_feet")),
    market_rent_cents: dollarsToCents(formData.get("market_rent")),
  });
  if (error) {
    const msg = error.code === "23505" ? `There is already a unit called ${label} at this property.` : error.message;
    redirect(`/properties/${property_id}?error=${encodeURIComponent(msg)}`);
  }
  revalidatePath(`/properties/${property_id}`);
  revalidatePath("/dashboard");
  redirect(`/properties/${property_id}`);
}

export async function updateUnit(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  const property_id = String(formData.get("property_id"));
  const label = str(formData.get("label"));
  if (!label) redirect(`/properties/${property_id}/units/${id}?error=${encodeURIComponent("The unit needs a name.")}`);
  const { error } = await supabase
    .from("units")
    .update({
      label,
      bedrooms: num(formData.get("bedrooms")),
      bathrooms: num(formData.get("bathrooms")),
      square_feet: num(formData.get("square_feet")),
      market_rent_cents: dollarsToCents(formData.get("market_rent")),
      notes: str(formData.get("notes")),
    })
    .eq("id", id)
    .eq("account_id", account.id);
  if (error) redirect(`/properties/${property_id}/units/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/properties/${property_id}`);
  redirect(`/properties/${property_id}`);
}

export async function deleteUnit(formData: FormData) {
  const { supabase, account } = await requireAccount();
  const id = String(formData.get("id"));
  const property_id = String(formData.get("property_id"));
  await supabase.from("units").delete().eq("id", id).eq("account_id", account.id);
  revalidatePath(`/properties/${property_id}`);
  revalidatePath("/dashboard");
  redirect(`/properties/${property_id}`);
}
