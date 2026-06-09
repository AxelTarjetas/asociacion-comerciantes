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
  phone: string;
  imageUrl?: string;
};

export type Offer = {
  id: string;
  slug: string;
  merchantId: string;
  title: string;
  description: string;
  endsAt: string;
  couponCode: string;
  isActive: boolean;
};

export type MerchantWithCategory = Merchant & {
  category: Category;
};

export type OfferWithMerchant = Offer & {
  merchant: MerchantWithCategory;
};
