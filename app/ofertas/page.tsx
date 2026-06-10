import { OfferCard } from "@/components/offers/OfferCard";
import { getOffers } from "@/lib/queries/offers";

export default async function OffersPage() {
  const offers = await getOffers();

  return (
    <div className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">Promociones exclusivas</p>
        <h1>Ofertas pensadas para atraer clientes a comercios locales.</h1>
        <p>
          Cada cupón muestra el beneficio para el cliente, el comercio asociado y la
          fecha límite para poder medir el interés generado.
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
