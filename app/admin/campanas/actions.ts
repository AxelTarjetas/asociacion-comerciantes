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

function redirectEditWithError(campaignSlug: string, error: string): never {
  redirect(
    `/admin/campanas/${encodeURIComponent(campaignSlug)}/editar?error=${error}`
  );
}

function redirectCampaignWithParam(
  campaignSlug: string,
  key: string,
  value: string
): never {
  const params = new URLSearchParams({ [key]: value });
  redirect(`/admin/campanas/${encodeURIComponent(campaignSlug)}?${params}`);
}

function getSafeCampaignReturnPath(value: string, fallback: string) {
  return value.startsWith("/admin/campanas") ? value : fallback;
}

function appendQueryParam(path: string, key: string, value: string) {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set(key, value);

  return `${pathname}?${params.toString()}`;
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

export async function updateCampaignAction(
  currentSlug: string,
  formData: FormData
) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const name = getString(formData, "name");
  const slug = createSlug(getString(formData, "slug"));
  const startsAt = parseOptionalDateTime(formData, "starts_at");
  const endsAt = parseOptionalDateTime(formData, "ends_at");

  if (!name || !slug) {
    redirectEditWithError(currentSlug, "missing-required-fields");
  }

  if (startsAt.error || endsAt.error) {
    redirectEditWithError(currentSlug, "invalid-dates");
  }

  if (
    startsAt.value &&
    endsAt.value &&
    new Date(endsAt.value) <= new Date(startsAt.value)
  ) {
    redirectEditWithError(currentSlug, "invalid-dates");
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    redirectEditWithError(currentSlug, "supabase-not-configured");
  }

  const { data: currentCampaign, error: currentCampaignError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("slug", currentSlug)
    .maybeSingle();

  if (currentCampaignError) {
    console.warn(
      `Could not load campaign before update: ${currentCampaignError.message}`
    );
    redirectEditWithError(currentSlug, "update-failed");
  }

  if (!currentCampaign) {
    redirectEditWithError(currentSlug, "campaign-not-found");
  }

  const { data: conflictingCampaign, error: slugCheckError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("slug", slug)
    .neq("id", currentCampaign.id)
    .maybeSingle();

  if (slugCheckError) {
    console.warn(
      `Could not check campaign slug before update: ${slugCheckError.message}`
    );
    redirectEditWithError(currentSlug, "update-failed");
  }

  if (conflictingCampaign) {
    redirectEditWithError(currentSlug, "slug-already-exists");
  }

  const { data: updatedCampaign, error } = await supabase
    .from("campaigns")
    .update({
      name,
      slug,
      description: optionalString(formData, "description"),
      starts_at: startsAt.value,
      ends_at: endsAt.value,
      is_active: getString(formData, "is_active") === "true"
    })
    .eq("id", currentCampaign.id)
    .select("id")
    .maybeSingle();

  if (error || !updatedCampaign) {
    console.warn(
      `Could not update campaign from local admin: ${error?.message ?? "campaign not found"}`
    );
    redirectEditWithError(currentSlug, "update-failed");
  }

  revalidatePath("/admin/campanas");
  revalidatePath(`/admin/campanas/${currentSlug}`);
  revalidatePath(`/admin/campanas/${slug}`);
  redirect(`/admin/campanas/${encodeURIComponent(slug)}?updated=1`);
}

export async function addOfferToCampaignAction(
  campaignSlug: string,
  formData: FormData
) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const campaignId = getString(formData, "campaign_id");
  const offerId = getString(formData, "offer_id");

  if (!campaignId || !offerId) {
    redirectCampaignWithParam(campaignSlug, "error", "missing-offer");
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    redirectCampaignWithParam(
      campaignSlug,
      "error",
      "supabase-not-configured"
    );
  }

  const [{ data: campaign, error: campaignError }, { data: offer, error: offerError }] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select("id")
        .eq("id", campaignId)
        .eq("slug", campaignSlug)
        .maybeSingle(),
      supabase.from("offers").select("id").eq("id", offerId).maybeSingle()
    ]);

  if (campaignError || offerError) {
    console.warn(
      "Could not validate campaign offer assignment:",
      campaignError?.message ?? offerError?.message
    );
    redirectCampaignWithParam(campaignSlug, "error", "offer-add-failed");
  }

  if (!campaign || !offer) {
    redirectCampaignWithParam(campaignSlug, "error", "invalid-assignment");
  }

  const { data: existingAssignment, error: assignmentCheckError } = await supabase
    .from("campaign_offers")
    .select("id")
    .eq("campaign_id", campaign.id)
    .eq("offer_id", offer.id)
    .maybeSingle();

  if (assignmentCheckError) {
    console.warn(
      `Could not check campaign offer assignment: ${assignmentCheckError.message}`
    );
    redirectCampaignWithParam(campaignSlug, "error", "offer-add-failed");
  }

  if (existingAssignment) {
    redirectCampaignWithParam(campaignSlug, "alreadyExists", "1");
  }

  const { error } = await supabase.from("campaign_offers").insert({
    campaign_id: campaign.id,
    offer_id: offer.id
  });

  if (error) {
    if (error.code === "23505") {
      redirectCampaignWithParam(campaignSlug, "alreadyExists", "1");
    }

    console.warn(`Could not add offer to campaign: ${error.message}`);
    redirectCampaignWithParam(campaignSlug, "error", "offer-add-failed");
  }

  revalidatePath(`/admin/campanas/${campaignSlug}`);
  redirectCampaignWithParam(campaignSlug, "offerAdded", "1");
}

export async function removeOfferFromCampaignAction(
  campaignSlug: string,
  formData: FormData
) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const campaignOfferId = getString(formData, "campaign_offer_id");

  if (!campaignOfferId) {
    redirectCampaignWithParam(campaignSlug, "error", "remove-offer");
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    redirectCampaignWithParam(
      campaignSlug,
      "error",
      "supabase-not-configured"
    );
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("slug", campaignSlug)
    .maybeSingle();

  if (campaignError) {
    console.warn(
      `Could not validate campaign before removing offer: ${campaignError.message}`
    );
    redirectCampaignWithParam(campaignSlug, "error", "remove-offer");
  }

  if (!campaign) {
    notFound();
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("campaign_offers")
    .select("id")
    .eq("id", campaignOfferId)
    .eq("campaign_id", campaign.id)
    .maybeSingle();

  if (assignmentError) {
    console.warn(
      `Could not validate campaign offer before removal: ${assignmentError.message}`
    );
    redirectCampaignWithParam(campaignSlug, "error", "remove-offer");
  }

  if (!assignment) {
    redirectCampaignWithParam(campaignSlug, "error", "remove-offer");
  }

  const { data: deletedAssignment, error } = await supabase
    .from("campaign_offers")
    .delete()
    .eq("id", assignment.id)
    .eq("campaign_id", campaign.id)
    .select("id")
    .maybeSingle();

  if (error || !deletedAssignment) {
    console.warn(
      `Could not remove offer from campaign: ${error?.message ?? "assignment not found"}`
    );
    redirectCampaignWithParam(campaignSlug, "error", "remove-offer");
  }

  revalidatePath(`/admin/campanas/${campaignSlug}`);
  redirectCampaignWithParam(campaignSlug, "offerRemoved", "1");
}

export async function setCampaignActiveAction(formData: FormData) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const campaignId = getString(formData, "campaign_id");
  const campaignSlug = getString(formData, "campaign_slug");
  const isActive = getString(formData, "is_active");
  const returnTo = getSafeCampaignReturnPath(
    getString(formData, "return_to"),
    campaignSlug ? `/admin/campanas/${campaignSlug}` : "/admin/campanas"
  );
  const errorReturnTo = appendQueryParam(
    returnTo,
    "error",
    "status-update-failed"
  );

  if (
    !campaignId ||
    !campaignSlug ||
    (isActive !== "true" && isActive !== "false")
  ) {
    redirect(errorReturnTo);
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    redirect(appendQueryParam(returnTo, "error", "supabase-not-configured"));
  }

  const { data: updatedCampaign, error } = await supabase
    .from("campaigns")
    .update({
      is_active: isActive === "true"
    })
    .eq("id", campaignId)
    .eq("slug", campaignSlug)
    .select("id")
    .maybeSingle();

  if (error || !updatedCampaign) {
    console.warn(
      `Could not update campaign status from local admin: ${error?.message ?? "campaign not found"}`
    );
    redirect(errorReturnTo);
  }

  revalidatePath("/admin/campanas");
  revalidatePath(`/admin/campanas/${campaignSlug}`);
  redirect(returnTo);
}
