import type {
  Category,
  CouponRedemption,
  Merchant,
  MerchantWithCategory,
  Offer,
  OfferWithMerchant
} from "@/types/app";

export const categories: Category[] = [
  { id: "cat-food", name: "Alimentación", slug: "alimentacion" },
  { id: "cat-fashion", name: "Moda y complementos", slug: "moda" },
  { id: "cat-services", name: "Servicios locales", slug: "servicios" }
];

export const merchants: Merchant[] = [
  {
    id: "mer-01",
    slug: "panaderia-la-plaza",
    name: "Panadería La Plaza",
    categoryId: "cat-food",
    description:
      "Obrador familiar con pan diario, bollería artesana y desayunos para llevar en el centro del barrio.",
    address: "Calle Mayor 14, Local 2",
    phone: "910 245 118",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "mer-02",
    slug: "mercado-verde",
    name: "Mercado Verde",
    categoryId: "cat-food",
    description:
      "Frutería y tienda de producto fresco con proveedores de proximidad y cestas semanales.",
    address: "Avenida de la Estacion 7",
    phone: "910 338 764",
    imageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "mer-03",
    slug: "atelier-norte",
    name: "Atelier Norte",
    categoryId: "cat-fashion",
    description:
      "Boutique independiente con prendas seleccionadas, arreglos sencillos y asesoría cercana.",
    address: "Calle del Olmo 21",
    phone: "910 781 422",
    imageUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "mer-04",
    slug: "bicis-rivera",
    name: "Bicis Rivera",
    categoryId: "cat-services",
    description:
      "Taller de bicicletas para revisiones, reparaciones rápidas y puesta a punto antes de rutas urbanas.",
    address: "Paseo del Rio 5",
    phone: "910 556 390",
    imageUrl:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80"
  }
];

export const offers: Offer[] = [
  {
    id: "off-01",
    slug: "desayuno-local-la-plaza",
    merchantId: "mer-01",
    title: "Desayuno local con 15% de descuento",
    description:
      "Café, tostada o pieza dulce con descuento directo mostrando el cupón en mostrador.",
    featuredPromotion: "15% en desayunos de barrio",
    customerBenefit: "Ahorrar en el desayuno diario y descubrir un obrador cercano.",
    businessGoal: "Aumentar visitas por la mañana y convertir vecinos en clientes recurrentes.",
    endsAt: "2026-07-15",
    couponCode: "PLAZA15",
    isActive: true
  },
  {
    id: "off-02",
    slug: "segunda-barra-mitad-precio",
    merchantId: "mer-01",
    title: "Segunda barra a mitad de precio",
    description:
      "Oferta para compras de pan del día. Válida de lunes a jueves hasta fin de existencias.",
    featuredPromotion: "Segunda barra al 50%",
    customerBenefit: "Llevar más pan fresco pagando menos en compras entre semana.",
    businessGoal: "Impulsar ventas en días de menor afluencia y medir la respuesta por código.",
    endsAt: "2026-06-30",
    couponCode: "PAN2X50",
    isActive: true
  },
  {
    id: "off-03",
    slug: "cesta-temporada-mercado-verde",
    merchantId: "mer-02",
    title: "5 euros en cesta de temporada",
    description:
      "Descuento aplicado en compras superiores a 30 euros en fruta, verdura y producto fresco.",
    featuredPromotion: "5 euros de ahorro directo",
    customerBenefit: "Comprar producto fresco de proximidad con descuento inmediato.",
    businessGoal: "Incrementar el ticket medio y atraer clientes que hacen compra semanal.",
    endsAt: "2026-08-01",
    couponCode: "VERDE5",
    isActive: true
  },
  {
    id: "off-04",
    slug: "arreglo-basico-gratis",
    merchantId: "mer-03",
    title: "Arreglo básico incluido",
    description:
      "Incluye bajo sencillo o ajuste menor al comprar una prenda de nueva temporada.",
    featuredPromotion: "Arreglo básico sin coste",
    customerBenefit: "Salir con una prenda lista para usar y adaptada desde el primer día.",
    businessGoal: "Diferenciar la boutique frente a grandes cadenas y mejorar la conversión.",
    endsAt: "2026-07-05",
    couponCode: "ATELIERFIT",
    isActive: true
  },
  {
    id: "off-05",
    slug: "revision-urbana-bicis",
    merchantId: "mer-04",
    title: "Revisión urbana por 19 euros",
    description:
      "Chequeo de frenos, ruedas y cambios para bicicletas urbanas. Cita previa recomendada.",
    featuredPromotion: "Revisión rápida por precio cerrado",
    customerBenefit: "Circular con más seguridad sin esperar a una avería grande.",
    businessGoal: "Generar nuevas citas de taller y activar servicios recurrentes.",
    endsAt: "2026-07-20",
    couponCode: "RIVERA19",
    isActive: true
  }
];

export const couponRedemptions: CouponRedemption[] = [
  {
    id: "red-01",
    offerId: "off-01",
    merchantId: "mer-01",
    couponCode: "PLAZA15",
    qrToken: "qr-desayuno-local-la-plaza",
    redeemedAt: "2026-06-05T09:42:00.000Z",
    notes: "Canje de ejemplo en mostrador",
    offerTitle: "Desayuno local con 15% de descuento",
    offerSlug: "desayuno-local-la-plaza",
    merchantName: "Panadería La Plaza",
    merchantSlug: "panaderia-la-plaza"
  },
  {
    id: "red-02",
    offerId: "off-03",
    merchantId: "mer-02",
    couponCode: "VERDE5",
    qrToken: "qr-cesta-temporada-mercado-verde",
    redeemedAt: "2026-06-06T18:10:00.000Z",
    notes: "Canje de ejemplo en caja",
    offerTitle: "5 euros en cesta de temporada",
    offerSlug: "cesta-temporada-mercado-verde",
    merchantName: "Mercado Verde",
    merchantSlug: "mercado-verde"
  }
];

export function getMerchantWithCategory(merchant: Merchant): MerchantWithCategory {
  const category = categories.find((item) => item.id === merchant.categoryId);

  if (!category) {
    throw new Error(`Category not found for merchant ${merchant.id}`);
  }

  return {
    ...merchant,
    category
  };
}

export function getMerchants(): MerchantWithCategory[] {
  return merchants.map(getMerchantWithCategory);
}

export function getMerchantBySlug(slug: string): MerchantWithCategory | undefined {
  const merchant = merchants.find((item) => item.slug === slug);
  return merchant ? getMerchantWithCategory(merchant) : undefined;
}

export function getOffers(): OfferWithMerchant[] {
  return offers
    .filter((offer) => offer.isActive)
    .map((offer) => {
      const merchant = merchants.find((item) => item.id === offer.merchantId);

      if (!merchant) {
        throw new Error(`Merchant not found for offer ${offer.id}`);
      }

      return {
        ...offer,
        merchant: getMerchantWithCategory(merchant)
      };
    });
}

export function getOfferBySlug(slug: string): OfferWithMerchant | undefined {
  return getOffers().find((offer) => offer.slug === slug);
}

export function getOffersByMerchantId(merchantId: string): OfferWithMerchant[] {
  return getOffers().filter((offer) => offer.merchantId === merchantId);
}

export function getCouponRedemptions(): CouponRedemption[] {
  return couponRedemptions;
}
