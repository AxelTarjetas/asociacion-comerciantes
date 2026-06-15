import { OfferCard } from "@/components/offers/OfferCard";
import { getOffers } from "@/lib/queries/offers";

export default async function OffersPage() {
  const offers = await getOffers();

  return (
    <div className="page-shell public-list-page">
      <section className="listing-header">
        <div>
          <p className="eyebrow">Ahorra comprando cerca</p>
          <h1>Ofertas locales para aprovechar hoy</h1>
          <p>Promociones claras, comercios cercanos y cupones listos para usar.</p>
        </div>
        <div className="listing-count" aria-label={`${offers.length} ofertas activas`}>
          <strong>{offers.length}</strong>
          <span>ofertas activas</span>
        </div>
      </section>

      <div className="listing-note" aria-label="Información sobre los cupones">
        <span className="status-badge status-badge-active">Activas ahora</span>
        <p>Abre una oferta para ver su código y canjearla en el comercio.</p>
      </div>

      <section className="grid public-card-grid" aria-label="Listado de ofertas">
        {offers.length > 0 ? (
          offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
        ) : (
          <div className="public-empty-state">
            <span aria-hidden="true">%</span>
            <h2>Pronto habrá nuevas ofertas</h2>
            <p>Estamos preparando más promociones de comercios locales.</p>
          </div>
        )}
      </section>
    </div>
  );
}
