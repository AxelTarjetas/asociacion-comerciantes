import Link from "next/link";
import { notFound } from "next/navigation";
import { OfferCard } from "@/components/offers/OfferCard";
import { Button } from "@/components/ui/Button";
import {
  getCampaignBySlug,
  getCampaignOffersBySlug
} from "@/lib/queries/campaigns";
import { formatDate } from "@/lib/utils";
import type { Campaign } from "@/types/app";

type CampaignPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatCampaignDates(campaign: Campaign) {
  if (campaign.startsAt && campaign.endsAt) {
    return `Del ${formatDate(campaign.startsAt)} al ${formatDate(campaign.endsAt)}`;
  }

  if (campaign.startsAt) {
    return `Desde el ${formatDate(campaign.startsAt)}`;
  }

  if (campaign.endsAt) {
    return `Hasta el ${formatDate(campaign.endsAt)}`;
  }

  return null;
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);

  if (!campaign) {
    notFound();
  }

  const offers = await getCampaignOffersBySlug(slug);
  const campaignDates = formatCampaignDates(campaign);

  return (
    <div className="campaign-public-page">
      <section className="campaign-public-hero">
        <div className="page-shell campaign-public-hero-inner">
          <Link className="back-link" href="/">
            Volver al inicio
          </Link>
          <div className="campaign-status-row">
            <span className="campaign-badge">Campaña activa</span>
            <span className="campaign-period-badge">Vigente ahora</span>
          </div>
          <h1>{campaign.name}</h1>
          {campaign.description ? <p>{campaign.description}</p> : null}
          <div className="campaign-public-meta">
            {campaignDates ? <strong>{campaignDates}</strong> : <strong>Sin fecha límite</strong>}
            <span>
              {offers.length} {offers.length === 1 ? "oferta disponible" : "ofertas disponibles"}
            </span>
          </div>
        </div>
      </section>

      <section className="page-shell campaign-offers-section" aria-label="Ofertas de la campaña">
        <div className="home-section-header">
          <div>
            <p className="eyebrow">Promociones de la campaña</p>
            <h2>Ofertas disponibles</h2>
          </div>
          <Button href="/ofertas" variant="secondary">
            Ver todas
          </Button>
        </div>

        {offers.length > 0 ? (
          <div className="grid public-card-grid">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          <div className="public-empty-state campaign-empty-state">
            <span aria-hidden="true">%</span>
            <h2>Esta campaña todavía no tiene ofertas disponibles</h2>
            <p>Vuelve pronto para descubrir nuevas promociones.</p>
            <Button href="/ofertas" variant="secondary">
              Explorar otras ofertas
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
