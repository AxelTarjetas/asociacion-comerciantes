import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getCategories } from "@/lib/queries/categories";
import { getCampaigns } from "@/lib/queries/campaigns";
import { getMerchants } from "@/lib/queries/merchants";
import { getOffers } from "@/lib/queries/offers";
import { formatDate } from "@/lib/utils";
import type { MerchantWithCategory } from "@/types/app";

const fallbackNeeds = [
  { icon: "\u{1F37D}", label: "Comida", query: "comida" },
  { icon: "\u{1F969}", label: "Carne", query: "carne" },
  { icon: "\u{1F956}", label: "Pan", query: "pan" },
  { icon: "\u2615", label: "Cafe", query: "cafe" },
  { icon: "\u{1F487}", label: "Belleza", query: "belleza" },
  { icon: "\u{1F455}", label: "Moda", query: "ropa" },
  { icon: "\u{1F6E0}", label: "Servicios", query: "servicios" }
];

function getMapHref(merchant: MerchantWithCategory) {
  const query = [merchant.address, merchant.city].filter(Boolean).join(", ");

  if (!query) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default async function HomePage() {
  const [categories, campaigns, merchants, offers] = await Promise.all([
    getCategories(),
    getCampaigns(),
    getMerchants(),
    getOffers()
  ]);
  const mainOffer = offers[0];
  const secondaryOffers = offers.slice(1, 4);
  const localMerchants = merchants.slice(0, 4);
  const featuredCampaign = campaigns[0];
  const quickNeeds =
    categories.length > 0
      ? Array.from(
          new Map<string, { icon: string; label: string; query: string }>([
            ...fallbackNeeds
              .slice(0, 6)
              .map((need) => [need.label, need] as const),
            ...categories.map((category) => [
              category.name,
              { icon: "\u{1F3F7}", label: category.name, query: category.name }
            ] as const)
          ]).values()
        ).slice(0, 8)
      : fallbackNeeds;

  return (
    <div className="public-home app-home app-home-v2">
      <section className="app-hero-v2" aria-labelledby="home-title">
        <div className="hero-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="app-hero-copy-v2">
          <p className="home-kicker">Ofertas cerca de ti</p>
          <h1 id="home-title">Que necesitas comprar hoy?</h1>
          <p>Busca, abre tu cupon y ensenalo en tienda antes de pagar.</p>

          <section className="app-search-card-v2" aria-label="Buscar ofertas">
            <form action="/ofertas" className="app-search-field-v2" method="get">
              <label htmlFor="home-search-input">Busca lo que necesitas</label>
              <div className="home-search-control">
                <input
                  id="home-search-input"
                  name="q"
                  type="search"
                  placeholder="Carne, pan, cafe, peluqueria..."
                />
                <button type="submit">Buscar</button>
              </div>
            </form>
          </section>
        </div>

        <aside className="hero-phone-card" aria-label="Oferta destacada">
          <span className="hero-phone-label">Para hoy</span>
          <strong>{mainOffer?.title ?? "Ofertas listas para usar"}</strong>
          <p>{mainOffer?.customerBenefit ?? "Encuentra descuentos cercanos en pocos toques."}</p>
          <div>
            <span>{mainOffer?.merchant.name ?? "Comercio local"}</span>
            {mainOffer?.couponCode ? <small>{mainOffer.couponCode}</small> : null}
          </div>
        </aside>
      </section>

      <main className="home-content app-home-content">
        <section className="need-shortcuts-v2" aria-labelledby="needs-title">
          <div className="app-section-heading compact-heading">
            <p className="eyebrow">Toca una opcion</p>
            <h2 id="needs-title">Comprar rapido</h2>
          </div>
          <div className="need-card-grid">
            {quickNeeds.map((need) => (
              <Link
                className="need-card"
                href={`/ofertas?q=${encodeURIComponent(need.query)}`}
                key={need.label}
              >
                <span aria-hidden="true">{need.icon}</span>
                <strong>{need.label}</strong>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-offers-showcase" aria-labelledby="today-offers-title">
          <div className="app-section-heading app-section-heading-row">
            <div>
              <p className="eyebrow">Para usar hoy</p>
              <h2 id="today-offers-title">Ofertas para hoy</h2>
            </div>
            <Link className="text-link" href="/ofertas">
              Ver todas
            </Link>
          </div>

          {mainOffer ? (
            <div className="today-showcase-grid">
              <Link className="today-feature-card" href={`/ofertas/${mainOffer.slug}`}>
                <span className="today-feature-badge">Oferta destacada</span>
                <small>{mainOffer.merchant.name}</small>
                <strong>{mainOffer.title}</strong>
                {mainOffer.customerBenefit ? <p>{mainOffer.customerBenefit}</p> : null}
                <div className="today-feature-meta">
                  {mainOffer.couponCode ? (
                    <span className="code-badge">{mainOffer.couponCode}</span>
                  ) : null}
                  <span>
                    {mainOffer.hasEndsAt === false
                      ? "Sin fecha limite"
                      : `Hasta ${formatDate(mainOffer.endsAt)}`}
                  </span>
                </div>
                <em>Ver cupon</em>
              </Link>

              <div className="today-mini-list">
                {secondaryOffers.map((offer) => (
                  <Link
                    className="today-mini-card"
                    href={`/ofertas/${offer.slug}`}
                    key={offer.id}
                  >
                    <span>{offer.merchant.name}</span>
                    <strong>{offer.title}</strong>
                    <small>
                      {offer.couponCode ? `${offer.couponCode} / ` : ""}
                      {offer.hasEndsAt === false
                        ? "Sin fecha limite"
                        : `Hasta ${formatDate(offer.endsAt)}`}
                    </small>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="empty-state">Pronto habra ofertas para revisar aqui.</p>
          )}
        </section>

        <section className="special-event-card" id="especiales" aria-labelledby="specials-title">
          <div className="event-calendar-badge" aria-hidden="true">
            <span>Esta</span>
            <strong>semana</strong>
          </div>
          <div>
            <p className="eyebrow">Especiales</p>
            <h2 id="specials-title">{featuredCampaign?.name ?? "Especial de esta semana"}</h2>
            <p>
              {featuredCampaign?.description ||
                "Ofertas por fecha, barrio o evento. Una forma rapida de encontrar planes cercanos."}
            </p>
          </div>
          <Button
            href={featuredCampaign ? `/campanas/${featuredCampaign.slug}` : "/ofertas"}
            variant="secondary"
          >
            Ver especiales
          </Button>
        </section>

        <section className="shops-home-panel" aria-labelledby="shops-title">
          <div className="app-section-heading app-section-heading-row">
            <div>
              <p className="eyebrow">Donde usar ofertas</p>
              <h2 id="shops-title">Tiendas donde ahorrar hoy</h2>
            </div>
            <Link className="text-link" href="/comercios">
              Ver tiendas
            </Link>
          </div>

          {localMerchants.length > 0 ? (
            <div className="shop-saving-list">
              {localMerchants.map((merchant) => {
                const offerCount = offers.filter(
                  (offer) => offer.merchantId === merchant.id
                ).length;
                const mapHref = getMapHref(merchant);

                return (
                  <article className="shop-saving-card" key={merchant.id}>
                    <div>
                      <span>{merchant.category.name}</span>
                      <strong>{merchant.name}</strong>
                      <p>{merchant.city || merchant.address || "Comercio cercano"}</p>
                    </div>
                    <div className="shop-saving-actions">
                      <small>
                        {offerCount} {offerCount === 1 ? "oferta" : "ofertas"}
                      </small>
                      <Link href={`/comercios/${merchant.slug}`}>Ver tienda</Link>
                      {mapHref ? (
                        <a href={mapHref} rel="noreferrer" target="_blank">
                          Como llegar
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">Pronto habra tiendas con ofertas.</p>
          )}
        </section>
      </main>
    </div>
  );
}
