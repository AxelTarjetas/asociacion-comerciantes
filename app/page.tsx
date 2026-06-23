import Link from "next/link";
import { HomeSearchOverlay } from "@/components/ui/HomeSearchOverlay";
import { Button } from "@/components/ui/Button";
import { getCampaigns } from "@/lib/queries/campaigns";
import { getMerchants } from "@/lib/queries/merchants";
import { getOffers } from "@/lib/queries/offers";
import { formatDate } from "@/lib/utils";
import type { MerchantWithCategory } from "@/types/app";

const visualCategories = [
  { art: "food", label: "Comida", query: "comida", tone: "mint" },
  { art: "meat", label: "Carne", query: "carne", tone: "coral" },
  { art: "bread", label: "Pan", query: "pan", tone: "sun" },
  { art: "coffee", label: "Caf\u00e9", query: "cafe", tone: "coffee" },
  { art: "beauty", label: "Belleza", query: "belleza", tone: "rose" },
  { art: "fashion", label: "Moda", query: "ropa", tone: "blue" },
  { art: "fun", label: "Entretenimiento", query: "ocio", tone: "violet" },
  { art: "other", label: "Otros", query: "servicios", tone: "stone" }
];

function getMapHref(merchant: MerchantWithCategory) {
  const query = [merchant.address, merchant.city].filter(Boolean).join(", ");

  if (!query) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function getMerchantInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase();
}

export default async function HomePage() {
  const [campaigns, merchants, offers] = await Promise.all([
    getCampaigns(),
    getMerchants(),
    getOffers()
  ]);
  const mainOffer = offers[0];
  const secondaryOffers = offers.slice(1, 4);
  const localMerchants = merchants.slice(0, 4);
  const featuredCampaign = campaigns[0];

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
          <p>{"Encuentra ofertas cercanas y ense\u00f1a tu cup\u00f3n en tienda antes de pagar."}</p>

          <HomeSearchOverlay
            suggestions={visualCategories.map((category) => ({
              label: category.label,
              query: category.query
            }))}
          />
        </div>

        {mainOffer ? (
          <Link
            className="hero-phone-card hero-phone-card-link"
            href={`/ofertas/${mainOffer.slug}`}
            aria-label={`Ver oferta ${mainOffer.title}`}
          >
            <span className="hero-phone-label">Para hoy</span>
            <strong>{mainOffer.title}</strong>
            <p>{mainOffer.customerBenefit || mainOffer.description}</p>
            <div>
              <span>{mainOffer.merchant.name}</span>
              {mainOffer.couponCode ? <small>{mainOffer.couponCode}</small> : null}
            </div>
            <div className="hero-phone-validity">
              <span>
                {mainOffer.hasEndsAt === false
                  ? "Sin fecha limite"
                  : `Hasta ${formatDate(mainOffer.endsAt)}`}
              </span>
              <em>{"Ver cup\u00f3n"}</em>
            </div>
          </Link>
        ) : (
          <aside className="hero-phone-card" aria-label="Oferta destacada">
            <span className="hero-phone-label">Para hoy</span>
            <strong>Ofertas listas para usar</strong>
            <p>Encuentra descuentos cercanos en pocos toques.</p>
            <div>
              <span>Comercio local</span>
            </div>
          </aside>
        )}
      </section>

      <main className="home-content app-home-content">
        <section className="need-shortcuts-v2" aria-labelledby="needs-title">
          <div className="app-section-heading compact-heading">
            <p className="eyebrow">Toca una opcion</p>
            <h2 id="needs-title">Comprar rapido</h2>
          </div>
          <div className="need-card-grid visual-category-grid">
            {visualCategories.map((need) => (
              <Link
                className={`need-card visual-category-card visual-category-${need.tone}`}
                href={`/ofertas?q=${encodeURIComponent(need.query)}`}
                key={need.label}
              >
                <span className={`category-art category-art-${need.art}`} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <strong>{need.label}</strong>
                <small>Ver ofertas</small>
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
                <em>{"Ver cup\u00f3n"}</em>
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
                    <Link className="shop-avatar-link" href={`/comercios/${merchant.slug}`}>
                      {merchant.imageUrl ? (
                        <img
                          alt={`Imagen de ${merchant.name}`}
                          className="shop-avatar-image"
                          src={merchant.imageUrl}
                        />
                      ) : (
                        <span className="shop-avatar-fallback" aria-hidden="true">
                          {getMerchantInitials(merchant.name)}
                        </span>
                      )}
                    </Link>
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

        <section
          className="special-event-card special-event-card-muted"
          id="especiales"
          aria-labelledby="specials-title"
        >
          <div className="event-calendar-badge" aria-hidden="true">
            <span>Especial</span>
            <strong>local</strong>
          </div>
          <div>
            <p className="eyebrow">Especiales</p>
            <h2 id="specials-title">{featuredCampaign?.name ?? "Especial de esta semana"}</h2>
            <p>
              {featuredCampaign?.description ||
                "Ofertas agrupadas por fechas, barrios o eventos cercanos."}
            </p>
          </div>
          <Button
            href={featuredCampaign ? `/campanas/${featuredCampaign.slug}` : "/ofertas"}
            variant="secondary"
          >
            Ver especial
          </Button>
        </section>
      </main>
    </div>
  );
}
