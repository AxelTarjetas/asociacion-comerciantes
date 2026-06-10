import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { OfferWithMerchant } from "@/types/app";

type OfferCardProps = {
  offer: OfferWithMerchant;
  showMerchant?: boolean;
};

export function OfferCard({ offer, showMerchant = true }: OfferCardProps) {
  return (
    <article className="card">
      {offer.merchant.imageUrl ? (
        <img
          className="card-image"
          src={offer.merchant.imageUrl}
          alt={offer.merchant.name}
        />
      ) : null}
      <div className="card-body">
        <span className="card-meta">
          {showMerchant ? offer.merchant.name : offer.merchant.category.name}
        </span>
        <h2>
          <Link href={`/ofertas/${offer.slug}`}>{offer.title}</Link>
        </h2>
        <p className="offer-highlight">{offer.featuredPromotion}</p>
        <p>{offer.description}</p>
        <p>
          <strong>Cliente:</strong> {offer.customerBenefit}
        </p>
        <span className="code-badge">{offer.couponCode}</span>
        <div className="card-footer">
          <span>Hasta el {formatDate(offer.endsAt)}</span>
        </div>
      </div>
    </article>
  );
}
