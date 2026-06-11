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
    <div className="page-shell">
      <section className="detail-layout">
        <article className="detail-main">
          {offer.merchant.imageUrl ? (
            <img src={offer.merchant.imageUrl} alt={offer.merchant.name} />
          ) : null}
          <div className="detail-content">
            <p className="eyebrow">
              <Link href={`/comercios/${offer.merchant.slug}`}>
                {offer.merchant.name}
              </Link>
            </p>
            <h1>{offer.title}</h1>
            <p className="detail-copy">{offer.description}</p>
            <p className="offer-highlight">{offer.featuredPromotion}</p>
            <div className="section-actions">
              <Button href={`/comercios/${offer.merchant.slug}`}>
                Ver comercio
              </Button>
              <Button href="/ofertas" variant="secondary">
                Volver a ofertas
              </Button>
            </div>
          </div>
        </article>

        <aside className="detail-panel">
          <h2>Cupón</h2>
          {redeemed === "1" ? (
            <p className="empty-state">Cupón canjeado correctamente.</p>
          ) : null}
          {error ? (
            <p className="empty-state">
              {redeemErrorMessages[error] ?? "No se pudo canjear el cupón."}
            </p>
          ) : null}
          <ul className="detail-list">
            <li>
              <strong>Qué gana el cliente</strong>
              {offer.customerBenefit}
            </li>
            <li>
              <strong>Código</strong>
              <span className="code-badge">{offer.couponCode}</span>
            </li>
            <li>
              <strong>Activa hasta</strong>
              {formatDate(offer.endsAt)}
            </li>
            <li>
              <strong>Comercio</strong>
              {offer.merchant.name}
            </li>
            <li>
              <strong>Objetivo comercial</strong>
              {offer.businessGoal}
            </li>
            <li>
              <strong>Dirección</strong>
              {offer.merchant.address}
            </li>
          </ul>
          <form action={redeemOfferAction} className="redeem-form">
            <input name="offer_slug" type="hidden" value={offer.slug} />
            <button className="button button-primary" type="submit">
              Canjear cupón
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}
