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
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin local temporal</p>
          <h1>Nueva campaña</h1>
          <p>Crea una acción comercial. Las ofertas se asociarán en otro bloque.</p>
        </div>
        <Button href="/admin/campanas" variant="secondary">
          Volver a campañas
        </Button>
      </section>

      {errorMessage ? <p className="admin-form-error">{errorMessage}</p> : null}

      <form className="admin-form" action={createCampaignAction}>
        <label>
          <span>Nombre</span>
          <input name="name" required type="text" />
        </label>

        <label>
          <span>Slug</span>
          <input
            name="slug"
            required
            type="text"
            placeholder="campana-navidad"
          />
        </label>

        <label>
          <span>Descripción</span>
          <textarea name="description" rows={4} />
        </label>

        <label>
          <span>Fecha de inicio</span>
          <input name="starts_at" type="datetime-local" />
        </label>

        <label>
          <span>Fecha de fin</span>
          <input name="ends_at" type="datetime-local" />
        </label>

        <label>
          <span>Estado</span>
          <select name="is_active" defaultValue="false">
            <option value="false">Inactiva</option>
            <option value="true">Activa</option>
          </select>
        </label>

        <div className="admin-form-actions">
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
