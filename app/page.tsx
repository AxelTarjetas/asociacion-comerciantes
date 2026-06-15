import Link from "next/link";
import { MerchantCard } from "@/components/merchants/MerchantCard";
import { OfferCard } from "@/components/offers/OfferCard";
import { Button } from "@/components/ui/Button";
import { getMerchants } from "@/lib/queries/merchants";
import { getOffers } from "@/lib/queries/offers";

const quickLinks = [
  {
    href: "/ofertas",
    index: "01",
    label: "Ofertas",
    detail: "Ahorra hoy"
  },
  {
    href: "/comercios",
    index: "02",
    label: "Comercios",
    detail: "Compra cerca"
  },
  {
    href: "#campanas",
    index: "03",
    label: "Campañas",
    detail: "Descubre planes"
  },
  {
    href: "/ofertas",
    index: "04",
    label: "Canjear",
    detail: "Abre tu cupón"
  }
];

export default async function HomePage() {
  const [merchants, offers] = await Promise.all([getMerchants(), getOffers()]);
  const featuredOffers = offers.slice(0, 3);
  const localMerchants = merchants.slice(0, 4);

  return (
    <div className="public-home">
      <section className="home-hero" aria-labelledby="home-title">
        <img
          src="https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=1800&q=88"
          alt="Calle comercial con tiendas locales y vecinos paseando"
        />
        <div className="home-hero-shade" />
        <div className="home-hero-content">
          <p className="home-kicker">Tu barrio, más vivo</p>
          <h1 id="home-title">Ofertas locales cerca de ti</h1>
          <p>Descubre comercios, ahorra con promociones y vuelve a comprar cerca.</p>
          <div className="hero-actions">
            <Button href="/ofertas">Ver ofertas</Button>
            <Button href="/comercios" variant="secondary">
              Explorar comercios
            </Button>
          </div>
        </div>
      </section>

      <div className="home-content">
        <section className="home-search" aria-label="Buscar en Comercio Vivo">
          <label htmlFor="home-search-input">¿Qué buscas hoy?</label>
          <div className="home-search-field">
            <span aria-hidden="true">Buscar</span>
            <input
              id="home-search-input"
              type="search"
              placeholder="Comercios, ofertas, categorías..."
              readOnly
            />
          </div>
        </section>

        <nav className="quick-access" aria-label="Accesos rápidos">
          {quickLinks.map((item) => (
            <Link className="quick-access-item" href={item.href} key={item.label}>
              <span>{item.index}</span>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </Link>
          ))}
        </nav>

        <section className="home-feed" aria-labelledby="featured-offers-title">
          <div className="home-section-header">
            <div>
              <p className="eyebrow">Para aprovechar ahora</p>
              <h2 id="featured-offers-title">Ofertas destacadas</h2>
            </div>
            <Link className="text-link" href="/ofertas">
              Ver todas
            </Link>
          </div>
          {featuredOffers.length > 0 ? (
            <div className="home-card-grid">
              {featuredOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          ) : (
            <p className="empty-state">Muy pronto habrá nuevas ofertas por aquí.</p>
          )}
        </section>

        <section className="campaign-showcase" id="campanas" aria-labelledby="campaigns-title">
          <div className="campaign-showcase-copy">
            <span className="campaign-badge">Campañas activas</span>
            <h2 id="campaigns-title">Planes para recorrer y disfrutar el barrio</h2>
            <p>Rutas, temporadas especiales y promociones agrupadas en un solo lugar.</p>
          </div>
          <div className="campaign-showcase-action">
            <strong>{offers.length} promociones disponibles</strong>
            <Button href="/ofertas" variant="secondary">
              Descubrir ahora
            </Button>
          </div>
        </section>

        <section className="home-feed" aria-labelledby="local-merchants-title">
          <div className="home-section-header">
            <div>
              <p className="eyebrow">A un paseo de distancia</p>
              <h2 id="local-merchants-title">Comercios locales</h2>
            </div>
            <Link className="text-link" href="/comercios">
              Ver todos
            </Link>
          </div>
          {localMerchants.length > 0 ? (
            <div className="home-card-grid merchant-home-grid">
              {localMerchants.map((merchant) => (
                <MerchantCard
                  key={merchant.id}
                  merchant={merchant}
                  offerCount={
                    offers.filter((offer) => offer.merchantId === merchant.id).length
                  }
                />
              ))}
            </div>
          ) : (
            <p className="empty-state">Muy pronto habrá comercios para descubrir.</p>
          )}
        </section>

        <section className="business-callout">
          <div>
            <p className="eyebrow">Para comercios y asociaciones</p>
            <h2>Más visibilidad. Más visitas. Resultados que puedes medir.</h2>
          </div>
          <Button href="/comercios" variant="secondary">
            Conocer la plataforma
          </Button>
        </section>
      </div>
    </div>
  );
}
