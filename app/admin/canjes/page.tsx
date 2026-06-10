import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import { getCouponRedemptions } from "@/lib/queries/redemptions";

export default async function AdminRedemptionsPage() {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const redemptions = await getCouponRedemptions();

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

      <section className="admin-table" aria-label="Listado admin de canjes">
        <div className="admin-table-row admin-table-head">
          <span>Oferta</span>
          <span>Comercio</span>
          <span>Código</span>
          <span>Fecha</span>
        </div>
        {redemptions.map((redemption) => (
          <div className="admin-table-row" key={redemption.id}>
            <span>
              <strong>{redemption.offerTitle}</strong>
              <small>{redemption.notes ?? "Sin notas"}</small>
            </span>
            <span>{redemption.merchantName}</span>
            <span className="code-badge">{redemption.couponCode}</span>
            <span>{formatDate(redemption.redeemedAt)}</span>
          </div>
        ))}
        {redemptions.length === 0 ? (
          <p className="empty-state">Todavía no hay canjes registrados.</p>
        ) : null}
      </section>
    </div>
  );
}
