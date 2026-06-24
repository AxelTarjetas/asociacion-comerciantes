import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { setMerchantActiveAction } from "@/app/admin/comercios/actions";
import { getAdminMerchants } from "@/lib/queries/merchants";
import { getAdminOffers } from "@/lib/queries/offers";
import { getGoogleMapsSearchUrl, getMerchantLocationQuality } from "@/lib/utils";

type AdminMerchantsPageProps = {
  searchParams?: Promise<{
    q?: string;
    location?: string;
  }>;
};

type LocationFilter = "all" | "complete" | "needs-attention";

function normalizeSearch(value: string | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase();
}

function getMerchantSearchText(merchant: Awaited<ReturnType<typeof getAdminMerchants>>[number]) {
  return normalizeSearch(
    [
      merchant.name,
      merchant.slug,
      merchant.category.name,
      merchant.city,
      merchant.address,
      merchant.phone,
      merchant.websiteUrl
    ]
      .filter(Boolean)
      .join(" ")
  );
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

function getLocationFilter(value?: string): LocationFilter {
  return value === "complete" || value === "needs-attention" ? value : "all";
}

function matchesLocationFilter(
  quality: ReturnType<typeof getMerchantLocationQuality>,
  filter: LocationFilter
) {
  if (filter === "complete") {
    return quality === "complete";
  }

  return filter === "needs-attention" ? quality !== "complete" : true;
}

function getLocationQualityLabel(quality: ReturnType<typeof getMerchantLocationQuality>) {
  if (quality === "complete") {
    return "Ubicaci\u00f3n completa";
  }

  return quality === "incomplete" ? "Ubicaci\u00f3n incompleta" : "Sin ubicaci\u00f3n";
}

function getAdminMerchantsReturnPath(filters: { q?: string; location?: string }) {
  const params = new URLSearchParams();

  if (filters.q?.trim()) {
    params.set("q", filters.q.trim());
  }

  const location = getLocationFilter(filters.location);

  if (location !== "all") {
    params.set("location", location);
  }

  const query = params.toString();
  return query ? `/admin/comercios?${query}` : "/admin/comercios";
}

export default async function AdminMerchantsPage({
  searchParams
}: AdminMerchantsPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const filters = searchParams ? await searchParams : {};
  const query = normalizeSearch(filters.q);
  const locationFilter = getLocationFilter(filters.location);
  const returnPath = getAdminMerchantsReturnPath(filters);
  const [merchants, offers] = await Promise.all([getAdminMerchants(), getAdminOffers()]);
  const activeMerchants = merchants.filter((merchant) => merchant.isActive !== false);
  const inactiveMerchants = merchants.filter((merchant) => merchant.isActive === false);
  const completeLocationMerchants = merchants.filter(
    (merchant) => getMerchantLocationQuality(merchant.address, merchant.city) === "complete"
  );
  const filteredMerchants = merchants.filter(
    (merchant) =>
      (!query || getMerchantSearchText(merchant).includes(query)) &&
      matchesLocationFilter(
        getMerchantLocationQuality(merchant.address, merchant.city),
        locationFilter
      )
  );
  const offersByMerchant = offers.reduce<Record<string, number>>((counts, offer) => {
    counts[offer.merchantId] = (counts[offer.merchantId] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <div className="page-shell admin-list-page">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>Comercios</h1>
          <p>Encuentra, revisa y gestiona los comercios registrados.</p>
        </div>
        <div className="admin-heading-actions">
          <Button href="/admin/comercios/nuevo">Nuevo comercio</Button>
          <Button href="/admin" variant="secondary">
            Volver al admin
          </Button>
        </div>
      </section>

      <section className="admin-list-summary admin-merchant-list-summary" aria-label="Resumen de comercios">
        <article>
          <span>Total</span>
          <strong>{merchants.length}</strong>
          <small>comercios registrados</small>
        </article>
        <article>
          <span>Activos</span>
          <strong>{activeMerchants.length}</strong>
          <small>visibles en público</small>
        </article>
        <article>
          <span>Inactivos</span>
          <strong>{inactiveMerchants.length}</strong>
          <small>ocultos temporalmente</small>
        </article>
        <article>
          <span>{"Con ubicaci\u00f3n"}</span>
          <strong>{completeLocationMerchants.length}</strong>
          <small>listos para Maps</small>
        </article>
        <article>
          <span>Resultados</span>
          <strong>{filteredMerchants.length}</strong>
          <small>{query ? "según la búsqueda" : "mostrados ahora"}</small>
        </article>
      </section>

      <form
        action="/admin/comercios"
        className="admin-filters admin-list-filters admin-merchant-search"
        method="get"
      >
        <label>
          Buscar comercio
          <input
            defaultValue={filters.q ?? ""}
            name="q"
            placeholder="Nombre, zona, categoría, teléfono o web"
            type="search"
          />
        </label>
        <label>
          {"Ubicaci\u00f3n"}
          <select defaultValue={locationFilter} name="location">
            <option value="all">Todos</option>
            <option value="complete">{"Con ubicaci\u00f3n completa"}</option>
            <option value="needs-attention">{"Sin ubicaci\u00f3n o incompleta"}</option>
          </select>
        </label>
        <div className="admin-filter-actions">
          <button className="button button-primary" type="submit">
            Buscar
          </button>
          <Button href="/admin/comercios" variant="secondary">
            Limpiar
          </Button>
        </div>
      </form>

      <section
        className="admin-list-section admin-merchants-list"
        aria-label="Listado admin de comercios"
      >
        {filteredMerchants.map((merchant) => {
          const nextIsActive = merchant.isActive === false;
          const offerCount = offersByMerchant[merchant.id] ?? 0;
          const locationQuality = getMerchantLocationQuality(merchant.address, merchant.city);
          const directionsUrl =
            locationQuality === "complete"
              ? getGoogleMapsSearchUrl(merchant.address, merchant.city)
              : null;

          return (
            <article className="admin-list-card admin-merchant-list-card" key={merchant.id}>
              <Link
                aria-label={`Ver comercio ${merchant.name}`}
                className="admin-merchant-avatar"
                href={`/admin/comercios/${merchant.slug}`}
              >
                {merchant.imageUrl ? (
                  <img alt="" src={merchant.imageUrl} />
                ) : (
                  <span aria-hidden="true">{getMerchantInitials(merchant.name)}</span>
                )}
              </Link>
              <div className="admin-list-card-main">
                <div className="admin-list-card-title-row">
                  <span
                    className={
                      merchant.isActive === false
                        ? "status-badge status-badge-inactive"
                        : "status-badge status-badge-active"
                    }
                  >
                    {merchant.isActive === false ? "Inactivo" : "Activo"}
                  </span>
                  <span className="admin-list-card-kicker">{merchant.category.name}</span>
                  <span className={`location-quality-badge location-quality-badge-${locationQuality}`}>
                    {getLocationQualityLabel(locationQuality)}
                  </span>
                </div>
                <h2>
                  <Link href={`/admin/comercios/${merchant.slug}`}>{merchant.name}</Link>
                </h2>
                <p className="admin-merchant-location">
                  {merchant.city || merchant.address || "Zona sin indicar"}
                </p>
                <div className="admin-merchant-facts">
                  <span>
                    {offerCount} {offerCount === 1 ? "oferta" : "ofertas"}
                  </span>
                  <span>{merchant.phone || merchant.websiteUrl || "Sin contacto"}</span>
                  {merchant.address ? <span>{merchant.address}</span> : null}
                </div>
              </div>
              <div className="admin-card-actions">
                <Button href={`/admin/comercios/${merchant.slug}`} variant="secondary">
                  Ver
                </Button>
                <Button href={`/admin/comercios/${merchant.slug}/editar`} variant="secondary">
                  Editar
                </Button>
                {directionsUrl ? (
                  <a
                    className="button button-secondary"
                    href={directionsUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Probar Maps
                  </a>
                ) : null}
                <form action={setMerchantActiveAction}>
                  <input name="merchant_id" type="hidden" value={merchant.id} />
                  <input name="merchant_slug" type="hidden" value={merchant.slug} />
                  <input
                    name="is_active"
                    type="hidden"
                    value={nextIsActive ? "true" : "false"}
                  />
                  <input name="return_to" type="hidden" value={returnPath} />
                  <button className="button button-secondary" type="submit">
                    {merchant.isActive === false ? "Activar" : "Desactivar"}
                  </button>
                </form>
              </div>
            </article>
          );
        })}
        {merchants.length === 0 ? (
          <p className="empty-state">Todavía no hay comercios registrados.</p>
        ) : null}
        {merchants.length > 0 && filteredMerchants.length === 0 ? (
          <p className="empty-state">No hay comercios que coincidan con los filtros.</p>
        ) : null}
      </section>
    </div>
  );
}
