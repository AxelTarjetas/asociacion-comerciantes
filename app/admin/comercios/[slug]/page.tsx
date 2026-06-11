import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import { getAdminMerchantBySlug } from "@/lib/queries/merchants";
import { getAdminOffersByMerchantId } from "@/lib/queries/offers";
import { getAdminCouponRedemptions } from "@/lib/queries/redemptions";

type AdminMerchantDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AdminMerchantDetailPage({
  params
}: AdminMerchantDetailPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const { slug } = await params;
  const merchant = await getAdminMerchantBySlug(slug);

  if (!merchant) {
    notFound();
  }

  const [offers, redemptions] = await Promise.all([
    getAdminOffersByMerchantId(merchant.id),
    getAdminCouponRedemptions()
  ]);
  const merchantRedemptions = redemptions.filter(
    (redemption) => redemption.merchantId === merchant.id
  );
  const redemptionsByOffer = merchantRedemptions.reduce<Record<string, number>>(
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
          <h1>{merchant.name}</h1>
          <p>{merchant.description || "Sin descripción registrada."}</p>
        </div>
        <Button href="/admin/comercios" variant="secondary">
          Volver a comercios
        </Button>
      </section>

      <section className="admin-detail-grid" aria-label="Datos del comercio">
        <article className="admin-detail-item">
          <span>Categoría</span>
          <strong>{merchant.category.name}</strong>
        </article>
        <article className="admin-detail-item">
          <span>Dirección</span>
          <strong>{merchant.address || "Sin dirección"}</strong>
        </article>
        <article className="admin-detail-item">
          <span>Teléfono</span>
          <strong>{merchant.phone || "Sin teléfono"}</strong>
        </article>
      </section>

      <section className="admin-stats" aria-label="Resumen del comercio">
        <article className="admin-stat">
          <span>Total de ofertas</span>
          <strong>{offers.length}</strong>
        </article>
        <article className="admin-stat">
          <span>Ofertas activas</span>
          <strong>{offers.filter((offer) => offer.isActive).length}</strong>
        </article>
        <article className="admin-stat">
          <span>Total de canjes</span>
          <strong>{merchantRedemptions.length}</strong>
        </article>
        <article className="admin-stat">
          <span>Oferta con más canjes</span>
          <strong>{topOfferRedemptions > 0 ? topOffer?.title : "Sin canjes"}</strong>
        </article>
      </section>

      <section className="admin-table admin-offers-table" aria-label="Ofertas del comercio">
        <div className="admin-table-row admin-table-head">
          <span>Oferta</span>
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
        {offers.length === 0 ? (
          <p className="empty-state">Este comercio todavía no tiene ofertas.</p>
        ) : null}
      </section>

      <section className="admin-table" aria-label="Canjes del comercio">
        <div className="admin-table-row admin-table-head">
          <span>Oferta</span>
          <span>Código</span>
          <span>Fecha</span>
          <span>Notas</span>
        </div>
        {merchantRedemptions.map((redemption) => (
          <div className="admin-table-row" key={redemption.id}>
            <span>
              <strong>{redemption.offerTitle}</strong>
              <small>{redemption.offerSlug || "Sin slug de oferta"}</small>
            </span>
            <span className="code-badge">{redemption.couponCode}</span>
            <span>{formatDate(redemption.redeemedAt)}</span>
            <span>{redemption.notes ?? "Sin notas"}</span>
          </div>
        ))}
        {merchantRedemptions.length === 0 ? (
          <p className="empty-state">
            Este comercio todavía no tiene canjes registrados.
          </p>
        ) : null}
      </section>
    </div>
  );
}
