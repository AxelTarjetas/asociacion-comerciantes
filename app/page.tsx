import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getCategories } from "@/lib/queries/categories";
import { getMerchants } from "@/lib/queries/merchants";
import { getOffers } from "@/lib/queries/offers";
import { formatDate } from "@/lib/utils";

const fallbackNeeds = [
  "Comida",
  "Carne",
  "Pan",
  "Belleza",
  "Ropa",
  "Servicios"
];

export default async function HomePage() {
  const [categories, merchants, offers] = await Promise.all([
    getCategories(),
    getMerchants(),
    getOffers()
  ]);
  const featuredOffers = offers.slice(0, 3);
  const localMerchants = merchants.slice(0, 3);
  const quickNeeds =
    categories.length > 0
      ? Array.from(
          new Set([
            ...fallbackNeeds.slice(0, 3),
            ...categories.map((category) => category.name)
          ])
        ).slice(0, 6)
      : fallbackNeeds;

  return (
    <div className="public-home app-home">
      <section className="app-hero" aria-labelledby="home-title">
        <div className="app-hero-copy">
          <p className="home-kicker">Ofertas cerca de ti</p>
          <h1 id="home-title">¿Qué necesitas comprar hoy?</h1>
          <p>Encuentra ofertas de comercios cercanos y enseña tu cupón en tienda.</p>
        </div>

        <section className="app-search-card" aria-label="Buscar ofertas">
          <label htmlFor="home-search-input">Busca por producto o necesidad</label>
          <div className="app-search-field">
            <span aria-hidden="true">Buscar</span>
            <input
              id="home-search-input"
              type="search"
              placeholder="Busca carne, pan, café, peluquería..."
              readOnly
            />
          </div>
        </section>

        <div className="app-primary-actions" aria-label="Acciones principales">
          <Button href="/ofertas">Ver ofertas</Button>
          <Button href="/comercios" variant="secondary">
            Tiendas con ofertas
          </Button>
        </div>
      </section>

      <main className="home-content app-home-content">
        <section className="need-shortcuts" aria-labelledby="needs-title">
          <div className="app-section-heading">
            <p className="eyebrow">Toca y mira ofertas</p>
            <h2 id="needs-title">Comprar rápido</h2>
          </div>
          <div className="need-chip-grid">
            {quickNeeds.map((need) => (
              <Link className="need-chip" href="/ofertas" key={need}>
                {need}
              </Link>
            ))}
          </div>
        </section>

        <section className="app-home-section" aria-labelledby="today-offers-title">
          <div className="app-section-heading app-section-heading-row">
            <div>
              <p className="eyebrow">Para usar hoy</p>
              <h2 id="today-offers-title">Ofertas para hoy</h2>
            </div>
            <Link className="text-link" href="/ofertas">
              Ver todas
            </Link>
          </div>

          {featuredOffers.length > 0 ? (
            <div className="today-offer-list">
              {featuredOffers.map((offer) => (
                <Link
                  className="today-offer-card"
                  href={`/ofertas/${offer.slug}`}
                  key={offer.id}
                >
                  <span className="today-offer-store">{offer.merchant.name}</span>
                  <strong>{offer.title}</strong>
                  {offer.customerBenefit ? <p>{offer.customerBenefit}</p> : null}
                  <div className="today-offer-meta">
                    {offer.couponCode ? (
                      <span className="code-badge">{offer.couponCode}</span>
                    ) : null}
                    <small>
                      {offer.hasEndsAt === false
                        ? "Sin fecha límite"
                        : `Hasta ${formatDate(offer.endsAt)}`}
                    </small>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-state">Pronto habrá ofertas para revisar aquí.</p>
          )}

          <Button href="/ofertas">Ver todas las ofertas</Button>
        </section>

        <section className="specials-panel" id="especiales" aria-labelledby="specials-title">
          <div>
            <span className="campaign-badge">Especiales</span>
            <h2 id="specials-title">Especiales de temporada</h2>
            <p>Ofertas agrupadas por fechas, barrios o eventos. Úsalas para encontrar planes rápidos.</p>
          </div>
          <Button href="/ofertas" variant="secondary">
            Ver especiales
          </Button>
        </section>

        <section className="app-home-section" aria-labelledby="shops-title">
          <div className="app-section-heading app-section-heading-row">
            <div>
              <p className="eyebrow">Dónde comprar</p>
              <h2 id="shops-title">Tiendas con ofertas</h2>
            </div>
            <Link className="text-link" href="/comercios">
              Ver tiendas
            </Link>
          </div>

          {localMerchants.length > 0 ? (
            <div className="shop-strip">
              {localMerchants.map((merchant) => {
                const offerCount = offers.filter(
                  (offer) => offer.merchantId === merchant.id
                ).length;

                return (
                  <Link
                    className="shop-strip-card"
                    href={`/comercios/${merchant.slug}`}
                    key={merchant.id}
                  >
                    <span>{merchant.category.name}</span>
                    <strong>{merchant.name}</strong>
                    <small>
                      {offerCount} {offerCount === 1 ? "oferta" : "ofertas"}
                    </small>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">Pronto habrá tiendas con ofertas.</p>
          )}
        </section>

        <section className="business-callout app-business-callout">
          <div>
            <p className="eyebrow">Para comercios y asociaciones</p>
            <h2>Publica ofertas claras y mide cuántas personas las usan.</h2>
          </div>
          <Button href="/comercios" variant="secondary">
            Ver tiendas
          </Button>
        </section>
      </main>
    </div>
  );
}
