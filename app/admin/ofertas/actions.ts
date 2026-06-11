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
