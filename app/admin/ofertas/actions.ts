"use server";

import { notFound, redirect } from "next/navigation";
import { isLocalAdminEnabled } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminMerchantOption = {
  id: string;
  name: string;
  slug: string;
};

type AdminMerchantsResult =
  | {
      merchants: AdminMerchantOption[];
      error: null;
    }
  | {
      merchants: [];
      error: "admin-disabled" | "supabase-not-configured" | "merchants-load-failed";
    };

type OriginalOfferRow = {
  merchant_id: string;
  title: string;
  slug: string;
  description: string | null;
  featured_promotion: string | null;
  customer_benefit: string | null;
  business_goal: string | null;
  coupon_code: string | null;
  starts_at: string | null;
  ends_at: string | null;
  max_redemptions: number | null;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

function optionalNumber(formData: FormData, key: string) {
  const value = getString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function optionalDateTime(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value ? new Date(value).toISOString() : null;
}

function parseOptionalPositiveInteger(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return {
      value: null,
      error: false
    };
  }

  const parsed = Number(value);

  return {
    value: Number.isInteger(parsed) && parsed > 0 ? parsed : null,
    error: !Number.isInteger(parsed) || parsed <= 0
  };
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

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function redirectWithError(error: string): never {
  redirect(`/admin/ofertas/nueva?error=${error}`);
}

function redirectEditWithError(slug: string, error: string): never {
  redirect(`/admin/ofertas/${slug}/editar?error=${error}`);
}

async function findAvailableOfferIdentity(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  baseSlug: string
) {
  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;
    const qrToken = `qr-${slug}`;
    const { data, error } = await supabase
      .from("offers")
      .select("id")
      .or(`slug.eq.${slug},qr_token.eq.${qrToken}`)
      .limit(1);

    if (error) {
      console.warn(`Could not check offer slug availability: ${error.message}`);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        slug,
        qrToken
      };
    }
  }

  return null;
}

async function findAvailableDuplicateOfferIdentity(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  originalSlug: string
) {
  const baseSlug = `${createSlug(originalSlug)}-copia`;

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;
    const qrToken = `qr-${slug}`;
    const { data, error } = await supabase
      .from("offers")
      .select("id")
      .or(`slug.eq.${slug},qr_token.eq.${qrToken}`)
      .limit(1);

    if (error) {
      console.warn(
        `Could not check duplicate offer slug availability: ${error.message}`
      );
      return null;
    }

    if (!data || data.length === 0) {
      return {
        slug,
        qrToken
      };
    }
  }

  return null;
}

async function isOfferSlugAvailableForUpdate(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  slug: string,
  currentOfferId: string
) {
  const { data, error } = await supabase
    .from("offers")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.warn(`Could not check offer slug availability: ${error.message}`);
    return false;
  }

  return !data || data.id === currentOfferId;
}

export async function getAdminMerchants(): Promise<AdminMerchantsResult> {
  if (!isLocalAdminEnabled()) {
    return {
      merchants: [],
      error: "admin-disabled"
    };
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      merchants: [],
      error: "supabase-not-configured"
    };
  }

  const { data, error } = await supabase
    .from("merchants")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.warn(`Could not load admin merchants: ${error.message}`);
    return {
      merchants: [],
      error: "merchants-load-failed"
    };
  }

  return {
    merchants: data ?? [],
    error: null
  };
}

export async function createOfferAction(formData: FormData) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const merchantId = getString(formData, "merchant_id");
  const title = getString(formData, "title");
  const baseSlug = createSlug(title);
  const couponCode = getString(formData, "coupon_code").toUpperCase();

  if (!merchantId || !title || !baseSlug || !couponCode) {
    redirectWithError("missing-required-fields");
  }

  const startsAt = optionalDateTime(formData, "starts_at");
  const endsAt = optionalDateTime(formData, "ends_at");

  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    redirectWithError("invalid-dates");
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    redirectWithError("supabase-not-configured");
  }

  const offerIdentity = await findAvailableOfferIdentity(supabase, baseSlug);

  if (!offerIdentity) {
    redirectWithError("slug-unavailable");
  }

  const { error } = await supabase.from("offers").insert({
    merchant_id: merchantId,
    title,
    slug: offerIdentity.slug,
    description: optionalString(formData, "description"),
    featured_promotion: optionalString(formData, "featured_promotion"),
    customer_benefit: optionalString(formData, "customer_benefit"),
    business_goal: optionalString(formData, "business_goal"),
    coupon_code: couponCode,
    qr_token: offerIdentity.qrToken,
    starts_at: startsAt,
    ends_at: endsAt,
    max_redemptions: optionalNumber(formData, "max_redemptions"),
    is_active: getString(formData, "is_active") === "true"
  });

  if (error) {
    console.warn(`Could not create offer from local admin: ${error.message}`);
    redirectWithError("create-failed");
  }

  redirect("/admin/ofertas");
}

export async function updateOfferAction(currentSlug: string, formData: FormData) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const merchantId = getString(formData, "merchant_id");
  const title = getString(formData, "title");
  const slug = createSlug(getString(formData, "slug"));
  const couponCode = optionalString(formData, "coupon_code")?.toUpperCase() ?? null;
  const startsAt = parseOptionalDateTime(formData, "starts_at");
  const endsAt = parseOptionalDateTime(formData, "ends_at");
  const maxRedemptions = parseOptionalPositiveInteger(formData, "max_redemptions");

  if (!merchantId || !title || !slug) {
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

  if (maxRedemptions.error) {
    redirectEditWithError(currentSlug, "invalid-max-redemptions");
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    redirectEditWithError(currentSlug, "supabase-not-configured");
  }

  const { data: currentOffer, error: currentOfferError } = await supabase
    .from("offers")
    .select("id")
    .eq("slug", currentSlug)
    .maybeSingle();

  if (currentOfferError) {
    console.warn(`Could not load offer before update: ${currentOfferError.message}`);
    redirectEditWithError(currentSlug, "update-failed");
  }

  if (!currentOffer) {
    redirectEditWithError(currentSlug, "offer-not-found");
  }

  const slugAvailable = await isOfferSlugAvailableForUpdate(
    supabase,
    slug,
    currentOffer.id
  );

  if (!slugAvailable) {
    redirectEditWithError(currentSlug, "slug-unavailable");
  }

  const { error } = await supabase
    .from("offers")
    .update({
      merchant_id: merchantId,
      title,
      slug,
      description: optionalString(formData, "description"),
      featured_promotion: optionalString(formData, "featured_promotion"),
      customer_benefit: optionalString(formData, "customer_benefit"),
      business_goal: optionalString(formData, "business_goal"),
      coupon_code: couponCode,
      starts_at: startsAt.value,
      ends_at: endsAt.value,
      max_redemptions: maxRedemptions.value,
      is_active: getString(formData, "is_active") === "true"
    })
    .eq("id", currentOffer.id);

  if (error) {
    console.warn(`Could not update offer from local admin: ${error.message}`);
    redirectEditWithError(currentSlug, "update-failed");
  }

  redirect(`/admin/ofertas/${slug}?updated=1`);
}

export async function duplicateOfferAction(originalSlug: string) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    redirect(`/admin/ofertas/${originalSlug}?error=supabase-not-configured`);
  }

  const { data: originalOffer, error: originalOfferError } = await supabase
    .from("offers")
    .select(
      `
        merchant_id,
        title,
        slug,
        description,
        featured_promotion,
        customer_benefit,
        business_goal,
        coupon_code,
        starts_at,
        ends_at,
        max_redemptions
      `
    )
    .eq("slug", originalSlug)
    .maybeSingle();

  if (originalOfferError) {
    console.warn(
      `Could not load offer before duplication: ${originalOfferError.message}`
    );
    redirect(`/admin/ofertas/${originalSlug}?error=duplicate-failed`);
  }

  if (!originalOffer) {
    notFound();
  }

  const sourceOffer = originalOffer as OriginalOfferRow;
  const duplicateIdentity = await findAvailableDuplicateOfferIdentity(
    supabase,
    sourceOffer.slug
  );

  if (!duplicateIdentity) {
    redirect(`/admin/ofertas/${originalSlug}?error=slug-unavailable`);
  }

  const { error } = await supabase.from("offers").insert({
    merchant_id: sourceOffer.merchant_id,
    title: `Copia de ${sourceOffer.title}`,
    slug: duplicateIdentity.slug,
    description: sourceOffer.description,
    featured_promotion: sourceOffer.featured_promotion,
    customer_benefit: sourceOffer.customer_benefit,
    business_goal: sourceOffer.business_goal,
    coupon_code: sourceOffer.coupon_code,
    qr_token: duplicateIdentity.qrToken,
    starts_at: sourceOffer.starts_at,
    ends_at: sourceOffer.ends_at,
    max_redemptions: sourceOffer.max_redemptions,
    is_active: false
  });

  if (error) {
    console.warn(`Could not duplicate offer from local admin: ${error.message}`);
    redirect(`/admin/ofertas/${originalSlug}?error=duplicate-failed`);
  }

  redirect(`/admin/ofertas/${duplicateIdentity.slug}?duplicated=1`);
}
