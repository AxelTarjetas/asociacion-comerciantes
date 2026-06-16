import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createCampaignAction } from "@/app/admin/campanas/actions";
import { isLocalAdminEnabled } from "@/lib/admin";

type NewCampaignPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "missing-required-fields": "El nombre y el slug son obligatorios.",
  "invalid-dates": "La fecha fin debe ser posterior a la fecha de inicio.",
  "slug-already-exists": "Ya existe una campaña con ese slug.",
  "supabase-not-configured":
    "Supabase admin no está configurado. No se pueden crear campañas.",
  "create-failed": "No se pudo crear la campaña. Revisa los datos e inténtalo de nuevo."
};

export default async function NewCampaignPage({
  searchParams
}: NewCampaignPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const { error } = searchParams ? await searchParams : {};
  const errorMessage = error ? errorMessages[error] : null;

  return (
    <div className="page-shell admin-form-page">
      <section className="admin-detail-hero admin-form-hero">
        <div className="admin-detail-hero-main">
          <p className="eyebrow">Admin local temporal</p>
          <h1>Nueva campaña</h1>
          <p>
            Crea una acción comercial para agrupar ofertas por temporada, evento o
            iniciativa local.
          </p>
          <div className="admin-detail-context">
            <span>Después podrás asociar ofertas desde el detalle de campaña.</span>
          </div>
        </div>
        <div className="admin-detail-actions">
          <Button href="/admin/campanas" variant="secondary">
            Volver a campañas
          </Button>
        </div>
      </section>

      {errorMessage ? <p className="admin-form-error">{errorMessage}</p> : null}

      <form className="admin-form admin-structured-form" action={createCampaignAction}>
        <section className="admin-form-card" aria-label="Datos de campaña">
          <div className="admin-form-card-header">
            <p className="eyebrow">Campaña</p>
            <h2>Datos de campaña</h2>
          </div>
          <div className="admin-form-grid">
            <label>
              <span>Nombre</span>
              <input name="name" required type="text" />
              <small>Nombre público de la acción comercial.</small>
            </label>

            <label>
              <span>Slug</span>
              <input name="slug" required type="text" placeholder="campana-navidad" />
              <small>Se normaliza al guardar y debe ser único.</small>
            </label>

            <label>
              <span>Estado</span>
              <select name="is_active" defaultValue="false">
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
              <textarea name="description" rows={4} />
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
              <input name="starts_at" type="datetime-local" />
              <small>Si queda vacía, la campaña puede empezar inmediatamente.</small>
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
            Crear campaña
          </button>
          <Button href="/admin/campanas" variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
