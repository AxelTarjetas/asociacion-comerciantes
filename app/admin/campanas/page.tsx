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
  const activeCampaigns = campaigns.filter((campaign) => campaign.isActive);
  const currentCampaigns = campaigns.filter(
    (campaign) => getCampaignPeriodStatus(campaign, now) === "current"
  );
  const publicVisibleCampaigns = campaigns.filter(
    (campaign) =>
      campaign.isActive && getCampaignPeriodStatus(campaign, now) === "current"
  );

  return (
    <div className="page-shell admin-list-page">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>Campañas</h1>
          <p>Organiza acciones comerciales y controla qué campañas pueden verse en público.</p>
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

      <section className="admin-list-summary" aria-label="Resumen de campañas">
        <article>
          <span>Total</span>
          <strong>{campaigns.length}</strong>
          <small>campañas registradas</small>
        </article>
        <article>
          <span>Activas</span>
          <strong>{activeCampaigns.length}</strong>
          <small>marcadas como activas</small>
        </article>
        <article>
          <span>Vigentes</span>
          <strong>{currentCampaigns.length}</strong>
          <small>dentro de fechas</small>
        </article>
        <article>
          <span>Públicas</span>
          <strong>{publicVisibleCampaigns.length}</strong>
          <small>activas y vigentes</small>
        </article>
      </section>

      <section
        className="admin-list-section admin-campaign-list"
        aria-label="Listado admin de campañas"
      >
        {campaigns.length > 0 ? (
          campaigns.map((campaign) => {
            const periodStatus = getCampaignPeriodStatus(campaign, now);
            const isPublicVisible =
              campaign.isActive && periodStatus === "current";

            return (
              <article className="admin-list-card admin-campaign-list-card" key={campaign.id}>
                <div className="admin-list-card-main">
                  <div className="admin-list-card-title-row">
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
                    <span className="admin-list-card-kicker">
                      {isPublicVisible ? "Visible en público" : "Revisión interna"}
                    </span>
                  </div>
                  <h2>
                    <Link href={`/admin/campanas/${campaign.slug}`}>
                      {campaign.name}
                    </Link>
                  </h2>
                  <small className="admin-list-slug">{campaign.slug}</small>
                  {campaign.description ? (
                    <p className="admin-list-description">{campaign.description}</p>
                  ) : null}
                  <div className="admin-list-meta-grid">
                    <span>
                      <strong>Inicio</strong>
                      {formatOptionalDate(campaign.startsAt)}
                    </span>
                    <span>
                      <strong>Fin</strong>
                      {formatOptionalDate(campaign.endsAt)}
                    </span>
                    <span>
                      <strong>Creada</strong>
                      {formatDate(campaign.createdAt)}
                    </span>
                  </div>
                  {!isPublicVisible ? (
                    <p className="admin-list-note">
                      La página pública solo será visible si la campaña está activa y vigente.
                    </p>
                  ) : null}
                </div>
                <div className="admin-card-actions">
                  <Button href={`/admin/campanas/${campaign.slug}`} variant="secondary">
                    Ver
                  </Button>
                  <Button
                    href={`/admin/campanas/${campaign.slug}/editar`}
                    variant="secondary"
                  >
                    Editar
                  </Button>
                  <Button href={`/campanas/${campaign.slug}`} variant="secondary">
                    Ver pública
                  </Button>
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
                </div>
              </article>
            );
          })
        ) : (
          <p className="empty-state">Todavía no hay campañas.</p>
        )}
      </section>
    </div>
  );
}
