import Link from "next/link";
import { notFound } from "next/navigation";
import { OfferVisual } from "@/components/offers/OfferVisual";
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
  "offer-not-available":
    "Esta oferta ya no está disponible. Puede estar caducada o inactiva.",
  "redemption-limit-reached":
    "Esta oferta ya ha alcanzado el límite de cupones disponibles.",
  "redeem-failed": "No se pudo preparar el cupón. Inténtalo de nuevo.",
  "supabase-not-configured":
    "El cupón no se puede preparar ahora mismo. Inténtalo más tarde."
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

  const isCouponPrepared = redeemed === "1";
  const offerValidity =
    offer.hasEndsAt === false ? "Sin fecha límite" : `Válida hasta ${formatDate(offer.endsAt)}`;
  const benefit = offer.customerBenefit || offer.featuredPromotion || offer.description;

  return (
    <div className="public-detail-page offer-detail-page">
      <section className="page-shell public-detail-hero">
        <Link className="public-back-link" href="/ofertas">
          Volver a ofertas
        </Link>
        <div className="offer-detail-hero-grid">
          <div className="public-detail-media">
            <OfferVisual className="offer-detail-visual" offer={offer} />
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
              <strong>{benefit}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell offer-detail-content">
        <div className="offer-info-column">
          <section className="public-info-block coupon-steps-block">
            <p className="eyebrow">Cómo usar esta oferta</p>
            <h2>Prepara el cupón y enséñalo antes de pagar</h2>
            <ol className="coupon-steps">
              <li>
                <span>1</span>
                <strong>Pulsa “Preparar cupón”.</strong>
              </li>
              <li>
                <span>2</span>
                <strong>Ve a {offer.merchant.name}.</strong>
              </li>
              <li>
                <span>3</span>
                <strong>Enseña el cupón en tienda antes de pagar.</strong>
              </li>
            </ol>
          </section>

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
                <span>Límite de cupones</span>
                <strong>{offer.maxRedemptions ?? "Sin límite indicado"}</strong>
              </div>
            </div>
          </section>

          <section className="public-info-block merchant-offer-block">
            <div>
              <p className="eyebrow">Dónde usarla</p>
              <h2>{offer.merchant.name}</h2>
              <p>{offer.merchant.address}</p>
            </div>
            <Button href={`/comercios/${offer.merchant.slug}`} variant="secondary">
              Ver tienda
            </Button>
          </section>

          {offer.businessGoal ? (
            <section className="public-info-block offer-context-block">
              <span>Sobre esta promoción</span>
              <p>{offer.businessGoal}</p>
            </section>
          ) : null}
        </div>

        <aside className="redeem-panel coupon-panel" aria-label="Cupón de la oferta">
          <span className="redeem-panel-label">
            {isCouponPrepared ? "Cupón preparado" : "Tu cupón"}
          </span>
          <h2>{offer.title}</h2>
          <p className="coupon-store">{offer.merchant.name}</p>

          <div className="coupon-benefit-box">
            <span>Qué ganas</span>
            <strong>{benefit}</strong>
          </div>

          <div className="coupon-code-card">
            <span>Código para enseñar</span>
            <div className="redeem-code">{offer.couponCode}</div>
            {offer.qrToken ? <small>Referencia: {offer.qrToken}</small> : null}
          </div>

          <p className="coupon-validity">{offerValidity}</p>

          {isCouponPrepared ? (
            <div className="coupon-ready-box">
              <strong>Cupón preparado.</strong>
              <p>Enseña este cupón en tienda antes de pagar.</p>
              <p>El comercio revisará el código para aplicar la oferta.</p>
            </div>
          ) : null}

          {error ? (
            <p className="redeem-message redeem-message-error">
              {redeemErrorMessages[error] ?? "No se pudo preparar el cupón."}
            </p>
          ) : null}

          {isCouponPrepared ? (
            <div className="coupon-secondary-actions">
              <Button href={`/comercios/${offer.merchant.slug}`} variant="secondary">
                Ver tienda
              </Button>
              <Button href={`/ofertas/${offer.slug}`} variant="secondary">
                Volver a la oferta
              </Button>
            </div>
          ) : (
            <form action={redeemOfferAction} className="redeem-form">
              <input name="offer_slug" type="hidden" value={offer.slug} />
              <button className="button redeem-button" type="submit">
                Preparar cupón
              </button>
            </form>
          )}

          <small>
            Al preparar el cupón se registra su uso para que el comercio pueda medir la
            oferta.
          </small>
        </aside>
      </section>
    </div>
  );
}
