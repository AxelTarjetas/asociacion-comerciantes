import { isLocalAdminEnabled } from "@/lib/admin";
import { getOffers } from "@/lib/queries/offers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Campaign, CampaignOffer, OfferWithMerchant } from "@/types/app";

type CampaignRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CampaignOfferRow = {
  id: string;
  campaign_id: string;
  offer_id: string;
  created_at: string;
};

const campaignSelect = `
  id,
  name,
  slug,
  description,
  starts_at,
  ends_at,
  is_active,
  created_at,
  updated_at
`;

function mapCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapCampaignOffer(row: CampaignOfferRow): CampaignOffer {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    offerId: row.offer_id,
    createdAt: row.created_at
  };
}

export async function getCampaignBySlug(
  slug: string
): Promise<Campaign | undefined> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    console.warn("Supabase public client is not configured. Returning no campaign.");
    return undefined;
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("campaigns")
    .select(campaignSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .maybeSingle();

  if (error) {
    console.warn(`Could not load public campaign from Supabase: ${error.message}`);
    return undefined;
  }

  return data ? mapCampaign(data as CampaignRow) : undefined;
}

export async function getCampaignOffersBySlug(
  slug: string
): Promise<OfferWithMerchant[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    console.warn(
      "Supabase public client is not configured. Returning no campaign offers."
    );
    return [];
  }

  const campaign = await getCampaignBySlug(slug);

  if (!campaign) {
    return [];
  }

  const { data, error } = await supabase
    .from("campaign_offers")
    .select("offer_id")
    .eq("campaign_id", campaign.id);

  if (error) {
    console.warn(
      `Could not load public campaign offers from Supabase: ${error.message}`
    );
    return [];
  }

  const offerIds = new Set(
    ((data ?? []) as Array<{ offer_id: string }>).map((row) => row.offer_id)
  );

  if (offerIds.size === 0) {
    return [];
  }

  const publicOffers = await getOffers();
  return publicOffers.filter((offer) => offerIds.has(offer.id));
}

export async function getAdminCampaigns(): Promise<Campaign[]> {
  if (!isLocalAdminEnabled()) {
    console.warn("Local admin is disabled. Returning no campaigns.");
    return [];
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn("Supabase admin is not configured. Returning no campaigns.");
    return [];
  }

  const { data, error } = await supabase
    .from("campaigns")
    .select(campaignSelect)
    .order("starts_at", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.warn(`Could not load admin campaigns from Supabase: ${error.message}`);
    return [];
  }

  return ((data ?? []) as CampaignRow[]).map(mapCampaign);
}

export async function getAdminCampaignBySlug(
  slug: string
): Promise<Campaign | undefined> {
  if (!isLocalAdminEnabled()) {
    console.warn("Local admin is disabled. Returning no campaign detail.");
    return undefined;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn("Supabase admin is not configured. Returning no campaign detail.");
    return undefined;
  }

  const { data, error } = await supabase
    .from("campaigns")
    .select(campaignSelect)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.warn(`Could not load admin campaign from Supabase: ${error.message}`);
    return undefined;
  }

  return data ? mapCampaign(data as CampaignRow) : undefined;
}

export async function getAdminCampaignOffers(
  campaignId: string
): Promise<CampaignOffer[]> {
  if (!isLocalAdminEnabled()) {
    console.warn("Local admin is disabled. Returning no campaign offers.");
    return [];
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn("Supabase admin is not configured. Returning no campaign offers.");
    return [];
  }

  const { data, error } = await supabase
    .from("campaign_offers")
    .select("id, campaign_id, offer_id, created_at")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn(
      `Could not load admin campaign offers from Supabase: ${error.message}`
    );
    return [];
  }

  return ((data ?? []) as CampaignOfferRow[]).map(mapCampaignOffer);
}
