import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import {
  createOfferAction,
  getAdminMerchants
} from "@/app/admin/ofertas/actions";

type NewOfferPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "missing-required-fields": "Faltan datos obligatorios: comercio, título y código.",
  "invalid-dates": "La fecha fin debe ser posterior a la fecha de inicio.",
  "supabase-not-configured":
    "Supabase admin no está configurado. Revisa NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
  "slug-unavailable":
    "No se pudo generar un slug o QR disponible para esta oferta. Prueba con un título más específico.",
  "create-failed":
    "No se pudo crear la oferta. Revisa que el slug o QR no existan ya y que el comercio sea válido."
};

const merchantsErrorMessages: Record<string, string> = {
  "supabase-not-configured":
    "Supabase admin no está configurado. No se pueden crear ofertas.",
  "merchants-load-failed": "No se pudieron cargar los comercios reales desde Supabase.",
  "admin-disabled": "El admin local temporal no está habilitado."
};

export default async function NewOfferPage({ searchParams }: NewOfferPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const [params, merchantsResult] = await Promise.all([
    searchParams ?? Promise.resolve<{ error?: string }>({}),
    getAdminMerchants()
  ]);
  const { error } = params;
  const errorMessage = error ? errorMessages[error] : null;
  const merchantsErrorMessage = merchantsResult.error
    ? merchantsErrorMessages[merchantsResult.error]
    : null;
  const hasMerchants = merchantsResult.merchants.length > 0;

  return (
    <div className="page-shell admin-form-page">
      <section className="admin-detail-hero admin-form-hero">
        <div className="admin-detail-hero-main">
          <p className="eyebrow">Admin local temporal</p>
          <h1>Nueva oferta</h1>
          <p>
            Prepara una promoción clara, con cupón medible y fechas de publicación.
          </p>
          <div className="admin-detail-context">
            <span>El slug y el QR se generan automáticamente desde el título.</span>
          </div>
        </div>
        <div className="admin-detail-actions">
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
        <form className="admin-form admin-structured-form" action={createOfferAction}>
          <section className="admin-form-card" aria-label="Datos principales de la oferta">
            <div className="admin-form-card-header">
              <p className="eyebrow">Oferta</p>
              <h2>Datos principales</h2>
            </div>
            <div className="admin-form-grid">
              <label>
                <span>Título</span>
                <input name="title" required type="text" />
                <small>Nombre corto y directo de la promoción.</small>
              </label>

              <label>
                <span>Comercio asociado</span>
                <select name="merchant_id" required defaultValue="">
                  <option value="" disabled>
                    Selecciona un comercio
                  </option>
                  {merchantsResult.merchants.map((merchant) => (
                    <option key={merchant.id} value={merchant.id}>
                      {merchant.name}
                    </option>
                  ))}
                </select>
                <small>Solo se usan comercios reales cargados desde Supabase admin.</small>
              </label>

              <label>
                <span>Estado</span>
                <select name="is_active" defaultValue="true">
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
                <small>Las ofertas inactivas no aparecen en la parte pública.</small>
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
                <textarea name="description" rows={4} />
                <small>Resumen público de la oferta.</small>
              </label>

              <label>
                <span>Promoción destacada</span>
                <input name="featured_promotion" type="text" />
                <small>Frase breve para destacar la oferta en listados.</small>
              </label>

              <label>
                <span>Objetivo comercial</span>
                <textarea name="business_goal" rows={3} />
                <small>Qué busca el comercio: visitas, prueba de producto o recurrencia.</small>
              </label>

              <label className="admin-form-field-wide">
                <span>Beneficio para el cliente</span>
                <textarea name="customer_benefit" rows={3} />
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
                <input name="coupon_code" required type="text" />
                <small>Se guardará en mayúsculas para facilitar su uso en tienda.</small>
              </label>

              <label>
                <span>Límite de canjes</span>
                <input min="1" name="max_redemptions" type="number" />
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
                <input name="starts_at" type="datetime-local" />
                <small>Si queda vacía, la oferta puede empezar inmediatamente.</small>
              </label>

              <label>
                <span>Fecha de fin</span>
                <input name="ends_at" type="datetime-local" />
                <small>Debe ser posterior a la fecha de inicio si se informa.</small>
              </label>
            </div>
          </section>

          <div className="admin-form-actions admin-form-footer-actions">
            <button className="button button-primary" type="submit">
              Crear oferta
            </button>
            <Button href="/admin/ofertas" variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
