import { getCouponRedemptions as getMockCouponRedemptions } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CouponRedemption } from "@/types/app";

type RedemptionRow = {
  id: string;
  offer_id: string;
  merchant_id: string;
  coupon_code: string | null;
  qr_token: string | null;
  redeemed_at: string;
  notes: string | null;
  offers:
    | {
        title: string;
        slug: string;
      }
    | {
        title: string;
        slug: string;
      }[]
    | null;
  merchants:
    | {
        name: string;
        slug: string;
      }
    | {
        name: string;
        slug: string;
      }[]
    | null;
};

function firstOrValue<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapRedemption(row: RedemptionRow): CouponRedemption {
  const offer = firstOrValue(row.offers);
  const merchant = firstOrValue(row.merchants);

  return {
    id: row.id,
    offerId: row.offer_id,
    merchantId: row.merchant_id,
    couponCode: row.coupon_code ?? "",
    qrToken: row.qr_token ?? undefined,
    redeemedAt: row.redeemed_at,
    notes: row.notes ?? undefined,
    offerTitle: offer?.title ?? "Oferta no disponible",
    offerSlug: offer?.slug ?? "",
    merchantName: merchant?.name ?? "Comercio no disponible",
    merchantSlug: merchant?.slug ?? ""
  };
}

export async function getCouponRedemptions(): Promise<CouponRedemption[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return getMockCouponRedemptions();
  }

  const { data, error } = await supabase
    .from("coupon_redemptions")
    .select(
      `
        id,
        offer_id,
        merchant_id,
        coupon_code,
        qr_token,
        redeemed_at,
        notes,
        offers (
          title,
          slug
        ),
        merchants (
          name,
          slug
        )
      `
    )
    .order("redeemed_at", { ascending: false });

  if (error) {
    console.warn(`Could not load coupon redemptions from Supabase: ${error.message}`);
    return getMockCouponRedemptions();
  }

  try {
    return ((data ?? []) as unknown as RedemptionRow[]).map(mapRedemption);
  } catch (mappingError) {
    console.warn("Could not map coupon redemptions from Supabase:", mappingError);
    return getMockCouponRedemptions();
  }
}
