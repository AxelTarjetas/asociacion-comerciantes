import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { getAdminOfferBySlug } from "@/lib/queries/offers";
import {
  getAdminMerchants,
  updateOfferAction
} from "@/app/admin/ofertas/actions";

type EditOfferPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "missing-required-fields": "Faltan datos obligatorios: comercio, título y slug.",
  "invalid-dates": "La fecha fin debe ser posterior a la fecha de inicio.",
  "invalid-max-redemptions":
    "El máximo de canjes debe ser un número entero mayor que 0.",
  "supabase-not-configured":
    "Supabase admin no está configurado. Revisa NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
  "slug-unavailable": "Ya existe otra oferta con ese slug.",
  "offer-not-found": "No se encontró la oferta que intentas actualizar.",
  "update-failed": "No se pudo actualizar la oferta. Revisa los datos e inténtalo de nuevo."
};

const merchantsErrorMessages: Record<string, string> = {
  "supabase-not-configured":
    "Supabase admin no está configurado. No se pueden editar ofertas.",
  "merchants-load-failed": "No se pudieron cargar los comercios reales desde Supabase.",
  "admin-disabled": "El admin local temporal no está habilitado."
};

function toDateTimeLocal(value: string | undefined, hasValue = true) {
  if (!value || !hasValue) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export default async function EditOfferPage({
  params,
  searchParams
}: EditOfferPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const [{ slug }, queryParams, merchantsResult] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ error?: string }>({}),
    getAdminMerchants()
  ]);
  const offer = await getAdminOfferBySlug(slug);

  if (!offer) {
    notFound();
  }

  const updateOfferWithSlug = updateOfferAction.bind(null, offer.slug);
  const errorMessage = queryParams.error ? errorMessages[queryParams.error] : null;
  const merchantsErrorMessage = merchantsResult.error
    ? merchantsErrorMessages[merchantsResult.error]
    : null;
  const merchantOptions = merchantsResult.merchants.some(
    (merchant) => merchant.id === offer.merchantId
  )
    ? merchantsResult.merchants
    : [
        {
          id: offer.merchantId,
          name: offer.merchant.name,
          slug: offer.merchant.slug
        },
        ...merchantsResult.merchants
      ];
  const hasMerchants = merchantOptions.length > 0;

  return (
    <div className="page-shell admin-form-page">
      <section className="admin-detail-hero admin-form-hero">
        <div className="admin-detail-hero-main">
          <p className="eyebrow">Admin local temporal</p>
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
          <h1>Editar oferta</h1>
          <p>Actualiza el mensaje, el cupón, las fechas y la visibilidad.</p>
          <div className="admin-detail-context">
            <span>{offer.title}</span>
            <span>{offer.slug}</span>
          </div>
        </div>
        <div className="admin-detail-actions">
          <Button href={`/admin/ofertas/${offer.slug}`} variant="secondary">
            Volver al detalle
          </Button>
          <Button href="/admin/ofertas" variant="secondary">
            Volver a ofertas
          </Button>
        </div>
      </section>

      {merchantsErrorMessage ? (
        <p className="admin-form-error">{merchantsErrorMessage}</p>
      ) : null}
      {!merchantsErrorMessage && !hasMerchants ? (
        <p className="admin-form-error">Primero necesitas crear comercios en Supabase.</p>
      ) : null}
      {errorMessage ? <p className="admin-form-error">{errorMessage}</p> : null}

      {merchantsErrorMessage || !hasMerchants ? null : (
        <form className="admin-form admin-structured-form" action={updateOfferWithSlug}>
          <section className="admin-form-card" aria-label="Datos principales de la oferta">
            <div className="admin-form-card-header">
              <p className="eyebrow">Oferta</p>
              <h2>Datos principales</h2>
            </div>
            <div className="admin-form-grid">
              <label>
                <span>Título</span>
                <input name="title" required type="text" defaultValue={offer.title} />
                <small>Nombre corto y directo de la promoción.</small>
              </label>

              <label>
                <span>Slug</span>
                <input name="slug" required type="text" defaultValue={offer.slug} />
                <small>Se normaliza al guardar y debe ser único.</small>
              </label>

              <label>
                <span>Comercio asociado</span>
                <select name="merchant_id" required defaultValue={offer.merchantId}>
                  {merchantOptions.map((merchant) => (
                    <option key={merchant.id} value={merchant.id}>
                      {merchant.name}
                    </option>
                  ))}
                </select>
                <small>Solo se usan comercios reales cargados desde Supabase admin.</small>
              </label>

              <label>
                <span>Estado</span>
                <select name="is_active" defaultValue={offer.isActive ? "true" : "false"}>
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
                <small>Controla si aparece en la parte pública.</small>
              </label>
            </div>
          </section>

          <section className="admin-form-card" aria-label="Mensaje comercial">
            <div className="admin-form-card-header">
              <p className="eyebrow">Mensaje comercial</p>
              <h2>Qué comunica la promoción</h2>
            </div>
            <div className="admin-form-grid">
              <label className="admin-form-field-wide">
                <span>Descripción</span>
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={offer.description}
                />
                <small>Resumen público de la oferta.</small>
              </label>

              <label>
                <span>Promoción destacada</span>
                <input
                  name="featured_promotion"
                  type="text"
                  defaultValue={offer.featuredPromotion}
                />
                <small>Frase breve para destacar la oferta en listados.</small>
              </label>

              <label>
                <span>Objetivo comercial</span>
                <textarea
                  name="business_goal"
                  rows={3}
                  defaultValue={offer.businessGoal}
                />
                <small>Qué busca el comercio: visitas, prueba de producto o recurrencia.</small>
              </label>

              <label className="admin-form-field-wide">
                <span>Beneficio para el cliente</span>
                <textarea
                  name="customer_benefit"
                  rows={3}
                  defaultValue={offer.customerBenefit}
                />
                <small>Explica claramente qué gana la persona al usar el cupón.</small>
              </label>
            </div>
          </section>

          <section className="admin-form-card" aria-label="Cupón y condiciones">
            <div className="admin-form-card-header">
              <p className="eyebrow">Cupón</p>
              <h2>Código y límites</h2>
            </div>
            <div className="admin-form-grid">
              <label>
                <span>Código de cupón</span>
                <input name="coupon_code" type="text" defaultValue={offer.couponCode} />
                <small>Se guardará en mayúsculas para facilitar su uso en tienda.</small>
              </label>

              <label>
                <span>Límite de canjes</span>
                <input
                  min="1"
                  name="max_redemptions"
                  type="number"
                  defaultValue={offer.maxRedemptions ?? ""}
                />
                <small>Déjalo vacío si no quieres limitar los canjes.</small>
              </label>
            </div>
          </section>

          <section className="admin-form-card" aria-label="Fechas de la oferta">
            <div className="admin-form-card-header">
              <p className="eyebrow">Fechas</p>
              <h2>Periodo de visibilidad</h2>
            </div>
            <div className="admin-form-grid">
              <label>
                <span>Fecha de inicio</span>
                <input
                  name="starts_at"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(offer.startsAt)}
                />
                <small>Si queda vacía, la oferta puede empezar inmediatamente.</small>
              </label>

              <label>
                <span>Fecha de fin</span>
                <input
                  name="ends_at"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(offer.endsAt, offer.hasEndsAt !== false)}
                />
                <small>Debe ser posterior a la fecha de inicio si se informa.</small>
              </label>
            </div>
          </section>

          <div className="admin-form-actions admin-form-footer-actions">
            <button className="button button-primary" type="submit">
              Guardar cambios
            </button>
            <Button href={`/admin/ofertas/${offer.slug}`} variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
