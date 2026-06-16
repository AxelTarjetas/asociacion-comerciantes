import { notFound } from "next/navigation";
import { updateCampaignAction } from "@/app/admin/campanas/actions";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { getAdminCampaignBySlug } from "@/lib/queries/campaigns";

type EditCampaignPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "missing-required-fields": "El nombre y el slug son obligatorios.",
  "invalid-dates": "La fecha fin debe ser posterior a la fecha de inicio.",
  "slug-already-exists": "Ya existe otra campaña con ese slug.",
  "supabase-not-configured":
    "Supabase admin no está configurado. No se puede editar la campaña.",
  "campaign-not-found": "La campaña ya no existe.",
  "update-failed": "No se pudo actualizar la campaña. Revisa los datos."
};

function toDateTimeLocal(value: string | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export default async function EditCampaignPage({
  params,
  searchParams
}: EditCampaignPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const [{ slug }, queryParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ error?: string }>({})
  ]);
  const campaign = await getAdminCampaignBySlug(slug);

  if (!campaign) {
    notFound();
  }

  const updateCampaign = updateCampaignAction.bind(null, campaign.slug);
  const errorMessage = queryParams.error ? errorMessages[queryParams.error] : null;

  return (
    <div className="page-shell admin-form-page">
      <section className="admin-detail-hero admin-form-hero">
        <div className="admin-detail-hero-main">
          <p className="eyebrow">Admin local temporal</p>
          <div className="admin-detail-badges">
            <span
              className={
                campaign.isActive
                  ? "status-badge status-badge-active"
                  : "status-badge status-badge-inactive"
              }
            >
              {campaign.isActive ? "Activa" : "Inactiva"}
            </span>
            <span className="status-badge status-badge-muted">
              {campaign.slug}
            </span>
          </div>
          <h1>Editar campaña</h1>
          <p>Actualiza la presentación, el periodo y la visibilidad pública.</p>
          <div className="admin-detail-context">
            <span>{campaign.name}</span>
            <span>{campaign.slug}</span>
          </div>
        </div>
        <div className="admin-detail-actions">
          <Button href={`/admin/campanas/${campaign.slug}`} variant="secondary">
            Volver al detalle
          </Button>
          <Button href="/admin/campanas" variant="secondary">
            Volver a campañas
          </Button>
        </div>
      </section>

      {errorMessage ? <p className="admin-form-error">{errorMessage}</p> : null}

      <form className="admin-form admin-structured-form" action={updateCampaign}>
        <section className="admin-form-card" aria-label="Datos de campaña">
          <div className="admin-form-card-header">
            <p className="eyebrow">Campaña</p>
            <h2>Datos de campaña</h2>
          </div>
          <div className="admin-form-grid">
            <label>
              <span>Nombre</span>
              <input name="name" required type="text" defaultValue={campaign.name} />
              <small>Nombre público de la acción comercial.</small>
            </label>

            <label>
              <span>Slug</span>
              <input name="slug" required type="text" defaultValue={campaign.slug} />
              <small>Se normaliza al guardar y debe ser único.</small>
            </label>

            <label>
              <span>Estado</span>
              <select
                name="is_active"
                defaultValue={campaign.isActive ? "true" : "false"}
              >
                <option value="false">Inactiva</option>
                <option value="true">Activa</option>
              </select>
              <small>Solo las campañas activas y vigentes aparecen en público.</small>
            </label>
          </div>
        </section>

        <section className="admin-form-card" aria-label="Presentación pública">
          <div className="admin-form-card-header">
            <p className="eyebrow">Presentación pública</p>
            <h2>Descripción</h2>
          </div>
          <div className="admin-form-grid">
            <label className="admin-form-field-wide">
              <span>Descripción</span>
              <textarea
                name="description"
                rows={4}
                defaultValue={campaign.description}
              />
              <small>
                Explica el objetivo de la campaña con un texto breve y orientado a
                clientes.
              </small>
            </label>
          </div>
        </section>

        <section className="admin-form-card" aria-label="Periodo de campaña">
          <div className="admin-form-card-header">
            <p className="eyebrow">Periodo</p>
            <h2>Fechas de vigencia</h2>
          </div>
          <div className="admin-form-grid">
            <label>
              <span>Fecha de inicio</span>
              <input
                name="starts_at"
                type="datetime-local"
                defaultValue={toDateTimeLocal(campaign.startsAt)}
              />
              <small>Si queda vacía, la campaña puede empezar inmediatamente.</small>
            </label>

            <label>
              <span>Fecha de fin</span>
              <input
                name="ends_at"
                type="datetime-local"
                defaultValue={toDateTimeLocal(campaign.endsAt)}
              />
              <small>Debe ser posterior a la fecha de inicio si se informa.</small>
            </label>
          </div>
        </section>

        <div className="admin-form-actions admin-form-footer-actions">
          <button className="button button-primary" type="submit">
            Guardar cambios
          </button>
          <Button href={`/admin/campanas/${campaign.slug}`} variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
