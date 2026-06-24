import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import {
  formatDate,
  getGoogleMapsSearchUrl,
  getMerchantLocationQuality
} from "@/lib/utils";
import { setMerchantActiveAction } from "@/app/admin/comercios/actions";
import { getAdminMerchantBySlug } from "@/lib/queries/merchants";
import { getAdminOffersByMerchantId } from "@/lib/queries/offers";
import { getAdminCouponRedemptions } from "@/lib/queries/redemptions";

type AdminMerchantDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    updated?: string;
    statusUpdated?: string;
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "supabase-not-configured":
    "Supabase admin no está configurado. No se puede cambiar el estado del comercio.",
  "status-update-failed":
    "No se pudo actualizar el estado del comercio. Revisa Supabase e inténtalo de nuevo."
};

function formatOfferEndDate(endsAt: string, hasEndsAt?: boolean) {
  return hasEndsAt === false ? "Sin fecha límite" : formatDate(endsAt);
}

function getLocationQualityLabel(quality: ReturnType<typeof getMerchantLocationQuality>) {
  if (quality === "complete") {
    return "Ubicaci\u00f3n completa";
  }

  return quality === "incomplete" ? "Ubicaci\u00f3n incompleta" : "Sin ubicaci\u00f3n";
}

export default async function AdminMerchantDetailPage({
  params,
  searchParams
}: AdminMerchantDetailPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const { slug } = await params;
  const { updated, statusUpdated, error } = searchParams ? await searchParams : {};
  const merchant = await getAdminMerchantBySlug(slug);

  if (!merchant) {
    notFound();
  }

  const nextIsActive = merchant.isActive === false;
  const locationQuality = getMerchantLocationQuality(merchant.address, merchant.city);
  const directionsUrl =
    locationQuality === "complete"
      ? getGoogleMapsSearchUrl(merchant.address, merchant.city)
      : null;
  const errorMessage = error ? errorMessages[error] : null;
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
  const activeOffers = offers.filter((offer) => offer.isActive);
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
    <div className="page-shell admin-detail-page">
      <section className="admin-detail-hero">
        <div className="admin-detail-hero-main">
          <p className="eyebrow">Admin temporal local</p>
          <div className="admin-detail-badges">
            <span
              className={
                merchant.isActive === false
                  ? "status-badge status-badge-inactive"
                  : "status-badge status-badge-active"
              }
            >
              {merchant.isActive === false ? "Inactivo" : "Activo"}
            </span>
            <span className="status-badge status-badge-muted">
              {merchant.category.name}
            </span>
          </div>
          <h1>{merchant.name}</h1>
          <p>{merchant.description || "Sin descripción registrada."}</p>
          <div className="admin-detail-context">
            <span>{merchant.city || "Sin zona"}</span>
            <span>{merchant.address || "Sin dirección"}</span>
          </div>
        </div>
        <div className="admin-detail-actions">
          <Button href={`/admin/comercios/${merchant.slug}/editar`}>
            Editar comercio
          </Button>
          <form action={setMerchantActiveAction}>
            <input name="merchant_id" type="hidden" value={merchant.id} />
            <input name="merchant_slug" type="hidden" value={merchant.slug} />
            <input
              name="is_active"
              type="hidden"
              value={nextIsActive ? "true" : "false"}
            />
            <input
              name="return_to"
              type="hidden"
              value={`/admin/comercios/${merchant.slug}?statusUpdated=1`}
            />
            <button className="button button-secondary" type="submit">
              {merchant.isActive === false ? "Activar" : "Desactivar"}
            </button>
          </form>
          <Button href={`/comercios/${merchant.slug}`} variant="secondary">
            Ver página pública
          </Button>
          <Button href="/admin/comercios" variant="secondary">
            Volver a comercios
          </Button>
        </div>
      </section>

      {updated === "1" ? (
        <p className="admin-form-success">Comercio actualizado correctamente.</p>
      ) : null}
      {statusUpdated === "1" ? (
        <p className="admin-form-success">Estado del comercio actualizado.</p>
      ) : null}
      {errorMessage ? <p className="admin-form-error">{errorMessage}</p> : null}

      <section className="admin-list-summary" aria-label="Resumen del comercio">
        <article>
          <span>Total ofertas</span>
          <strong>{offers.length}</strong>
          <small>registradas</small>
        </article>
        <article>
          <span>Activas</span>
          <strong>{activeOffers.length}</strong>
          <small>visibles si están vigentes</small>
        </article>
        <article>
          <span>Canjes</span>
          <strong>{merchantRedemptions.length}</strong>
          <small>del comercio</small>
        </article>
        <article>
          <span>Top oferta</span>
          <strong>{topOfferRedemptions > 0 ? topOfferRedemptions : "0"}</strong>
          <small>{topOfferRedemptions > 0 ? topOffer?.title : "Sin canjes"}</small>
        </article>
      </section>

      <section className="admin-detail-card-section" aria-label="Ubicaci\u00f3n del comercio">
        <div className="admin-detail-section-header">
          <div>
            <p className="eyebrow">{"Ubicaci\u00f3n"}</p>
            <h2>{"Direcci\u00f3n para llegar"}</h2>
          </div>
          <span className={`location-quality-badge location-quality-badge-${locationQuality}`}>
            {getLocationQualityLabel(locationQuality)}
          </span>
        </div>
        <article className="admin-location-quality-card">
          <div className="admin-location-quality-details">
            <div>
              <span>{"Direcci\u00f3n"}</span>
              <strong>{merchant.address || "Sin direcci\u00f3n"}</strong>
            </div>
            <div>
              <span>Ciudad / zona</span>
              <strong>{merchant.city || "Sin ciudad o zona"}</strong>
            </div>
          </div>
          {directionsUrl ? (
            <a
              className="button button-secondary"
              href={directionsUrl}
              rel="noreferrer"
              target="_blank"
            >
              Probar en Google Maps
            </a>
          ) : (
            <div className="admin-location-quality-warning">
              <p>{"Falta direcci\u00f3n o ciudad para que C\u00f3mo llegar sea fiable."}</p>
              <Button href={`/admin/comercios/${merchant.slug}/editar`} variant="secondary">
                Editar comercio
              </Button>
            </div>
          )}
        </article>
      </section>

      <section className="admin-detail-card-section" aria-label="Datos del comercio">
        <div className="admin-detail-section-header">
          <div>
            <p className="eyebrow">Ficha</p>
            <h2>Datos principales</h2>
          </div>
        </div>
        <div className="admin-detail-grid">
          <article className="admin-detail-item">
            <span>Categoría</span>
            <strong>{merchant.category.name}</strong>
          </article>
          <article className="admin-detail-item">
            <span>Zona</span>
            <strong>{merchant.city || "Sin zona"}</strong>
          </article>
          <article className="admin-detail-item">
            <span>Dirección</span>
            <strong>{merchant.address || "Sin dirección"}</strong>
          </article>
          <article className="admin-detail-item">
            <span>Teléfono</span>
            <strong>{merchant.phone || "Sin teléfono"}</strong>
          </article>
          <article className="admin-detail-item">
            <span>Web</span>
            <strong>
              {merchant.websiteUrl ? (
                <Link href={merchant.websiteUrl}>{merchant.websiteUrl}</Link>
              ) : (
                "Sin web"
              )}
            </strong>
          </article>
          <article className="admin-detail-item">
            <span>Slug</span>
            <strong>{merchant.slug}</strong>
          </article>
        </div>
      </section>

      <section className="admin-detail-card-section" aria-label="Ofertas del comercio">
        <div className="admin-detail-section-header">
          <div>
            <p className="eyebrow">Ofertas</p>
            <h2>Promociones del comercio</h2>
          </div>
          <Button href="/admin/ofertas/nueva" variant="secondary">
            Nueva oferta
          </Button>
        </div>
        <div className="admin-list-section">
          {offers.map((offer) => (
            <article className="admin-list-card admin-detail-list-card" key={offer.id}>
              <div className="admin-list-card-main">
                <div className="admin-list-card-title-row">
                  <span
                    className={
                      offer.isActive
                        ? "status-badge status-badge-active"
                        : "status-badge status-badge-inactive"
                    }
                  >
                    {offer.isActive ? "Activa" : "Inactiva"}
                  </span>
                  <span className="admin-list-card-kicker">
                    {redemptionsByOffer[offer.id] ?? 0} canjes
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
                    {formatOfferEndDate(offer.endsAt, offer.hasEndsAt)}
                  </span>
                  <span>
                    <strong>Objetivo</strong>
                    {offer.businessGoal || "Sin objetivo"}
                  </span>
                </div>
              </div>
              <div className="admin-card-actions">
                <Button href={`/admin/ofertas/${offer.slug}`} variant="secondary">
                  Ver
                </Button>
                <Button href={`/admin/ofertas/${offer.slug}/editar`} variant="secondary">
                  Editar
                </Button>
              </div>
            </article>
          ))}
          {offers.length === 0 ? (
            <p className="empty-state">Este comercio todavía no tiene ofertas.</p>
          ) : null}
        </div>
      </section>

      <section className="admin-detail-card-section" aria-label="Canjes del comercio">
        <div className="admin-detail-section-header">
          <div>
            <p className="eyebrow">Resultados</p>
            <h2>Canjes del comercio</h2>
          </div>
        </div>
        <div className="admin-list-section">
          {merchantRedemptions.map((redemption) => (
            <article className="admin-list-card admin-redemption-list-card" key={redemption.id}>
              <div className="admin-list-card-main">
                <div className="admin-list-card-title-row">
                  <span className="status-badge status-badge-active">Canjeado</span>
                  <span className="admin-list-card-kicker">
                    {formatDate(redemption.redeemedAt)}
                  </span>
                </div>
                <h2>{redemption.offerTitle}</h2>
                <small className="admin-list-slug">
                  {redemption.offerSlug || "Sin slug de oferta"}
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
          {merchantRedemptions.length === 0 ? (
            <p className="empty-state">
              Este comercio todavía no tiene canjes registrados.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
