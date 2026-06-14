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
  "missing-required-fields": "Faltan datos obligatorios: comercio, titulo y slug.",
  "invalid-dates": "La fecha fin debe ser posterior a la fecha de inicio.",
  "invalid-max-redemptions":
    "El maximo de canjes debe ser un numero entero mayor que 0.",
  "supabase-not-configured":
    "Supabase admin no esta configurado. Revisa NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
  "slug-unavailable": "Ya existe otra oferta con ese slug.",
  "offer-not-found": "No se encontro la oferta que intentas actualizar.",
  "update-failed": "No se pudo actualizar la oferta. Revisa los datos e intentalo de nuevo."
};

const merchantsErrorMessages: Record<string, string> = {
  "supabase-not-configured":
    "Supabase admin no esta configurado. No se pueden editar ofertas.",
  "merchants-load-failed": "No se pudieron cargar los comercios reales desde Supabase.",
  "admin-disabled": "El admin local temporal no esta habilitado."
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
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin local temporal</p>
          <h1>Editar oferta</h1>
          <p>
            Actualizacion basica desde servidor para desarrollo local. No es auth real
            ni un panel de produccion.
          </p>
        </div>
        <Button href={`/admin/ofertas/${offer.slug}`} variant="secondary">
          Volver al detalle
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
        <form className="admin-form" action={updateOfferWithSlug}>
          <label>
            <span>Comercio asociado</span>
            <select name="merchant_id" required defaultValue={offer.merchantId}>
              {merchantOptions.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Titulo</span>
            <input name="title" required type="text" defaultValue={offer.title} />
          </label>

          <label>
            <span>Slug</span>
            <input name="slug" required type="text" defaultValue={offer.slug} />
          </label>

          <label>
            <span>Descripcion</span>
            <textarea name="description" rows={4} defaultValue={offer.description} />
          </label>

          <label>
            <span>Promocion destacada</span>
            <input
              name="featured_promotion"
              type="text"
              defaultValue={offer.featuredPromotion}
            />
          </label>

          <label>
            <span>Beneficio para el cliente</span>
            <textarea
              name="customer_benefit"
              rows={3}
              defaultValue={offer.customerBenefit}
            />
          </label>

          <label>
            <span>Objetivo comercial</span>
            <textarea name="business_goal" rows={3} defaultValue={offer.businessGoal} />
          </label>

          <label>
            <span>Codigo de cupon</span>
            <input name="coupon_code" type="text" defaultValue={offer.couponCode} />
          </label>

          <label>
            <span>Inicio</span>
            <input
              name="starts_at"
              type="datetime-local"
              defaultValue={toDateTimeLocal(offer.startsAt)}
            />
          </label>

          <label>
            <span>Fin</span>
            <input
              name="ends_at"
              type="datetime-local"
              defaultValue={toDateTimeLocal(offer.endsAt, offer.hasEndsAt !== false)}
            />
          </label>

          <label>
            <span>Limite de canjes</span>
            <input
              min="1"
              name="max_redemptions"
              type="number"
              defaultValue={offer.maxRedemptions ?? ""}
            />
          </label>

          <label>
            <span>Estado</span>
            <select name="is_active" defaultValue={offer.isActive ? "true" : "false"}>
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
            </select>
          </label>

          <div className="admin-form-actions">
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
