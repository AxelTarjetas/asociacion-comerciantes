"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { isLocalAdminEnabled } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseOptionalDateTime(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return {
      value: null,
      error: false
    };
  }

  const date = new Date(value);

  return {
    value: Number.isNaN(date.getTime()) ? null : date.toISOString(),
    error: Number.isNaN(date.getTime())
  };
}

function redirectWithError(error: string): never {
  redirect(`/admin/campanas/nueva?error=${error}`);
}

export async function createCampaignAction(formData: FormData) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const name = getString(formData, "name");
  const slug = createSlug(getString(formData, "slug"));
  const startsAt = parseOptionalDateTime(formData, "starts_at");
  const endsAt = parseOptionalDateTime(formData, "ends_at");

  if (!name || !slug) {
    redirectWithError("missing-required-fields");
  }

  if (startsAt.error || endsAt.error) {
    redirectWithError("invalid-dates");
  }

  if (
    startsAt.value &&
    endsAt.value &&
    new Date(endsAt.value) <= new Date(startsAt.value)
  ) {
    redirectWithError("invalid-dates");
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    redirectWithError("supabase-not-configured");
  }

  const { data: existingCampaign, error: slugCheckError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (slugCheckError) {
    console.warn(`Could not check campaign slug availability: ${slugCheckError.message}`);
    redirectWithError("create-failed");
  }

  if (existingCampaign) {
    redirectWithError("slug-already-exists");
  }

  const { error } = await supabase.from("campaigns").insert({
    name,
    slug,
    description: optionalString(formData, "description"),
    starts_at: startsAt.value,
    ends_at: endsAt.value,
    is_active: getString(formData, "is_active") === "true"
  });

  if (error) {
    console.warn(`Could not create campaign from local admin: ${error.message}`);
    redirectWithError("create-failed");
  }

  revalidatePath("/admin/campanas");
  revalidatePath("/admin");
  redirect("/admin/campanas?created=1");
}
