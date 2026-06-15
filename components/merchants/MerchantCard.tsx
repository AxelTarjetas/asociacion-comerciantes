import Link from "next/link";
import type { MerchantWithCategory } from "@/types/app";

type MerchantCardProps = {
  merchant: MerchantWithCategory;
  offerCount?: number;
};

export function MerchantCard({ merchant, offerCount }: MerchantCardProps) {
  return (
    <article className="card merchant-card">
      <div className="card-media">
        {merchant.imageUrl ? (
          <img className="card-image" src={merchant.imageUrl} alt={merchant.name} />
        ) : (
          <div className="card-image-placeholder" aria-hidden="true">
            {merchant.name.slice(0, 1)}
          </div>
        )}
        <span className="card-floating-badge category-badge">
          {merchant.category.name}
        </span>
      </div>
      <div className="card-body">
        <h2>
          <Link href={`/comercios/${merchant.slug}`}>{merchant.name}</Link>
        </h2>
        <p className="card-summary">{merchant.description}</p>
        <div className="card-footer">
          <span className="merchant-location">{merchant.address}</span>
          {typeof offerCount === "number" ? (
            <span className="offer-count-badge">
              {offerCount} {offerCount === 1 ? "oferta activa" : "ofertas activas"}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
