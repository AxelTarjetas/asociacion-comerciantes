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
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin local temporal</p>
          <h1>Editar campaña</h1>
          <p>Actualiza los datos principales de esta acción comercial.</p>
        </div>
        <Button href={`/admin/campanas/${campaign.slug}`} variant="secondary">
          Volver al detalle
        </Button>
      </section>

      {errorMessage ? <p className="admin-form-error">{errorMessage}</p> : null}

      <form className="admin-form" action={updateCampaign}>
        <label>
          <span>Nombre</span>
          <input name="name" required type="text" defaultValue={campaign.name} />
        </label>

        <label>
          <span>Slug</span>
          <input name="slug" required type="text" defaultValue={campaign.slug} />
        </label>

        <label>
          <span>Descripción</span>
          <textarea
            name="description"
            rows={4}
            defaultValue={campaign.description}
          />
        </label>

        <label>
          <span>Fecha de inicio</span>
          <input
            name="starts_at"
            type="datetime-local"
            defaultValue={toDateTimeLocal(campaign.startsAt)}
          />
        </label>

        <label>
          <span>Fecha de fin</span>
          <input
            name="ends_at"
            type="datetime-local"
            defaultValue={toDateTimeLocal(campaign.endsAt)}
          />
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
        </label>

        <div className="admin-form-actions">
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
