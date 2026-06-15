import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addOfferToCampaignAction,
  removeOfferFromCampaignAction,
  setCampaignActiveAction
} from "@/app/admin/campanas/actions";
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
  searchParams?: Promise<{
    updated?: string;
    offerAdded?: string;
    offerRemoved?: string;
    statusUpdated?: string;
    alreadyExists?: string;
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

const errorMessages: Record<string, string> = {
  "missing-offer": "Selecciona una oferta para añadirla a la campaña.",
  "supabase-not-configured":
    "Supabase admin no está configurado. No se pueden realizar cambios.",
  "invalid-assignment": "La campaña o la oferta seleccionada no existe.",
  "offer-add-failed":
    "No se pudo añadir la oferta a la campaña. Inténtalo de nuevo.",
  "remove-offer":
    "No se pudo quitar la oferta de la campaña. Puede que la asociación ya no exista.",
  "status-update-failed":
    "No se pudo actualizar el estado de la campaña. Inténtalo de nuevo."
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
  params,
  searchParams
}: AdminCampaignDetailPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const [{ slug }, queryParams] = await Promise.all([
    params,
    searchParams ??
      Promise.resolve<{
        updated?: string;
        offerAdded?: string;
        offerRemoved?: string;
        statusUpdated?: string;
        alreadyExists?: string;
        error?: string;
      }>({})
  ]);
  const campaign = await getAdminCampaignBySlug(slug);

  if (!campaign) {
    notFound();
  }

  const [campaignOffers, offers] = await Promise.all([
    getAdminCampaignOffers(campaign.id),
    getAdminOffers()
  ]);
  const associatedOfferIds = new Set(
    campaignOffers.map((campaignOffer) => campaignOffer.offerId)
  );
  const offersById = new Map(offers.map((offer) => [offer.id, offer]));
  const associatedOffers = campaignOffers.flatMap((campaignOffer) => {
    const offer = offersById.get(campaignOffer.offerId);
    return offer
      ? [
          {
            campaignOfferId: campaignOffer.id,
            offer
          }
        ]
      : [];
  });
  const availableOffers = offers.filter((offer) => !associatedOfferIds.has(offer.id));
  const periodStatus = getCampaignPeriodStatus(campaign, new Date());
  const publicPath = `/campanas/${campaign.slug}`;
  const isPubliclyVisible = campaign.isActive && periodStatus === "current";
  const addOfferToCampaign = addOfferToCampaignAction.bind(null, campaign.slug);
  const removeOfferFromCampaign = removeOfferFromCampaignAction.bind(
    null,
    campaign.slug
  );
  const nextIsActive = !campaign.isActive;
  const errorMessage = queryParams.error ? errorMessages[queryParams.error] : null;

  return (
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>{campaign.name}</h1>
          <p>{campaign.description || "Sin descripción registrada."}</p>
        </div>
        <div className="admin-heading-actions">
          <Button href={publicPath} variant="secondary">
            Ver página pública
          </Button>
          <Button href={`/admin/campanas/${campaign.slug}/editar`}>
            Editar campaña
          </Button>
          <form action={setCampaignActiveAction}>
            <input name="campaign_id" type="hidden" value={campaign.id} />
            <input name="campaign_slug" type="hidden" value={campaign.slug} />
            <input
              name="is_active"
              type="hidden"
              value={nextIsActive ? "true" : "false"}
            />
            <input
              name="return_to"
              type="hidden"
              value={`/admin/campanas/${campaign.slug}?statusUpdated=1`}
            />
            <button className="button button-secondary" type="submit">
              {campaign.isActive ? "Desactivar" : "Activar"}
            </button>
          </form>
          <Button href="/admin/campanas" variant="secondary">
            Volver a campañas
          </Button>
        </div>
      </section>

      {queryParams.updated === "1" ? (
        <p className="admin-form-success">Campaña actualizada correctamente.</p>
      ) : null}
      {queryParams.offerAdded === "1" ? (
        <p className="admin-form-success">Oferta añadida a la campaña.</p>
      ) : null}
      {queryParams.offerRemoved === "1" ? (
        <p className="admin-form-success">Oferta quitada de la campaña.</p>
      ) : null}
      {queryParams.statusUpdated === "1" ? (
        <p className="admin-form-success">Estado de la campaña actualizado.</p>
      ) : null}
      {queryParams.alreadyExists === "1" ? (
        <p className="admin-form-error">
          Esta oferta ya estaba asociada a la campaña.
        </p>
      ) : null}
      {errorMessage ? <p className="admin-form-error">{errorMessage}</p> : null}
      {!isPubliclyVisible ? (
        <p className="admin-form-error">
          La página pública solo será visible si la campaña está activa y vigente.
        </p>
      ) : null}

      <section className="admin-detail-grid" aria-label="Datos de la campaña">
        <article className="admin-detail-item">
          <span>URL pública</span>
          <strong>
            <Link href={publicPath}>{publicPath}</Link>
          </strong>
        </article>
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

      {availableOffers.length > 0 ? (
        <form className="admin-form" action={addOfferToCampaign}>
          <input name="campaign_id" type="hidden" value={campaign.id} />
          <label>
            <span>Añadir oferta</span>
            <select name="offer_id" required defaultValue="">
              <option value="" disabled>
                Selecciona una oferta
              </option>
              {availableOffers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.title} — {offer.merchant.name}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-form-actions">
            <button className="button button-primary" type="submit">
              Añadir oferta
            </button>
          </div>
        </form>
      ) : (
        <p className="empty-state">
          No hay más ofertas disponibles para asociar a esta campaña.
        </p>
      )}

      <section
        className="admin-table admin-campaign-offers-table"
        aria-label="Ofertas asociadas a la campaña"
      >
        <div className="admin-table-row admin-table-head">
          <span>Oferta</span>
          <span>Comercio</span>
          <span>Estado</span>
          <span>Inicio</span>
          <span>Fin</span>
          <span>Acción</span>
        </div>
        {associatedOffers.map(({ campaignOfferId, offer }) => (
          <div className="admin-table-row" key={campaignOfferId}>
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
            <span>
              <form action={removeOfferFromCampaign}>
                <input
                  name="campaign_offer_id"
                  type="hidden"
                  value={campaignOfferId}
                />
                <button className="button button-secondary" type="submit">
                  Quitar
                </button>
              </form>
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
