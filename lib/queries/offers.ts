import {
  getOfferBySlug as getMockOfferBySlug,
  getOffers as getMockOffers,
  getOffersByMerchantId as getMockOffersByMerchantId
} from "@/lib/mock-data";
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
  ends_at: string | null;
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
  ends_at,
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
    endsAt: row.ends_at ?? new Date().toISOString(),
    couponCode: row.coupon_code ?? "",
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
