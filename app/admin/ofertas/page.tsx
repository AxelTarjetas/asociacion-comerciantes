import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import { getOffers } from "@/lib/queries/offers";

export default async function AdminOffersPage() {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const offers = await getOffers();

  return (
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>Ofertas activas</h1>
          <p>Listado de solo lectura para revisar campañas, códigos y comercios.</p>
        </div>
        <div className="admin-heading-actions">
          <Button href="/admin/ofertas/nueva">Nueva oferta</Button>
          <Button href="/admin" variant="secondary">
            Volver al admin
          </Button>
        </div>
      </section>

      <section className="admin-table" aria-label="Listado admin de ofertas">
        <div className="admin-table-row admin-table-head">
          <span>Oferta</span>
          <span>Comercio</span>
          <span>Código</span>
          <span>Activa hasta</span>
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
          </div>
        ))}
      </section>
    </div>
  );
}
