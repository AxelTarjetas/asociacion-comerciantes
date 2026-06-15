import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import {
  getAdminCampaignBySlug,
  getAdminCampaignOffers
} from "@/lib/queries/campaigns";
import { getAdminOffers } from "@/lib/queries/offers";
import { formatDate } from "@/lib/utils";
import type { Campaign } from "@/types/app";

type AdminCampaignDetailPageProps = {
  params: Promise<{
    slug: string;
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

export default async function AdminCampaignDetailPage({
  params
}: AdminCampaignDetailPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const { slug } = await params;
  const campaign = await getAdminCampaignBySlug(slug);

  if (!campaign) {
    notFound();
  }

  const [campaignOffers, offers] = await Promise.all([
    getAdminCampaignOffers(campaign.id),
    getAdminOffers()
  ]);
  const offersById = new Map(offers.map((offer) => [offer.id, offer]));
  const associatedOffers = campaignOffers.flatMap((campaignOffer) => {
    const offer = offersById.get(campaignOffer.offerId);
    return offer ? [offer] : [];
  });
  const periodStatus = getCampaignPeriodStatus(campaign, new Date());

  return (
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>{campaign.name}</h1>
          <p>{campaign.description || "Sin descripción registrada."}</p>
        </div>
        <Button href="/admin/campanas" variant="secondary">
          Volver a campañas
        </Button>
      </section>

      <section className="admin-detail-grid" aria-label="Datos de la campaña">
        <article className="admin-detail-item">
          <span>Slug</span>
          <strong>{campaign.slug}</strong>
        </article>
        <article className="admin-detail-item">
          <span>Activación</span>
          <strong
            className={
              campaign.isActive
                ? "status-badge status-badge-active"
                : "status-badge status-badge-inactive"
            }
          >
            {campaign.isActive ? "Activa" : "Inactiva"}
          </strong>
        </article>
        <article className="admin-detail-item">
          <span>Periodo</span>
          <strong className={periodClasses[periodStatus]}>
            {periodLabels[periodStatus]}
          </strong>
        </article>
        <article className="admin-detail-item">
          <span>Inicio</span>
          <strong>{formatOptionalDate(campaign.startsAt)}</strong>
        </article>
        <article className="admin-detail-item">
          <span>Fin</span>
          <strong>{formatOptionalDate(campaign.endsAt)}</strong>
        </article>
        <article className="admin-detail-item">
          <span>Creada</span>
          <strong>{formatDate(campaign.createdAt)}</strong>
        </article>
      </section>

      <section className="admin-stats" aria-label="Resumen de la campaña">
        <article className="admin-stat">
          <span>Ofertas asociadas</span>
          <strong>{campaignOffers.length}</strong>
        </article>
      </section>

      <section
        className="admin-table admin-offers-table"
        aria-label="Ofertas asociadas a la campaña"
      >
        <div className="admin-table-row admin-table-head">
          <span>Oferta</span>
          <span>Comercio</span>
          <span>Estado</span>
          <span>Inicio</span>
          <span>Fin</span>
        </div>
        {associatedOffers.map((offer) => (
          <div className="admin-table-row" key={offer.id}>
            <span>
              <strong>
                <Link href={`/admin/ofertas/${offer.slug}`}>{offer.title}</Link>
              </strong>
              <small>{offer.couponCode || "Sin código"}</small>
            </span>
            <span>{offer.merchant.name}</span>
            <span
              className={
                offer.isActive
                  ? "status-badge status-badge-active"
                  : "status-badge status-badge-inactive"
              }
            >
              {offer.isActive ? "Activa" : "Inactiva"}
            </span>
            <span>{formatOptionalDate(offer.startsAt)}</span>
            <span>
              {formatOptionalDate(
                offer.hasEndsAt === false ? undefined : offer.endsAt
              )}
            </span>
          </div>
        ))}
        {campaignOffers.length === 0 ? (
          <p className="empty-state">
            Todavía no hay ofertas asociadas a esta campaña.
          </p>
        ) : null}
        {campaignOffers.length > 0 && associatedOffers.length === 0 ? (
          <p className="empty-state">
            No se pudieron cargar las ofertas asociadas a esta campaña.
          </p>
        ) : null}
      </section>
    </div>
  );
}
