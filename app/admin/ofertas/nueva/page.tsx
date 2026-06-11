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
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin local temporal</p>
          <h1>Nueva oferta</h1>
          <p>
            Creación mínima desde servidor para desarrollo local. No es auth real ni un
            panel de producción.
          </p>
        </div>
        <Button href="/admin/ofertas" variant="secondary">
          Volver a ofertas
        </Button>
      </section>

      {merchantsErrorMessage ? (
        <p className="admin-form-error">{merchantsErrorMessage}</p>
      ) : null}
      {!merchantsErrorMessage && !hasMerchants ? (
        <p className="admin-form-error">Primero necesitas crear comercios en Supabase.</p>
      ) : null}
      {errorMessage ? <p className="admin-form-error">{errorMessage}</p> : null}

      {merchantsErrorMessage || !hasMerchants ? null : (
        <form className="admin-form" action={createOfferAction}>
          <label>
            <span>Comercio</span>
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
          </label>

          <label>
            <span>Título</span>
            <input name="title" required type="text" />
          </label>

          <label>
            <span>Descripción</span>
            <textarea name="description" rows={4} />
          </label>

          <label>
            <span>Promoción destacada</span>
            <input name="featured_promotion" type="text" />
          </label>

          <label>
            <span>Beneficio para el cliente</span>
            <textarea name="customer_benefit" rows={3} />
          </label>

          <label>
            <span>Objetivo comercial</span>
            <textarea name="business_goal" rows={3} />
          </label>

          <label>
            <span>Código de cupón</span>
            <input name="coupon_code" required type="text" />
          </label>

          <label>
            <span>Inicio</span>
            <input name="starts_at" type="datetime-local" />
          </label>

          <label>
            <span>Fin</span>
            <input name="ends_at" type="datetime-local" />
          </label>

          <label>
            <span>Límite de canjes</span>
            <input min="1" name="max_redemptions" type="number" />
          </label>

          <label>
            <span>Estado</span>
            <select name="is_active" defaultValue="true">
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
            </select>
          </label>

          <div className="admin-form-actions">
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
