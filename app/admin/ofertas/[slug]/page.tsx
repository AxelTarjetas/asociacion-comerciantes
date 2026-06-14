import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import { getAdminOfferBySlug } from "@/lib/queries/offers";
import { getAdminCouponRedemptions } from "@/lib/queries/redemptions";

type AdminOfferDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    updated?: string;
  }>;
};

function formatOptionalDate(date: string | undefined) {
  return date ? formatDate(date) : "Sin fecha";
}

export default async function AdminOfferDetailPage({
  params,
  searchParams
}: AdminOfferDetailPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const [{ slug }, queryParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ updated?: string }>({})
  ]);
  const offer = await getAdminOfferBySlug(slug);

  if (!offer) {
    notFound();
  }

  const redemptions = await getAdminCouponRedemptions();
  const offerRedemptions = redemptions.filter(
    (redemption) => redemption.offerId === offer.id
  );
  const latestRedemptions = offerRedemptions.slice(0, 5);

  return (
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>{offer.title}</h1>
          <p>{offer.description || "Sin descripción registrada."}</p>
        </div>
        <div className="admin-heading-actions">
          <Button href={`/admin/ofertas/${offer.slug}/editar`}>
            Editar oferta
          </Button>
          <Button href="/admin/ofertas" variant="secondary">
            Volver a ofertas
          </Button>
        </div>
      </section>

      {queryParams.updated === "1" ? (
        <p className="admin-form-success">Oferta actualizada correctamente.</p>
      ) : null}

      <section className="admin-detail-grid" aria-label="Datos de la oferta">
        <article className="admin-detail-item">
          <span>Comercio</span>
          <strong>
            <Link href={`/admin/comercios/${offer.merchant.slug}`}>
              {offer.merchant.name}
            </Link>
          </strong>
        </article>
        <article className="admin-detail-item">
          <span>Estado</span>
          <strong
            className={
              offer.isActive
                ? "status-badge status-badge-active"
                : "status-badge status-badge-inactive"
            }
          >
            {offer.isActive ? "Activa" : "Inactiva"}
          </strong>
        </article>
        <article className="admin-detail-item">
          <span>Código</span>
          <strong className="code-badge">{offer.couponCode || "Sin código"}</strong>
        </article>
        <article className="admin-detail-item">
          <span>Inicio</span>
          <strong>{formatOptionalDate(offer.startsAt)}</strong>
        </article>
        <article className="admin-detail-item">
          <span>Fin</span>
          <strong>{formatDate(offer.endsAt)}</strong>
        </article>
        <article className="admin-detail-item">
          <span>Máximo de canjes</span>
          <strong>{offer.maxRedemptions ?? "Sin límite"}</strong>
        </article>
      </section>

      <section className="admin-stats" aria-label="Resumen de la oferta">
        <article className="admin-stat">
          <span>Total de canjes</span>
          <strong>{offerRedemptions.length}</strong>
        </article>
        <article className="admin-stat">
          <span>Canjes disponibles</span>
          <strong>
            {offer.maxRedemptions
              ? Math.max(offer.maxRedemptions - offerRedemptions.length, 0)
              : "Sin límite"}
          </strong>
        </article>
        <article className="admin-stat">
          <span>Último canje</span>
          <strong>
            {latestRedemptions[0]
              ? formatDate(latestRedemptions[0].redeemedAt)
              : "Sin canjes"}
          </strong>
        </article>
      </section>

      <section className="admin-table" aria-label="Información comercial de la oferta">
        <div className="admin-table-row admin-table-head">
          <span>Beneficio cliente</span>
          <span>Objetivo comercial</span>
          <span>Promoción destacada</span>
          <span>Token QR</span>
        </div>
        <div className="admin-table-row">
          <span>{offer.customerBenefit || "Sin beneficio registrado"}</span>
          <span>{offer.businessGoal || "Sin objetivo registrado"}</span>
          <span>{offer.featuredPromotion || "Sin promoción destacada"}</span>
          <span>{offer.qrToken || "Sin token"}</span>
        </div>
      </section>

      <section className="admin-table" aria-label="Últimos canjes de la oferta">
        <div className="admin-table-row admin-table-head">
          <span>Comercio</span>
          <span>Código</span>
          <span>Fecha</span>
          <span>Notas</span>
        </div>
        {latestRedemptions.map((redemption) => (
          <div className="admin-table-row" key={redemption.id}>
            <span>
              <strong>{redemption.merchantName}</strong>
              <small>{redemption.merchantSlug || "Sin slug de comercio"}</small>
            </span>
            <span className="code-badge">{redemption.couponCode}</span>
            <span>{formatDate(redemption.redeemedAt)}</span>
            <span>{redemption.notes ?? "Sin notas"}</span>
          </div>
        ))}
        {latestRedemptions.length === 0 ? (
          <p className="empty-state">
            Esta oferta todavía no tiene canjes registrados.
          </p>
        ) : null}
      </section>
    </div>
  );
}
