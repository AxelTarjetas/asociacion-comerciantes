import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import { getAdminCouponRedemptions } from "@/lib/queries/redemptions";

export default async function AdminRedemptionsPage() {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const redemptions = await getAdminCouponRedemptions();
  const merchantsWithRedemptions = new Set(
    redemptions.map((redemption) => redemption.merchantId)
  ).size;
  const offersWithRedemptions = new Set(
    redemptions.map((redemption) => redemption.offerId)
  ).size;
  const latestRedemption = redemptions[0];

  return (
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>Canjes</h1>
          <p>Lectura simple de cupones usados para validar medición del MVP.</p>
        </div>
        <Button href="/admin" variant="secondary">
          Volver al admin
        </Button>
      </section>

      <section className="admin-stats" aria-label="Resumen de canjes">
        <article className="admin-stat">
          <span>Total de canjes</span>
          <strong>{redemptions.length}</strong>
        </article>
        <article className="admin-stat">
          <span>Comercios con canjes</span>
          <strong>{merchantsWithRedemptions}</strong>
        </article>
        <article className="admin-stat">
          <span>Ofertas con canjes</span>
          <strong>{offersWithRedemptions}</strong>
        </article>
        <article className="admin-stat">
          <span>Último canje</span>
          <strong>
            {latestRedemption ? formatDate(latestRedemption.redeemedAt) : "Sin datos"}
          </strong>
        </article>
      </section>

      <section
        className="admin-table admin-redemptions-table"
        aria-label="Listado admin de canjes"
      >
        <div className="admin-table-row admin-table-head">
          <span>Oferta</span>
          <span>Comercio</span>
          <span>Código</span>
          <span>Fecha</span>
          <span>Notas</span>
        </div>
        {redemptions.map((redemption) => (
          <div className="admin-table-row" key={redemption.id}>
            <span>
              <strong>{redemption.offerTitle}</strong>
              <small>{redemption.offerSlug || "Sin slug de oferta"}</small>
            </span>
            <span>
              <strong>{redemption.merchantName}</strong>
              <small>{redemption.merchantSlug || "Sin slug de comercio"}</small>
            </span>
            <span className="code-badge">{redemption.couponCode}</span>
            <span>{formatDate(redemption.redeemedAt)}</span>
            <span>{redemption.notes ?? "Sin notas"}</span>
          </div>
        ))}
        {redemptions.length === 0 ? (
          <p className="empty-state">Todavía no hay canjes registrados.</p>
        ) : null}
      </section>
    </div>
  );
}
