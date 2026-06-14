import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
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
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>Ofertas</h1>
          <p>Listado de solo lectura para revisar ofertas registradas.</p>
        </div>
        <div className="admin-heading-actions">
          <Button href="/admin/ofertas/nueva">Nueva oferta</Button>
          <Button href="/admin" variant="secondary">
            Volver al admin
          </Button>
        </div>
      </section>

      <section className="admin-stats" aria-label="Resumen de ofertas">
        <article className="admin-stat">
          <span>Ofertas registradas</span>
          <strong>{filteredOffers.length}</strong>
        </article>
        <article className="admin-stat">
          <span>Ofertas activas</span>
          <strong>
            {
              filteredOffers.filter(
                (offer) => getAdminOfferStatus(offer, now) === "active"
              ).length
            }
          </strong>
        </article>
        <article className="admin-stat">
          <span>Total de canjes</span>
          <strong>{filteredRedemptions.length}</strong>
        </article>
        <article className="admin-stat">
          <span>Oferta con más canjes</span>
          <strong>{topOfferRedemptions > 0 ? topOffer?.title : "Sin canjes"}</strong>
        </article>
      </section>

      <form action="/admin/ofertas" className="admin-filters" method="get">
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
        className="admin-table admin-offers-dashboard-table"
        aria-label="Listado admin de ofertas"
      >
        <div className="admin-table-row admin-table-head">
          <span>Oferta</span>
          <span>Comercio</span>
          <span>Código</span>
          <span>Activa hasta</span>
          <span>Canjes</span>
          <span>Estado</span>
        </div>
        {filteredOffers.map((offer) => {
          const offerStatus = getAdminOfferStatus(offer, now);

          return (
            <div className="admin-table-row" key={offer.id}>
              <span>
                <strong>
                  <Link href={`/admin/ofertas/${offer.slug}`}>{offer.title}</Link>
                </strong>
                <small>{offer.businessGoal}</small>
              </span>
              <span>{offer.merchant.name}</span>
              <span className="code-badge">{offer.couponCode}</span>
              <span>{formatDate(offer.endsAt)}</span>
              <span>{redemptionsByOffer[offer.id] ?? 0}</span>
              <span className={statusClasses[offerStatus]}>
                {statusLabels[offerStatus]}
              </span>
            </div>
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
