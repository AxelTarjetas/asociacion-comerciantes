import {
  getOfferBySlug as getMockOfferBySlug,
  getOffers as getMockOffers,
  getOffersByMerchantId as getMockOffersByMerchantId
} from "@/lib/mock-data";
import { isLocalAdminEnabled } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, OfferWithMerchant } from "@/types/app";

type OfferMerchantRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  image_url: string | null;
  category_id: string;
  categories: Category | Category[] | null;
};

type OfferRow = {
  id: string;
  merchant_id: string;
  title: string;
  slug: string;
  description: string | null;
  featured_promotion: string | null;
  customer_benefit: string | null;
  business_goal: string | null;
  coupon_code: string | null;
  qr_token: string | null;
  starts_at: string | null;
  ends_at: string | null;
  max_redemptions: number | null;
  is_active: boolean;
  merchants: OfferMerchantRow | null;
};

const offerSelect = `
  id,
  merchant_id,
  title,
  slug,
  description,
  featured_promotion,
  customer_benefit,
  business_goal,
  coupon_code,
  qr_token,
  starts_at,
  ends_at,
  max_redemptions,
  is_active,
  merchants (
    id,
    name,
    slug,
    description,
    address,
    phone,
    image_url,
    category_id,
    categories (
      id,
      name,
      slug
    )
  )
`;

function normalizeCategory(category: Category | Category[] | null): Category | null {
  return Array.isArray(category) ? (category[0] ?? null) : category;
}

function mapOffer(row: OfferRow): OfferWithMerchant {
  if (!row.merchants) {
    throw new Error(`Merchant not found for offer ${row.id}`);
  }

  const category = normalizeCategory(row.merchants.categories);
  const fallbackCategory = {
    id: row.merchants.category_id,
    name: "Sin categoría",
    slug: "sin-categoria"
  };

  return {
    id: row.id,
    slug: row.slug,
    merchantId: row.merchant_id,
    title: row.title,
    description: row.description ?? "",
    featuredPromotion: row.featured_promotion ?? "",
    customerBenefit: row.customer_benefit ?? "",
    businessGoal: row.business_goal ?? "",
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? new Date().toISOString(),
    couponCode: row.coupon_code ?? "",
    qrToken: row.qr_token ?? undefined,
    maxRedemptions: row.max_redemptions ?? undefined,
    isActive: row.is_active,
    merchant: {
      id: row.merchants.id,
      slug: row.merchants.slug,
      name: row.merchants.name,
      categoryId: row.merchants.category_id,
      description: row.merchants.description ?? "",
      address: row.merchants.address ?? "",
      phone: row.merchants.phone ?? "",
      imageUrl: row.merchants.image_url ?? undefined,
      category: category ?? fallbackCategory
    }
  };
}

export async function getOffers(): Promise<OfferWithMerchant[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return getMockOffers();
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("offers")
    .select(offerSelect)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("ends_at", { ascending: true });

  if (error) {
    console.warn(`Could not load offers from Supabase: ${error.message}`);
    return getMockOffers();
  }

  try {
    return ((data ?? []) as unknown as OfferRow[]).map(mapOffer);
  } catch (mappingError) {
    console.warn("Could not map offers from Supabase:", mappingError);
    return getMockOffers();
  }
}

export async function getAdminOffers(): Promise<OfferWithMerchant[]> {
  if (!isLocalAdminEnabled()) {
    console.warn("Local admin is disabled. Using mock offers.");
    return getMockOffers();
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn(
      "Supabase admin is not configured. Using mock offers for local admin."
    );
    return getMockOffers();
  }

  const { data, error } = await supabase
    .from("offers")
    .select(offerSelect)
    .order("ends_at", { ascending: true });

  if (error) {
    console.warn(`Could not load admin offers from Supabase: ${error.message}`);
    return getMockOffers();
  }

  try {
    return ((data ?? []) as unknown as OfferRow[]).map(mapOffer);
  } catch (mappingError) {
    console.warn("Could not map admin offers from Supabase:", mappingError);
    return getMockOffers();
  }
}

export async function getAdminOfferBySlug(
  slug: string
): Promise<OfferWithMerchant | undefined> {
  if (!isLocalAdminEnabled()) {
    console.warn("Local admin is disabled. Using mock offer detail.");
    return getMockOfferBySlug(slug);
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn(
      "Supabase admin is not configured. Using mock offer detail for local admin."
    );
    return getMockOfferBySlug(slug);
  }

  const { data, error } = await supabase
    .from("offers")
    .select(offerSelect)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.warn(`Could not load admin offer from Supabase: ${error.message}`);
    return getMockOfferBySlug(slug);
  }

  try {
    return data ? mapOffer(data as unknown as OfferRow) : undefined;
  } catch (mappingError) {
    console.warn("Could not map admin offer from Supabase:", mappingError);
    return getMockOfferBySlug(slug);
  }
}

export async function getOfferBySlug(
  slug: string
): Promise<OfferWithMerchant | undefined> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return getMockOfferBySlug(slug);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("offers")
    .select(offerSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .maybeSingle();

  if (error) {
    console.warn(`Could not load offer from Supabase: ${error.message}`);
    return getMockOfferBySlug(slug);
  }

  try {
    return data ? mapOffer(data as unknown as OfferRow) : undefined;
  } catch (mappingError) {
    console.warn("Could not map offer from Supabase:", mappingError);
    return getMockOfferBySlug(slug);
  }
}

export async function getOffersByMerchantId(
  merchantId: string
): Promise<OfferWithMerchant[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return getMockOffersByMerchantId(merchantId);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("offers")
    .select(offerSelect)
    .eq("merchant_id", merchantId)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("ends_at", { ascending: true });

  if (error) {
    console.warn(`Could not load merchant offers from Supabase: ${error.message}`);
    return getMockOffersByMerchantId(merchantId);
  }

  try {
    return ((data ?? []) as unknown as OfferRow[]).map(mapOffer);
  } catch (mappingError) {
    console.warn("Could not map merchant offers from Supabase:", mappingError);
    return getMockOffersByMerchantId(merchantId);
  }
}

export async function getAdminOffersByMerchantId(
  merchantId: string
): Promise<OfferWithMerchant[]> {
  if (!isLocalAdminEnabled()) {
    console.warn("Local admin is disabled. Using mock merchant offers.");
    return getMockOffersByMerchantId(merchantId);
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn(
      "Supabase admin is not configured. Using mock merchant offers for local admin."
    );
    return getMockOffersByMerchantId(merchantId);
  }

  const { data, error } = await supabase
    .from("offers")
    .select(offerSelect)
    .eq("merchant_id", merchantId)
    .order("ends_at", { ascending: true });

  if (error) {
    console.warn(`Could not load admin merchant offers from Supabase: ${error.message}`);
    return getMockOffersByMerchantId(merchantId);
  }

  try {
    return ((data ?? []) as unknown as OfferRow[]).map(mapOffer);
  } catch (mappingError) {
    console.warn("Could not map admin merchant offers from Supabase:", mappingError);
    return getMockOffersByMerchantId(merchantId);
  }
}
