import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { getOfferBySlug } from "@/lib/mock-data";

type OfferDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const { slug } = await params;
  const offer = getOfferBySlug(slug);

  if (!offer) {
    notFound();
  }

  return (
    <div className="page-shell">
      <section className="detail-layout">
        <article className="detail-main">
          {offer.merchant.imageUrl ? (
            <img src={offer.merchant.imageUrl} alt={offer.merchant.name} />
          ) : null}
          <div className="detail-content">
            <p className="eyebrow">
              <Link href={`/comercios/${offer.merchant.slug}`}>
                {offer.merchant.name}
              </Link>
            </p>
            <h1>{offer.title}</h1>
            <p className="detail-copy">{offer.description}</p>
            <div className="section-actions">
              <Button href={`/comercios/${offer.merchant.slug}`}>
                Ver comercio
              </Button>
              <Button href="/ofertas" variant="secondary">
                Volver a ofertas
              </Button>
            </div>
          </div>
        </article>

        <aside className="detail-panel">
          <h2>Cupón</h2>
          <ul className="detail-list">
            <li>
              <strong>Código</strong>
              <span className="code-badge">{offer.couponCode}</span>
            </li>
            <li>
              <strong>Valido hasta</strong>
              {formatDate(offer.endsAt)}
            </li>
            <li>
              <strong>Comercio</strong>
              {offer.merchant.name}
            </li>
            <li>
              <strong>Dirección</strong>
              {offer.merchant.address}
            </li>
          </ul>
        </aside>
      </section>
    </div>
  );
}
