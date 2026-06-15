import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import {
  duplicateOfferAction,
  setOfferActiveAction
} from "@/app/admin/ofertas/actions";
import { getAdminOffers } from "@/lib/queries/offers";
import { getAdminCouponRedemptions } from "@/lib/queries/redemptions";
import type { OfferWithMerchant } from "@/types/app";

type AdminOffersPageProps = {
  searchParams?: Promise<{
    q?: string;
    merchant?: string;
    status?: string;
  }>;
};

type AdminOfferStatus = "active" | "inactive" | "future" | "expired";

const statusLabels: Record<AdminOfferStatus, string> = {
  active: "Activa",
  inactive: "Inactiva",
  future: "Futura",
  expired: "Caducada"
};

const statusClasses: Record<AdminOfferStatus, string> = {
  active: "status-badge status-badge-active",
  inactive: "status-badge status-badge-inactive",
  future: "status-badge status-badge-muted",
  expired: "status-badge status-badge-inactive"
};

function normalizeSearch(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function getAdminOfferStatus(offer: OfferWithMerchant, now: Date): AdminOfferStatus {
  if (!offer.isActive) {
    return "inactive";
  }

  if (offer.startsAt && new Date(offer.startsAt) > now) {
    return "future";
  }

  if (offer.hasEndsAt !== false && new Date(offer.endsAt) < now) {
    return "expired";
  }

  return "active";
}

function getAdminOffersReturnPath(
  filters: Awaited<NonNullable<AdminOffersPageProps["searchParams"]>>
) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.merchant) {
    params.set("merchant", filters.merchant);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  const query = params.toString();
  return query ? `/admin/ofertas?${query}` : "/admin/ofertas";
}

export default async function AdminOffersPage({
  searchParams
}: AdminOffersPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const filters = searchParams ? await searchParams : {};
  const query = normalizeSearch(filters.q);
  const merchantFilter = filters.merchant?.trim() ?? "";
  const statusFilter = filters.status?.trim() ?? "all";
  const returnPath = getAdminOffersReturnPath(filters);
  const now = new Date();
  const [offers, redemptions] = await Promise.all([
    getAdminOffers(),
    getAdminCouponRedemptions()
  ]);
  const redemptionsByOffer = redemptions.reduce<Record<string, number>>(
    (counts, redemption) => {
      counts[redemption.offerId] = (counts[redemption.offerId] ?? 0) + 1;
      return counts;
    },
    {}
  );
  const merchantOptions = Array.from(
    new Map(
      offers
        .filter((offer) => offer.merchant.slug)
        .map((offer) => [offer.merchant.slug, offer.merchant.name])
    )
  ).sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB));
  const filteredOffers = offers.filter((offer) => {
    const offerStatus = getAdminOfferStatus(offer, now);
    const matchesQuery =
      !query ||
      [offer.title, offer.merchant.name, offer.couponCode]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesMerchant =
      !merchantFilter || offer.merchant.slug === merchantFilter;
    const matchesStatus = statusFilter === "all" || offerStatus === statusFilter;

    return matchesQuery && matchesMerchant && matchesStatus;
  });
  const filteredOfferIds = new Set(filteredOffers.map((offer) => offer.id));
  const filteredRedemptions = redemptions.filter((redemption) =>
    filteredOfferIds.has(redemption.offerId)
  );
  const activeFilteredOffers = filteredOffers.filter(
    (offer) => getAdminOfferStatus(offer, now) === "active"
  );
  const topOffer = filteredOffers.reduce<(typeof filteredOffers)[number] | null>(
    (currentTop, offer) => {
      if (!currentTop) {
        return offer;
      }

      return (redemptionsByOffer[offer.id] ?? 0) >
        (redemptionsByOffer[currentTop.id] ?? 0)
        ? offer
        : currentTop;
    },
    null
  );
  const topOfferRedemptions = topOffer ? (redemptionsByOffer[topOffer.id] ?? 0) : 0;

  return (
    <div className="page-shell admin-list-page">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>Ofertas</h1>
          <p>Filtra promociones, revisa canjes y gestiona su visibilidad.</p>
        </div>
        <div className="admin-heading-actions">
          <Button href="/admin/ofertas/nueva">Nueva oferta</Button>
          <Button href="/admin" variant="secondary">
            Volver al admin
          </Button>
        </div>
      </section>

      <section className="admin-list-summary" aria-label="Resumen de ofertas">
        <article>
          <span>Mostradas</span>
          <strong>{filteredOffers.length}</strong>
          <small>ofertas filtradas</small>
        </article>
        <article>
          <span>Activas</span>
          <strong>{activeFilteredOffers.length}</strong>
          <small>vigentes ahora</small>
        </article>
        <article>
          <span>Canjes</span>
          <strong>{filteredRedemptions.length}</strong>
          <small>en el resultado actual</small>
        </article>
        <article>
          <span>Top oferta</span>
          <strong>{topOfferRedemptions > 0 ? topOfferRedemptions : "0"}</strong>
          <small>{topOfferRedemptions > 0 ? topOffer?.title : "Sin canjes"}</small>
        </article>
      </section>

      <form action="/admin/ofertas" className="admin-filters admin-list-filters" method="get">
        <label>
          Buscar
          <input
            defaultValue={filters.q ?? ""}
            name="q"
            placeholder="Oferta, comercio o código"
            type="search"
          />
        </label>
        <label>
          Comercio
          <select defaultValue={merchantFilter} name="merchant">
            <option value="">Todos los comercios</option>
            {merchantOptions.map(([slug, name]) => (
              <option key={slug} value={slug}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select defaultValue={statusFilter} name="status">
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
            <option value="future">Futuras</option>
            <option value="expired">Caducadas</option>
          </select>
        </label>
        <div className="admin-filter-actions">
          <button className="button button-primary" type="submit">
            Filtrar
          </button>
          <Button href="/admin/ofertas" variant="secondary">
            Limpiar filtros
          </Button>
        </div>
      </form>

      <section
        className="admin-list-section admin-offer-list"
        aria-label="Listado admin de ofertas"
      >
        {filteredOffers.map((offer) => {
          const offerStatus = getAdminOfferStatus(offer, now);
          const nextIsActive = !offer.isActive;
          const duplicateOfferWithSlug = duplicateOfferAction.bind(null, offer.slug);

          return (
            <article className="admin-list-card admin-offer-list-card" key={offer.id}>
              <div className="admin-list-card-main">
                <div className="admin-list-card-title-row">
                  <span className={statusClasses[offerStatus]}>
                    {statusLabels[offerStatus]}
                  </span>
                  <span className="admin-list-card-kicker">
                    {offer.merchant.name}
                  </span>
                </div>
                <h2>
                  <Link href={`/admin/ofertas/${offer.slug}`}>{offer.title}</Link>
                </h2>
                <small className="admin-list-slug">{offer.slug}</small>
                <div className="admin-list-meta-grid">
                  <span>
                    <strong>Código</strong>
                    <span className="code-badge">{offer.couponCode}</span>
                  </span>
                  <span>
                    <strong>Activa hasta</strong>
                    {offer.hasEndsAt === false ? "Sin fecha límite" : formatDate(offer.endsAt)}
                  </span>
                  <span>
                    <strong>Canjes</strong>
                    {redemptionsByOffer[offer.id] ?? 0}
                  </span>
                </div>
                {offer.businessGoal ? (
                  <p className="admin-list-description">{offer.businessGoal}</p>
                ) : null}
              </div>
              <div className="admin-card-actions">
                <Button href={`/admin/ofertas/${offer.slug}`} variant="secondary">
                  Ver
                </Button>
                <Button href={`/admin/ofertas/${offer.slug}/editar`} variant="secondary">
                  Editar
                </Button>
                <form action={duplicateOfferWithSlug}>
                  <button className="button button-secondary" type="submit">
                    Duplicar
                  </button>
                </form>
                <form action={setOfferActiveAction}>
                  <input name="offer_id" type="hidden" value={offer.id} />
                  <input name="offer_slug" type="hidden" value={offer.slug} />
                  <input
                    name="is_active"
                    type="hidden"
                    value={nextIsActive ? "true" : "false"}
                  />
                  <input name="return_to" type="hidden" value={returnPath} />
                  <button className="button button-secondary" type="submit">
                    {offer.isActive ? "Desactivar" : "Activar"}
                  </button>
                </form>
              </div>
            </article>
          );
        })}
        {offers.length === 0 ? (
          <p className="empty-state">Todavía no hay ofertas.</p>
        ) : null}
        {offers.length > 0 && filteredOffers.length === 0 ? (
          <p className="empty-state">
            No hay ofertas que coincidan con estos filtros.
          </p>
        ) : null}
      </section>
    </div>
  );
}
