import type { OfferWithMerchant } from "@/types/app";

type OfferVisualProps = {
  offer: OfferWithMerchant;
  className?: string;
};

type OfferVisualKind =
  | "food"
  | "coffee"
  | "fashion"
  | "beauty"
  | "entertainment"
  | "services"
  | "local";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function getOfferVisualKind(offer: OfferWithMerchant): OfferVisualKind {
  const context = normalize(
    [
      offer.merchant.category.name,
      offer.title,
      offer.description,
      offer.featuredPromotion,
      offer.customerBenefit
    ].join(" ")
  );

  if (/(cafe|cafeteria|desayuno)/.test(context)) {
    return "coffee";
  }

  if (/(alimentacion|comida|mercado|pan|panaderia|carne|fresco)/.test(context)) {
    return "food";
  }

  if (/(moda|ropa|prenda|textil|complemento)/.test(context)) {
    return "fashion";
  }

  if (/(belleza|peluqueria|estetica|cuidado)/.test(context)) {
    return "beauty";
  }

  if (/(ocio|entretenimiento|entrada|musica|cine|evento)/.test(context)) {
    return "entertainment";
  }

  if (/(servicio|bicicleta|taller|reparacion|gestion|inmobiliaria)/.test(context)) {
    return "services";
  }

  return "local";
}

export function OfferVisual({ offer, className = "" }: OfferVisualProps) {
  const kind = getOfferVisualKind(offer);
  const classes = `offer-visual offer-visual-${kind} ${className}`.trim();

  return (
    <div className={classes}>
      {offer.merchant.imageUrl ? (
        <img alt="" src={offer.merchant.imageUrl} />
      ) : (
        <div className="offer-visual-art" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      )}
      <span className="offer-visual-label">{offer.merchant.category.name}</span>
    </div>
  );
}
