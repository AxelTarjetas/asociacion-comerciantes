import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import { getAdminCouponRedemptions } from "@/lib/queries/redemptions";

type AdminRedemptionsPageProps = {
  searchParams?: Promise<{
    q?: string;
    merchant?: string;
    offer?: string;
  }>;
};

function normalizeSearch(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export default async function AdminRedemptionsPage({
  searchParams
}: AdminRedemptionsPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const filters = searchParams ? await searchParams : {};
  const query = normalizeSearch(filters.q);
  const merchantFilter = filters.merchant?.trim() ?? "";
  const offerFilter = filters.offer?.trim() ?? "";
  const redemptions = await getAdminCouponRedemptions();
  const merchantOptions = Array.from(
    new Map(
      redemptions
        .filter((redemption) => redemption.merchantSlug)
        .map((redemption) => [
          redemption.merchantSlug,
          redemption.merchantName
        ])
    )
  ).sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB));
  const offerOptions = Array.from(
    new Map(
      redemptions
        .filter((redemption) => redemption.offerSlug)
        .map((redemption) => [redemption.offerSlug, redemption.offerTitle])
    )
  ).sort(([, titleA], [, titleB]) => titleA.localeCompare(titleB));
  const filteredRedemptions = redemptions.filter((redemption) => {
    const matchesQuery =
      !query ||
      [
        redemption.offerTitle,
        redemption.merchantName,
        redemption.couponCode,
        redemption.notes ?? ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesMerchant =
      !merchantFilter || redemption.merchantSlug === merchantFilter;
    const matchesOffer = !offerFilter || redemption.offerSlug === offerFilter;

    return matchesQuery && matchesMerchant && matchesOffer;
  });
  const merchantsWithRedemptions = new Set(
    filteredRedemptions.map((redemption) => redemption.merchantId)
  ).size;
  const offersWithRedemptions = new Set(
    filteredRedemptions.map((redemption) => redemption.offerId)
  ).size;
  const latestRedemption = filteredRedemptions[0];

  return (
    <div className="page-shell admin-list-page">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>Canjes</h1>
          <p>Consulta cupones usados, filtra resultados y revisa qué promociones generan interés.</p>
        </div>
        <div className="admin-heading-actions">
          <Button href="/admin" variant="secondary">
            Volver al admin
          </Button>
        </div>
      </section>

      <section className="admin-list-summary" aria-label="Resumen de canjes">
        <article>
          <span>Total</span>
          <strong>{filteredRedemptions.length}</strong>
          <small>canjes filtrados</small>
        </article>
        <article>
          <span>Comercios</span>
          <strong>{merchantsWithRedemptions}</strong>
          <small>con canjes</small>
        </article>
        <article>
          <span>Ofertas</span>
          <strong>{offersWithRedemptions}</strong>
          <small>con actividad</small>
        </article>
        <article>
          <span>Último canje</span>
          <strong>{latestRedemption ? formatDate(latestRedemption.redeemedAt) : "0"}</strong>
          <small>{latestRedemption ? latestRedemption.offerTitle : "Sin datos"}</small>
        </article>
      </section>

      <form action="/admin/canjes" className="admin-filters admin-list-filters" method="get">
        <label>
          Buscar
          <input
            defaultValue={filters.q ?? ""}
            name="q"
            placeholder="Oferta, comercio, código o notas"
            type="search"
          />
        </label>
        <label>
          Comercio
          <select defaultValue={merchantFilter} name="merchant">
            <option value="">Todos los comercios</option>
            {merchantOptions.map(([slug, name]) => (
              <option key={slug} value={slug}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Oferta
          <select defaultValue={offerFilter} name="offer">
            <option value="">Todas las ofertas</option>
            {offerOptions.map(([slug, title]) => (
              <option key={slug} value={slug}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <div className="admin-filter-actions">
          <button className="button button-primary" type="submit">
            Filtrar
          </button>
          <Button href="/admin/canjes" variant="secondary">
            Limpiar filtros
          </Button>
        </div>
      </form>

      <section
        className="admin-list-section admin-redemption-list"
        aria-label="Listado admin de canjes"
      >
        {filteredRedemptions.map((redemption) => (
          <article className="admin-list-card admin-redemption-list-card" key={redemption.id}>
            <div className="admin-list-card-main">
              <div className="admin-list-card-title-row">
                <span className="status-badge status-badge-active">Canjeado</span>
                <span className="admin-list-card-kicker">
                  {formatDate(redemption.redeemedAt)}
                </span>
              </div>
              <h2>
                {redemption.offerSlug ? (
                  <Link href={`/admin/ofertas/${redemption.offerSlug}`}>
                    {redemption.offerTitle}
                  </Link>
                ) : (
                  redemption.offerTitle
                )}
              </h2>
              <small className="admin-list-slug">
                {redemption.offerSlug || "Sin slug de oferta"}
              </small>
              <div className="admin-list-meta-grid">
                <span>
                  <strong>Comercio</strong>
                  {redemption.merchantSlug ? (
                    <Link href={`/admin/comercios/${redemption.merchantSlug}`}>
                      {redemption.merchantName}
                    </Link>
                  ) : (
                    redemption.merchantName
                  )}
                </span>
                <span>
                  <strong>Código</strong>
                  <span className="code-badge">{redemption.couponCode}</span>
                </span>
                <span>
                  <strong>Fecha</strong>
                  {formatDate(redemption.redeemedAt)}
                </span>
              </div>
              <p className="admin-list-description">
                {redemption.notes ?? "Sin notas"}
              </p>
            </div>
          </article>
        ))}
        {redemptions.length === 0 ? (
          <p className="empty-state">Todavía no hay canjes registrados.</p>
        ) : null}
        {redemptions.length > 0 && filteredRedemptions.length === 0 ? (
          <p className="empty-state">No hay canjes que coincidan con los filtros.</p>
        ) : null}
      </section>
    </div>
  );
}
