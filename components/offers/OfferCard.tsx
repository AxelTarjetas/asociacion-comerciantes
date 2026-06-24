import Link from "next/link";
import { OfferVisual } from "@/components/offers/OfferVisual";
import { formatDate } from "@/lib/utils";
import type { OfferWithMerchant } from "@/types/app";

type OfferCardProps = {
  offer: OfferWithMerchant;
  showMerchant?: boolean;
};

export function OfferCard({ offer, showMerchant = true }: OfferCardProps) {
  return (
    <article className="card offer-card offer-card-visual">
      <div className="card-media">
        <Link aria-label={`Ver oferta ${offer.title}`} href={`/ofertas/${offer.slug}`}>
          <OfferVisual offer={offer} />
        </Link>
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
        <Link className="card-primary-action" href={`/ofertas/${offer.slug}`}>
          Ver y canjear
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
