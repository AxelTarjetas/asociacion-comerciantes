import Link from "next/link";
import type { MerchantWithCategory } from "@/types/app";

type MerchantCardProps = {
  merchant: MerchantWithCategory;
  offerCount?: number;
};

export function MerchantCard({ merchant, offerCount }: MerchantCardProps) {
  return (
    <article className="card">
      {merchant.imageUrl ? (
        <img className="card-image" src={merchant.imageUrl} alt={merchant.name} />
      ) : null}
      <div className="card-body">
        <span className="card-meta">{merchant.category.name}</span>
        <h2>
          <Link href={`/comercios/${merchant.slug}`}>{merchant.name}</Link>
        </h2>
        <p>{merchant.description}</p>
        <div className="card-footer">
          <span>{merchant.address}</span>
          {typeof offerCount === "number" ? (
            <span>
              {offerCount} {offerCount === 1 ? "oferta activa" : "ofertas activas"}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
