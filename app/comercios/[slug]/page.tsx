import { notFound } from "next/navigation";
import { OfferCard } from "@/components/offers/OfferCard";
import { Button } from "@/components/ui/Button";
import { getMerchantBySlug, getOffersByMerchantId } from "@/lib/mock-data";

type MerchantDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function MerchantDetailPage({ params }: MerchantDetailPageProps) {
  const { slug } = await params;
  const merchant = getMerchantBySlug(slug);

  if (!merchant) {
    notFound();
  }

  const offers = getOffersByMerchantId(merchant.id);

  return (
    <div className="page-shell">
      <section className="detail-layout">
        <article className="detail-main">
          {merchant.imageUrl ? <img src={merchant.imageUrl} alt={merchant.name} /> : null}
          <div className="detail-content">
            <p className="eyebrow">{merchant.category.name}</p>
            <h1>{merchant.name}</h1>
            <p className="detail-copy">{merchant.description}</p>
            <div className="section-actions">
              <Button href="/ofertas">Ver ofertas activas</Button>
              <Button href="/comercios" variant="secondary">
                Volver a comercios
              </Button>
            </div>
          </div>
        </article>

        <aside className="detail-panel">
          <h2>Información del comercio</h2>
          <ul className="detail-list">
            <li>
              <strong>Dirección</strong>
              {merchant.address}
            </li>
            <li>
              <strong>Telefono</strong>
              {merchant.phone}
            </li>
            <li>
              <strong>Ofertas activas</strong>
              {offers.length}
            </li>
          </ul>
        </aside>
      </section>

      <section className="related-section" aria-label="Ofertas del comercio">
        <h2 className="section-title">Ofertas de {merchant.name}</h2>
        {offers.length > 0 ? (
          <div className="grid">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} showMerchant={false} />
            ))}
          </div>
        ) : (
          <p className="empty-state">Este comercio no tiene ofertas activas ahora mismo.</p>
        )}
      </section>
    </div>
  );
}
