import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { redeemOfferAction } from "@/app/ofertas/[slug]/actions";
import { formatDate } from "@/lib/utils";
import { getOfferBySlug } from "@/lib/queries/offers";

type OfferDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    redeemed?: string;
    error?: string;
  }>;
};

const redeemErrorMessages: Record<string, string> = {
  "offer-not-available": "Esta oferta no está disponible para canje.",
  "redemption-limit-reached":
    "Esta oferta ya ha alcanzado el límite de canjes.",
  "redeem-failed": "No se pudo canjear el cupón. Inténtalo de nuevo.",
  "supabase-not-configured":
    "Supabase admin no está configurado. No se puede registrar el canje."
};

export default async function OfferDetailPage({
  params,
  searchParams
}: OfferDetailPageProps) {
  const { slug } = await params;
  const { redeemed, error } = searchParams ? await searchParams : {};
  const offer = await getOfferBySlug(slug);

  if (!offer) {
    notFound();
  }

  return (
    <div className="public-detail-page offer-detail-page">
      <section className="page-shell public-detail-hero">
        <Link className="public-back-link" href="/ofertas">
          Volver a ofertas
        </Link>
        <div className="offer-detail-hero-grid">
          <div className="public-detail-media">
            {offer.merchant.imageUrl ? (
              <img src={offer.merchant.imageUrl} alt={offer.merchant.name} />
            ) : (
              <div className="public-detail-placeholder" aria-hidden="true">
                {offer.merchant.name.slice(0, 1)}
              </div>
            )}
            <span className="card-floating-badge">Oferta activa</span>
          </div>
          <div className="public-detail-intro">
            <Link className="merchant-inline-link" href={`/comercios/${offer.merchant.slug}`}>
              {offer.merchant.name}
              <span aria-hidden="true">→</span>
            </Link>
            <h1>{offer.title}</h1>
            {offer.featuredPromotion ? (
              <p className="offer-detail-promotion">{offer.featuredPromotion}</p>
            ) : null}
            <p className="public-detail-summary">{offer.description}</p>
            <div className="offer-detail-benefit">
              <span>Tu beneficio</span>
              <strong>{offer.customerBenefit}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell offer-detail-content">
        <div className="offer-info-column">
          <section className="public-info-block">
            <p className="eyebrow">Todo lo importante</p>
            <h2>Detalles de la promoción</h2>
            <div className="public-info-grid">
              <div>
                <span>Estado</span>
                <strong>Activa ahora</strong>
              </div>
              <div>
                <span>Fecha de inicio</span>
                <strong>{offer.startsAt ? formatDate(offer.startsAt) : "Disponible desde ahora"}</strong>
              </div>
              <div>
                <span>Fecha de fin</span>
                <strong>{offer.hasEndsAt === false ? "Sin fecha límite" : formatDate(offer.endsAt)}</strong>
              </div>
              <div>
                <span>Límite de canjes</span>
                <strong>{offer.maxRedemptions ?? "Sin límite indicado"}</strong>
              </div>
            </div>
          </section>

          <section className="public-info-block merchant-offer-block">
            <div>
              <p className="eyebrow">Dónde canjearla</p>
              <h2>{offer.merchant.name}</h2>
              <p>{offer.merchant.address}</p>
            </div>
            <Button href={`/comercios/${offer.merchant.slug}`} variant="secondary">
              Ver comercio
            </Button>
          </section>

          {offer.businessGoal ? (
            <section className="public-info-block offer-context-block">
              <span>Sobre esta promoción</span>
              <p>{offer.businessGoal}</p>
            </section>
          ) : null}
        </div>

        <aside className="redeem-panel" aria-label="Canjear cupón">
          <span className="redeem-panel-label">Tu cupón</span>
          <div className="redeem-code">{offer.couponCode}</div>
          <p>Enséñalo en el comercio y registra aquí el canje.</p>
          {redeemed === "1" ? (
            <p className="redeem-message redeem-message-success">Cupón canjeado correctamente.</p>
          ) : null}
          {error ? (
            <p className="redeem-message redeem-message-error">
              {redeemErrorMessages[error] ?? "No se pudo canjear el cupón."}
            </p>
          ) : null}
          <form action={redeemOfferAction} className="redeem-form">
            <input name="offer_slug" type="hidden" value={offer.slug} />
            <button className="button redeem-button" type="submit">
              Canjear cupón
            </button>
          </form>
          <small>El canje quedará registrado para medir el uso de la promoción.</small>
        </aside>
      </section>
    </div>
  );
}
