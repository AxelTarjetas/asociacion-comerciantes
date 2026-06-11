import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import { getAdminOffers } from "@/lib/queries/offers";
import { getAdminCouponRedemptions } from "@/lib/queries/redemptions";

export default async function AdminOffersPage() {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

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
  const topOffer = offers.reduce<(typeof offers)[number] | null>(
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
          <strong>{offers.length}</strong>
        </article>
        <article className="admin-stat">
          <span>Ofertas activas</span>
          <strong>{offers.filter((offer) => offer.isActive).length}</strong>
        </article>
        <article className="admin-stat">
          <span>Total de canjes</span>
          <strong>{redemptions.length}</strong>
        </article>
        <article className="admin-stat">
          <span>Oferta con más canjes</span>
          <strong>{topOfferRedemptions > 0 ? topOffer?.title : "Sin canjes"}</strong>
        </article>
      </section>

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
        {offers.map((offer) => (
          <div className="admin-table-row" key={offer.id}>
            <span>
              <strong>{offer.title}</strong>
              <small>{offer.businessGoal}</small>
            </span>
            <span>{offer.merchant.name}</span>
            <span className="code-badge">{offer.couponCode}</span>
            <span>{formatDate(offer.endsAt)}</span>
            <span>{redemptionsByOffer[offer.id] ?? 0}</span>
            <span
              className={
                offer.isActive
                  ? "status-badge status-badge-active"
                  : "status-badge status-badge-inactive"
              }
            >
              {offer.isActive ? "Activa" : "Inactiva"}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
