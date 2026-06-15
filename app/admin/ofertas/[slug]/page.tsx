import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import {
  duplicateOfferAction,
  setOfferActiveAction
} from "@/app/admin/ofertas/actions";
import { getAdminOfferBySlug } from "@/lib/queries/offers";
import { getAdminCouponRedemptions } from "@/lib/queries/redemptions";

type AdminOfferDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    updated?: string;
    duplicated?: string;
    statusUpdated?: string;
    error?: string;
  }>;
};

function formatOptionalDate(date: string | undefined) {
  return date ? formatDate(date) : "Sin fecha";
}

function formatOfferEndDate(endsAt: string, hasEndsAt?: boolean) {
  return hasEndsAt === false ? "Sin fecha límite" : formatDate(endsAt);
}

const errorMessages: Record<string, string> = {
  "supabase-not-configured":
    "Supabase admin no está configurado. No se puede duplicar la oferta.",
  "slug-unavailable":
    "No se pudo generar un slug o QR disponible para duplicar esta oferta.",
  "duplicate-failed": "No se pudo duplicar la oferta. Revisa Supabase e inténtalo de nuevo.",
  "status-update-failed":
    "No se pudo actualizar el estado de la oferta. Revisa Supabase e inténtalo de nuevo."
};

export default async function AdminOfferDetailPage({
  params,
  searchParams
}: AdminOfferDetailPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const [{ slug }, queryParams] = await Promise.all([
    params,
    searchParams ??
      Promise.resolve<{
        updated?: string;
        duplicated?: string;
        statusUpdated?: string;
        error?: string;
      }>({})
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
  const duplicateOfferWithSlug = duplicateOfferAction.bind(null, offer.slug);
  const nextIsActive = !offer.isActive;
  const errorMessage = queryParams.error ? errorMessages[queryParams.error] : null;
  const remainingRedemptions = offer.maxRedemptions
    ? Math.max(offer.maxRedemptions - offerRedemptions.length, 0)
    : null;

  return (
    <div className="page-shell admin-detail-page">
      <section className="admin-detail-hero">
        <div className="admin-detail-hero-main">
          <p className="eyebrow">Admin temporal local</p>
          <div className="admin-detail-badges">
            <span
              className={
                offer.isActive
                  ? "status-badge status-badge-active"
                  : "status-badge status-badge-inactive"
              }
            >
              {offer.isActive ? "Activa" : "Inactiva"}
            </span>
            <span className="status-badge status-badge-muted">
              {offer.merchant.name}
            </span>
          </div>
          <h1>{offer.title}</h1>
          <p>{offer.description || "Sin descripción registrada."}</p>
          <div className="admin-detail-context">
            <Link href={`/admin/comercios/${offer.merchant.slug}`}>
              {offer.merchant.name}
            </Link>
            <span>{offer.couponCode || "Sin código"}</span>
          </div>
        </div>
        <div className="admin-detail-actions">
          <Button href={`/admin/ofertas/${offer.slug}/editar`}>
            Editar oferta
          </Button>
          <form action={duplicateOfferWithSlug}>
            <button className="button button-secondary" type="submit">
              Duplicar oferta
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
            <input
              name="return_to"
              type="hidden"
              value={`/admin/ofertas/${offer.slug}?statusUpdated=1`}
            />
            <button className="button button-secondary" type="submit">
              {offer.isActive ? "Desactivar" : "Activar"}
            </button>
          </form>
          <Button href={`/ofertas/${offer.slug}`} variant="secondary">
            Ver página pública
          </Button>
          <Button href="/admin/ofertas" variant="secondary">
            Volver a ofertas
          </Button>
        </div>
      </section>

      {queryParams.updated === "1" ? (
        <p className="admin-form-success">Oferta actualizada correctamente.</p>
      ) : null}
      {queryParams.duplicated === "1" ? (
        <p className="admin-form-success">
          Oferta duplicada correctamente. Revísala antes de activarla.
        </p>
      ) : null}
      {queryParams.statusUpdated === "1" ? (
        <p className="admin-form-success">Estado de la oferta actualizado.</p>
      ) : null}
      {errorMessage ? <p className="admin-form-error">{errorMessage}</p> : null}

      <section className="admin-list-summary" aria-label="Resumen de la oferta">
        <article>
          <span>Total canjes</span>
          <strong>{offerRedemptions.length}</strong>
          <small>registrados</small>
        </article>
        <article>
          <span>Disponibles</span>
          <strong>{remainingRedemptions ?? "Sin límite"}</strong>
          <small>según máximo configurado</small>
        </article>
        <article>
          <span>Último canje</span>
          <strong>
            {latestRedemptions[0]
              ? formatDate(latestRedemptions[0].redeemedAt)
              : "Sin canjes"}
          </strong>
          <small>actividad reciente</small>
        </article>
        <article>
          <span>Estado</span>
          <strong>{offer.isActive ? "Activa" : "Inactiva"}</strong>
          <small>visibilidad pública</small>
        </article>
      </section>

      <section className="admin-detail-card-section" aria-label="Datos de la oferta">
        <div className="admin-detail-section-header">
          <div>
            <p className="eyebrow">Oferta</p>
            <h2>Condiciones y cupón</h2>
          </div>
        </div>
        <div className="admin-detail-grid">
          <article className="admin-detail-item">
            <span>Comercio</span>
            <strong>
              <Link href={`/admin/comercios/${offer.merchant.slug}`}>
                {offer.merchant.name}
              </Link>
            </strong>
          </article>
          <article className="admin-detail-item">
            <span>Código</span>
            <strong className="code-badge">{offer.couponCode || "Sin código"}</strong>
          </article>
          <article className="admin-detail-item">
            <span>Token QR</span>
            <strong>{offer.qrToken || "Sin token"}</strong>
          </article>
          <article className="admin-detail-item">
            <span>Inicio</span>
            <strong>{formatOptionalDate(offer.startsAt)}</strong>
          </article>
          <article className="admin-detail-item">
            <span>Fin</span>
            <strong>{formatOfferEndDate(offer.endsAt, offer.hasEndsAt)}</strong>
          </article>
          <article className="admin-detail-item">
            <span>Máximo de canjes</span>
            <strong>{offer.maxRedemptions ?? "Sin límite"}</strong>
          </article>
        </div>
      </section>

      <section
        className="admin-detail-card-section"
        aria-label="Información comercial de la oferta"
      >
        <div className="admin-detail-section-header">
          <div>
          <p className="eyebrow">Mensaje comercial</p>
            <h2>Beneficio y objetivo</h2>
          </div>
        </div>
        <div className="admin-detail-info-grid">
          <article className="admin-detail-info-card">
            <span>Beneficio cliente</span>
            <p>{offer.customerBenefit || "Sin beneficio registrado"}</p>
          </article>
          <article className="admin-detail-info-card">
            <span>Objetivo comercial</span>
            <p>{offer.businessGoal || "Sin objetivo registrado"}</p>
          </article>
          <article className="admin-detail-info-card">
            <span>Promoción destacada</span>
            <p>{offer.featuredPromotion || "Sin promoción destacada"}</p>
          </article>
        </div>
      </section>

      <section className="admin-detail-card-section" aria-label="Ultimos canjes de la oferta">
        <div className="admin-detail-section-header">
          <div>
            <p className="eyebrow">Resultados</p>
            <h2>Últimos canjes</h2>
          </div>
        </div>
        <div className="admin-list-section">
          {latestRedemptions.map((redemption) => (
            <article className="admin-list-card admin-redemption-list-card" key={redemption.id}>
              <div className="admin-list-card-main">
                <div className="admin-list-card-title-row">
                  <span className="status-badge status-badge-active">Canjeado</span>
                  <span className="admin-list-card-kicker">
                    {formatDate(redemption.redeemedAt)}
                  </span>
                </div>
                <h2>{redemption.merchantName}</h2>
                <small className="admin-list-slug">
                  {redemption.merchantSlug || "Sin slug de comercio"}
                </small>
                <div className="admin-list-meta-grid">
                  <span>
                    <strong>Código</strong>
                    <span className="code-badge">{redemption.couponCode}</span>
                  </span>
                  <span>
                    <strong>Fecha</strong>
                    {formatDate(redemption.redeemedAt)}
                  </span>
                  <span>
                    <strong>Notas</strong>
                    {redemption.notes ?? "Sin notas"}
                  </span>
                </div>
              </div>
            </article>
          ))}
          {latestRedemptions.length === 0 ? (
            <p className="empty-state">
              Esta oferta todavía no tiene canjes registrados.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
