import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { OfferWithMerchant } from "@/types/app";

type OfferCardProps = {
  offer: OfferWithMerchant;
  showMerchant?: boolean;
};

export function OfferCard({ offer, showMerchant = true }: OfferCardProps) {
  return (
    <article className="card offer-card">
      <div className="card-media">
        {offer.merchant.imageUrl ? (
          <img
            className="card-image"
            src={offer.merchant.imageUrl}
            alt={offer.merchant.name}
          />
        ) : (
          <div className="card-image-placeholder" aria-hidden="true">
            {offer.merchant.name.slice(0, 1)}
          </div>
        )}
        <span className="card-floating-badge">Oferta</span>
      </div>
      <div className="card-body">
        <span className="card-meta">
          {showMerchant ? offer.merchant.name : offer.merchant.category.name}
        </span>
        <h2>
          <Link href={`/ofertas/${offer.slug}`}>{offer.title}</Link>
        </h2>
        {offer.featuredPromotion ? (
          <p className="offer-highlight">{offer.featuredPromotion}</p>
        ) : null}
        {offer.customerBenefit ? <p className="card-summary">{offer.customerBenefit}</p> : null}
        <div className="card-footer">
          <span>{offer.hasEndsAt === false ? "Sin fecha límite" : `Hasta ${formatDate(offer.endsAt)}`}</span>
          {offer.couponCode ? <span className="code-badge">{offer.couponCode}</span> : null}
        </div>
      </div>
    </article>
  );
}
