"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectToOffer(slug: string, query: string): never {
  redirect(`/ofertas/${encodeURIComponent(slug)}?${query}`);
}

export async function redeemOfferAction(formData: FormData) {
  const offerSlug = getString(formData, "offer_slug");

  if (!offerSlug) {
    redirect("/ofertas?error=redeem-failed");
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    redirectToOffer(offerSlug, "error=supabase-not-configured");
  }

  const now = new Date().toISOString();
  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("id, merchant_id, coupon_code, qr_token, max_redemptions")
    .eq("slug", offerSlug)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .maybeSingle();

  if (offerError) {
    console.warn(`Could not load offer for redemption: ${offerError.message}`);
    redirectToOffer(offerSlug, "error=offer-not-available");
  }

  if (!offer?.id || !offer.merchant_id) {
    redirectToOffer(offerSlug, "error=offer-not-available");
  }

  if (offer.max_redemptions !== null) {
    const { count, error: countError } = await supabase
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("offer_id", offer.id);

    if (countError) {
      console.warn(`Could not count redemptions: ${countError.message}`);
      redirectToOffer(offerSlug, "error=redeem-failed");
    }

    if ((count ?? 0) >= offer.max_redemptions) {
      redirectToOffer(offerSlug, "error=redemption-limit-reached");
    }
  }

  const { error } = await supabase.from("coupon_redemptions").insert({
    offer_id: offer.id,
    merchant_id: offer.merchant_id,
    coupon_code: offer.coupon_code ?? null,
    qr_token: offer.qr_token ?? null,
    notes: "Canje desde ficha pública de oferta"
  });

  if (error) {
    console.warn(`Could not redeem offer: ${error.message}`);
    redirectToOffer(offerSlug, "error=redeem-failed");
  }

  redirectToOffer(offerSlug, "redeemed=1");
}
