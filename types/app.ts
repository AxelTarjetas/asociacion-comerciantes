export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Merchant = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  description: string;
  address: string;
  city?: string;
  phone: string;
  websiteUrl?: string;
  imageUrl?: string;
  isActive?: boolean;
};

export type Offer = {
  id: string;
  slug: string;
  merchantId: string;
  title: string;
  description: string;
  featuredPromotion: string;
  customerBenefit: string;
  businessGoal: string;
  startsAt?: string;
  endsAt: string;
  hasEndsAt?: boolean;
  couponCode: string;
  qrToken?: string;
  maxRedemptions?: number;
  isActive: boolean;
};

export type MerchantWithCategory = Merchant & {
  category: Category;
};

export type OfferWithMerchant = Offer & {
  merchant: MerchantWithCategory;
};

export type CouponRedemption = {
  id: string;
  offerId: string;
  merchantId: string;
  couponCode: string;
  qrToken?: string;
  redeemedAt: string;
  notes?: string;
  offerTitle: string;
  offerSlug: string;
  merchantName: string;
  merchantSlug: string;
};

export type Campaign = {
  id: string;
  name: string;
  slug: string;
  description: string;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CampaignOffer = {
  id: string;
  campaignId: string;
  offerId: string;
  createdAt: string;
};
