import { OfferCard } from "@/components/offers/OfferCard";
import { getOffers } from "@/lib/mock-data";

export default function OffersPage() {
  const offers = getOffers();

  return (
    <div className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">Ofertas activas</p>
        <h1>Cupones simples para comprar en comercios del barrio.</h1>
        <p>
          Promociones con código visible, comercio asociado y fecha fin para poder
          medir su uso en proximas fases.
        </p>
      </section>

      <section className="grid" aria-label="Listado de ofertas">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </section>
    </div>
  );
}
