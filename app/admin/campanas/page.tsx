import Link from "next/link";
import { notFound } from "next/navigation";
import { setCampaignActiveAction } from "@/app/admin/campanas/actions";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { getAdminCampaigns } from "@/lib/queries/campaigns";
import { formatDate } from "@/lib/utils";
import type { Campaign } from "@/types/app";

type AdminCampaignsPageProps = {
  searchParams?: Promise<{
    created?: string;
    statusUpdated?: string;
    error?: string;
  }>;
};

type CampaignPeriodStatus = "future" | "current" | "expired";

const periodLabels: Record<CampaignPeriodStatus, string> = {
  future: "Futura",
  current: "Vigente",
  expired: "Caducada"
};

const periodClasses: Record<CampaignPeriodStatus, string> = {
  future: "status-badge status-badge-muted",
  current: "status-badge status-badge-active",
  expired: "status-badge status-badge-inactive"
};

function getCampaignPeriodStatus(
  campaign: Campaign,
  now: Date
): CampaignPeriodStatus {
  if (campaign.startsAt && new Date(campaign.startsAt) > now) {
    return "future";
  }

  if (campaign.endsAt && new Date(campaign.endsAt) < now) {
    return "expired";
  }

  return "current";
}

function formatOptionalDate(date: string | undefined) {
  return date ? formatDate(date) : "Sin fecha";
}

export default async function AdminCampaignsPage({
  searchParams
}: AdminCampaignsPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const [campaigns, queryParams] = await Promise.all([
    getAdminCampaigns(),
    searchParams ??
      Promise.resolve<{
        created?: string;
        statusUpdated?: string;
        error?: string;
      }>({})
  ]);
  const now = new Date();

  return (
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>Campañas</h1>
          <p>Listado de solo lectura para revisar las acciones comerciales.</p>
        </div>
        <div className="admin-heading-actions">
          <Button href="/admin/campanas/nueva">Nueva campaña</Button>
          <Button href="/admin" variant="secondary">
            Volver al admin
          </Button>
        </div>
      </section>

      {queryParams.created === "1" ? (
        <p className="admin-form-success">Campaña creada correctamente.</p>
      ) : null}
      {queryParams.statusUpdated === "1" ? (
        <p className="admin-form-success">Estado de la campaña actualizado.</p>
      ) : null}
      {queryParams.error ? (
        <p className="admin-form-error">
          No se pudo actualizar el estado de la campaña.
        </p>
      ) : null}

      <section
        className="admin-table admin-campaigns-table"
        aria-label="Listado admin de campañas"
      >
        <div className="admin-table-row admin-table-head">
          <span>Campaña</span>
          <span>Inicio</span>
          <span>Fin</span>
          <span>Activación</span>
          <span>Periodo</span>
          <span>Creada</span>
          <span>Acción</span>
        </div>
        {campaigns.map((campaign) => {
          const periodStatus = getCampaignPeriodStatus(campaign, now);

          return (
            <div className="admin-table-row" key={campaign.id}>
              <span>
                <strong>
                  <Link href={`/admin/campanas/${campaign.slug}`}>
                    {campaign.name}
                  </Link>
                </strong>
                <small>{campaign.slug}</small>
                {campaign.description ? <small>{campaign.description}</small> : null}
              </span>
              <span>{formatOptionalDate(campaign.startsAt)}</span>
              <span>{formatOptionalDate(campaign.endsAt)}</span>
              <span
                className={
                  campaign.isActive
                    ? "status-badge status-badge-active"
                    : "status-badge status-badge-inactive"
                }
              >
                {campaign.isActive ? "Activa" : "Inactiva"}
              </span>
              <span className={periodClasses[periodStatus]}>
                {periodLabels[periodStatus]}
              </span>
              <span>{formatDate(campaign.createdAt)}</span>
              <span>
                <form action={setCampaignActiveAction}>
                  <input name="campaign_id" type="hidden" value={campaign.id} />
                  <input
                    name="campaign_slug"
                    type="hidden"
                    value={campaign.slug}
                  />
                  <input
                    name="is_active"
                    type="hidden"
                    value={campaign.isActive ? "false" : "true"}
                  />
                  <input
                    name="return_to"
                    type="hidden"
                    value="/admin/campanas?statusUpdated=1"
                  />
                  <button className="button button-secondary" type="submit">
                    {campaign.isActive ? "Desactivar" : "Activar"}
                  </button>
                </form>
              </span>
            </div>
          );
        })}
        {campaigns.length === 0 ? (
          <p className="empty-state">Todavía no hay campañas.</p>
        ) : null}
      </section>
    </div>
  );
}
