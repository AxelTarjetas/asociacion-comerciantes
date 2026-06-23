import Link from "next/link";
import { OfferCard } from "@/components/offers/OfferCard";
import { getOffers } from "@/lib/queries/offers";
import type { OfferWithMerchant } from "@/types/app";

type OffersPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    merchant?: string;
    availability?: string;
  }>;
};

const quickSearches = ["carne", "pan", "cafe", "peluqueria", "ropa"];

const searchAliases: Record<string, string[]> = {
  carne: ["carne", "carniceria", "alimentacion", "comida", "mercado", "fresco"],
  pan: ["pan", "panaderia", "obrador", "desayuno"],
  cafe: ["cafe", "cafeteria", "desayuno", "bar", "obrador"],
  peluqueria: ["peluqueria", "belleza", "estetica", "servicio", "servicios"],
  ropa: ["ropa", "moda", "prenda", "textil", "complementos", "arreglo"]
};

function normalizeSearch(value: string | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getOfferSearchText(offer: OfferWithMerchant) {
  return normalizeSearch(
    [
      offer.title,
      offer.description,
      offer.featuredPromotion,
      offer.customerBenefit,
      offer.businessGoal,
      offer.couponCode,
      offer.merchant.name,
      offer.merchant.description,
      offer.merchant.category.name,
      offer.merchant.address,
      offer.merchant.city
    ].join(" ")
  );
}

function getSearchGroups(query: string) {
  return query
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => searchAliases[term] ?? [term]);
}

function getOfferScore(offer: OfferWithMerchant, query: string) {
  if (!query) {
    return 0;
  }

  const title = normalizeSearch(offer.title);
  const merchant = normalizeSearch(offer.merchant.name);
  const category = normalizeSearch(offer.merchant.category.name);
  const benefit = normalizeSearch(offer.customerBenefit);
  const description = normalizeSearch(`${offer.description} ${offer.featuredPromotion}`);
  const searchGroups = getSearchGroups(query);

  return searchGroups.reduce((score, terms) => {
    const bestTermScore = terms.reduce((termScore, term) => {
      if (title.startsWith(term)) return Math.max(termScore, 8);
      if (title.includes(term)) return Math.max(termScore, 6);
      if (merchant.includes(term)) return Math.max(termScore, 5);
      if (category.includes(term)) return Math.max(termScore, 4);
      if (benefit.includes(term)) return Math.max(termScore, 3);
      if (description.includes(term)) return Math.max(termScore, 2);
      return termScore;
    }, 0);

    return score + bestTermScore;
  }, 0);
}

function buildOffersHref(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `/ofertas?${query}` : "/ofertas";
}

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const filters = searchParams ? await searchParams : {};
  const offers = await getOffers();
  const query = normalizeSearch(filters.q);
  const categoryFilter = filters.category?.trim() ?? "";
  const merchantFilter = filters.merchant?.trim() ?? "";

  const categories = Array.from(
    new Map(
      offers
        .filter((offer) => offer.merchant.category.slug)
        .map((offer) => [offer.merchant.category.slug, offer.merchant.category])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name, "es"));

  const merchants = Array.from(
    new Map(
      offers
        .filter((offer) => offer.merchant.slug)
        .map((offer) => [offer.merchant.slug, offer.merchant])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name, "es"));

  const filteredOffers = offers
    .filter((offer) => {
      const searchGroups = getSearchGroups(query);
      const searchText = getOfferSearchText(offer);
      const matchesQuery =
        searchGroups.length === 0 ||
        searchGroups.every((terms) =>
          terms.some((term) => searchText.includes(term))
        );
      const matchesCategory =
        !categoryFilter || offer.merchant.category.slug === categoryFilter;
      const matchesMerchant = !merchantFilter || offer.merchant.slug === merchantFilter;

      return matchesQuery && matchesCategory && matchesMerchant;
    })
    .sort((a, b) => {
      if (!query) {
        return 0;
      }

      return getOfferScore(b, query) - getOfferScore(a, query);
    });

  const hasFilters = Boolean(query || categoryFilter || merchantFilter);
  const selectedCategory = categories.find((category) => category.slug === categoryFilter);
  const selectedMerchant = merchants.find((merchant) => merchant.slug === merchantFilter);

  return (
    <div className="page-shell public-list-page offers-search-page">
      <section className="listing-header offers-search-header">
        <div>
          <p className="eyebrow">Ofertas disponibles hoy</p>
          <h1>Busca lo que necesitas</h1>
          <p>Escribe un producto, una tienda o un tipo de comercio. Te mostramos solo ofertas activas.</p>
        </div>
        <div className="listing-count" aria-label={`${filteredOffers.length} ofertas encontradas`}>
          <strong>{filteredOffers.length}</strong>
          <span>{hasFilters ? "resultados" : "ofertas hoy"}</span>
        </div>
      </section>

      <section className="public-search-panel" aria-label="Buscar y filtrar ofertas">
        <form action="/ofertas" className="public-offer-filters" method="get">
          <label className="public-filter-field public-filter-field-wide">
            <span>Busca lo que necesitas</span>
            <input
              defaultValue={filters.q ?? ""}
              name="q"
              placeholder="carne, pan, cafe, peluqueria..."
              type="search"
            />
          </label>

          <label className="public-filter-field">
            <span>Filtra por tipo</span>
            <select defaultValue={categoryFilter} name="category">
              <option value="">Todos los tipos</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="public-filter-field">
            <span>Filtra por tienda</span>
            <select defaultValue={merchantFilter} name="merchant">
              <option value="">Todas las tiendas</option>
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.slug}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </label>

          <label className="public-filter-field">
            <span>Disponibilidad</span>
            <select defaultValue="available" name="availability">
              <option value="available">Disponibles hoy</option>
            </select>
          </label>

          <div className="public-filter-actions">
            <button type="submit">Filtrar</button>
            <Link href="/ofertas">Limpiar</Link>
          </div>
        </form>

        <div className="quick-search-row" aria-label="Busquedas rapidas">
          {quickSearches.map((term) => (
            <Link href={buildOffersHref({ q: term })} key={term}>
              {term}
            </Link>
          ))}
        </div>
      </section>

      <section className="listing-note public-results-note" aria-label="Resumen de resultados">
        <span className="status-badge status-badge-active">Disponibles hoy</span>
        <p>
          {hasFilters
            ? `${filteredOffers.length} ${filteredOffers.length === 1 ? "oferta encontrada" : "ofertas encontradas"}`
            : "Todas estas ofertas se pueden preparar para ensenar en tienda."}
        </p>
      </section>

      {hasFilters ? (
        <div className="active-public-filters" aria-label="Filtros aplicados">
          {query ? <span>Busqueda: {filters.q}</span> : null}
          {selectedCategory ? <span>Tipo: {selectedCategory.name}</span> : null}
          {selectedMerchant ? <span>Tienda: {selectedMerchant.name}</span> : null}
        </div>
      ) : null}

      <section className="grid public-card-grid" aria-label="Listado de ofertas">
        {filteredOffers.length > 0 ? (
          filteredOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
        ) : offers.length === 0 ? (
          <div className="public-empty-state">
            <span aria-hidden="true">%</span>
            <h2>Pronto habra nuevas ofertas</h2>
            <p>Estamos preparando mas promociones de comercios locales.</p>
          </div>
        ) : (
          <div className="public-empty-state">
            <span aria-hidden="true">?</span>
            <h2>No hay ofertas con esos filtros</h2>
            <p>Prueba con pan, cafe, ropa o limpia los filtros para ver todas.</p>
            <Link className="button button-secondary" href="/ofertas">
              Ver todas las ofertas
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
