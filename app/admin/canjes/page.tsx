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
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>Canjes</h1>
          <p>Lectura simple de cupones usados para validar medición del MVP.</p>
        </div>
        <Button href="/admin" variant="secondary">
          Volver al admin
        </Button>
      </section>

      <section className="admin-stats" aria-label="Resumen de canjes">
        <article className="admin-stat">
          <span>Total de canjes</span>
          <strong>{filteredRedemptions.length}</strong>
        </article>
        <article className="admin-stat">
          <span>Comercios con canjes</span>
          <strong>{merchantsWithRedemptions}</strong>
        </article>
        <article className="admin-stat">
          <span>Ofertas con canjes</span>
          <strong>{offersWithRedemptions}</strong>
        </article>
        <article className="admin-stat">
          <span>Último canje</span>
          <strong>
            {latestRedemption ? formatDate(latestRedemption.redeemedAt) : "Sin datos"}
          </strong>
        </article>
      </section>

      <form action="/admin/canjes" className="admin-filters" method="get">
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
        className="admin-table admin-redemptions-table"
        aria-label="Listado admin de canjes"
      >
        <div className="admin-table-row admin-table-head">
          <span>Oferta</span>
          <span>Comercio</span>
          <span>Código</span>
          <span>Fecha</span>
          <span>Notas</span>
        </div>
        {filteredRedemptions.map((redemption) => (
          <div className="admin-table-row" key={redemption.id}>
            <span>
              <strong>{redemption.offerTitle}</strong>
              <small>{redemption.offerSlug || "Sin slug de oferta"}</small>
            </span>
            <span>
              <strong>{redemption.merchantName}</strong>
              <small>{redemption.merchantSlug || "Sin slug de comercio"}</small>
            </span>
            <span className="code-badge">{redemption.couponCode}</span>
            <span>{formatDate(redemption.redeemedAt)}</span>
            <span>{redemption.notes ?? "Sin notas"}</span>
          </div>
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
