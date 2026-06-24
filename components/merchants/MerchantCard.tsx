import Link from "next/link";
import { getGoogleMapsSearchUrl } from "@/lib/utils";
import type { MerchantWithCategory } from "@/types/app";

type MerchantCardProps = {
  merchant: MerchantWithCategory;
  offerCount?: number;
};

export function MerchantCard({ merchant, offerCount }: MerchantCardProps) {
  const directionsUrl = getGoogleMapsSearchUrl(merchant.address, merchant.city);

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
        <div className={directionsUrl ? "card-action-group" : "card-action-group card-action-group-single"}>
          <Link className="card-primary-action merchant-card-action" href={`/comercios/${merchant.slug}`}>
            Ver tienda
            <span aria-hidden="true">{"\u2192"}</span>
          </Link>
          {directionsUrl ? (
            <a
              className="card-secondary-action"
              href={directionsUrl}
              rel="noreferrer"
              target="_blank"
            >
              {"C\u00f3mo llegar"}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
