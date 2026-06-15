import Link from "next/link";
import { notFound } from "next/navigation";
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
    <div className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">Campaña de comercio local</p>
        <h1>{campaign.name}</h1>
        {campaign.description ? <p>{campaign.description}</p> : null}
        {campaignDates ? <p><strong>{campaignDates}</strong></p> : null}
      </section>

      <section className="related-section" aria-label="Ofertas de la campaña">
        <div className="section-heading-row">
          <h2 className="section-title">Ofertas disponibles</h2>
          <Button href="/ofertas" variant="secondary">
            Ver todas las ofertas
          </Button>
        </div>

        {offers.length > 0 ? (
          <div className="grid">
            {offers.map((offer) => (
              <article className="card" key={offer.id}>
                {offer.merchant.imageUrl ? (
                  <img
                    className="card-image"
                    src={offer.merchant.imageUrl}
                    alt={offer.merchant.name}
                  />
                ) : null}
                <div className="card-body">
                  <span className="card-meta">
                    <Link href={`/comercios/${offer.merchant.slug}`}>
                      {offer.merchant.name}
                    </Link>
                  </span>
                  <h2>
                    <Link href={`/ofertas/${offer.slug}`}>{offer.title}</Link>
                  </h2>
                  {offer.featuredPromotion ? (
                    <p className="offer-highlight">{offer.featuredPromotion}</p>
                  ) : null}
                  <p>{offer.description}</p>
                  {offer.customerBenefit ? (
                    <p>
                      <strong>Beneficio:</strong> {offer.customerBenefit}
                    </p>
                  ) : null}
                  <div className="card-footer">
                    <Link href={`/ofertas/${offer.slug}`}>Ver oferta</Link>
                    <Link href={`/comercios/${offer.merchant.slug}`}>
                      Ver comercio
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            Esta campaña todavía no tiene ofertas disponibles.
          </p>
        )}
      </section>
    </div>
  );
}
