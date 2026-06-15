import { notFound } from "next/navigation";
import { OfferCard } from "@/components/offers/OfferCard";
import { Button } from "@/components/ui/Button";
import { getMerchantBySlug } from "@/lib/queries/merchants";
import { getOffersByMerchantId } from "@/lib/queries/offers";

type MerchantDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function MerchantDetailPage({ params }: MerchantDetailPageProps) {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);

  if (!merchant) {
    notFound();
  }

  const offers = await getOffersByMerchantId(merchant.id);

  return (
    <div className="public-detail-page merchant-detail-page">
      <section className="page-shell public-detail-hero">
        <Button href="/comercios" variant="secondary" className="public-back-button">
          Volver a comercios
        </Button>
        <div className="merchant-detail-hero-grid">
          <div className="public-detail-media merchant-detail-media">
            {merchant.imageUrl ? (
              <img src={merchant.imageUrl} alt={merchant.name} />
            ) : (
              <div className="public-detail-placeholder" aria-hidden="true">
                {merchant.name.slice(0, 1)}
              </div>
            )}
            <span className="card-floating-badge category-badge">
              {merchant.category.name}
            </span>
          </div>
          <div className="public-detail-intro merchant-detail-intro">
            <div className="merchant-location-row">
              <span>{merchant.city ?? "Comercio local"}</span>
              <span>{offers.length} {offers.length === 1 ? "oferta activa" : "ofertas activas"}</span>
            </div>
            <h1>{merchant.name}</h1>
            <p className="public-detail-summary">{merchant.description}</p>
            <div className="merchant-contact-actions">
              <Button href="#promociones">Ver ofertas</Button>
              {merchant.websiteUrl ? (
                <a className="button button-secondary" href={merchant.websiteUrl} rel="noreferrer" target="_blank">
                  Visitar web
                </a>
              ) : null}
              {merchant.phone ? (
                <a className="merchant-phone-link" href={`tel:${merchant.phone}`}>
                  Llamar: {merchant.phone}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell merchant-info-strip" aria-label="Información del comercio">
        <div>
          <span>Dirección</span>
          <strong>{merchant.address}</strong>
        </div>
        <div>
          <span>Zona</span>
          <strong>{merchant.city ?? "Local"}</strong>
        </div>
        <div>
          <span>Categoría</span>
          <strong>{merchant.category.name}</strong>
        </div>
      </section>

      <section id="promociones" className="page-shell merchant-offers-section" aria-label="Promociones del comercio">
        <div className="home-section-header">
          <div>
            <p className="eyebrow">Aprovecha tu visita</p>
            <h2>Ofertas de {merchant.name}</h2>
          </div>
          <Button href="/ofertas" variant="secondary">
            Ver todas
          </Button>
        </div>
        {offers.length > 0 ? (
          <div className="grid public-card-grid">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} showMerchant={false} />
            ))}
          </div>
        ) : (
          <div className="public-empty-state">
            <span aria-hidden="true">%</span>
            <h2>Ahora mismo no hay ofertas activas</h2>
            <p>Vuelve pronto para descubrir las próximas promociones de este comercio.</p>
          </div>
        )}
      </section>
    </div>
  );
}
