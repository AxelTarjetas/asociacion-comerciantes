import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { setMerchantActiveAction } from "@/app/admin/comercios/actions";
import { getAdminMerchants } from "@/lib/queries/merchants";

export default async function AdminMerchantsPage() {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const merchants = await getAdminMerchants();
  const activeMerchants = merchants.filter((merchant) => merchant.isActive !== false);
  const inactiveMerchants = merchants.filter((merchant) => merchant.isActive === false);

  return (
    <div className="page-shell admin-list-page">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>Comercios</h1>
          <p>Gestiona fichas, visibilidad y datos básicos de los comercios registrados.</p>
        </div>
        <div className="admin-heading-actions">
          <Button href="/admin/comercios/nuevo">Nuevo comercio</Button>
          <Button href="/admin" variant="secondary">
            Volver al admin
          </Button>
        </div>
      </section>

      <section className="admin-list-summary" aria-label="Resumen de comercios">
        <article>
          <span>Total</span>
          <strong>{merchants.length}</strong>
          <small>comercios registrados</small>
        </article>
        <article>
          <span>Activos</span>
          <strong>{activeMerchants.length}</strong>
          <small>visibles en público</small>
        </article>
        <article>
          <span>Inactivos</span>
          <strong>{inactiveMerchants.length}</strong>
          <small>ocultos temporalmente</small>
        </article>
      </section>

      <section
        className="admin-list-section admin-merchants-list"
        aria-label="Listado admin de comercios"
      >
        {merchants.length > 0 ? (
          merchants.map((merchant) => {
            const nextIsActive = merchant.isActive === false;

            return (
              <article className="admin-list-card admin-merchant-list-card" key={merchant.id}>
                <div className="admin-list-card-main">
                  <div className="admin-list-card-title-row">
                    <span
                      className={
                        merchant.isActive === false
                          ? "status-badge status-badge-inactive"
                          : "status-badge status-badge-active"
                      }
                    >
                      {merchant.isActive === false ? "Inactivo" : "Activo"}
                    </span>
                    <span className="admin-list-card-kicker">
                      {merchant.category.name}
                    </span>
                  </div>
                  <h2>
                    <Link href={`/admin/comercios/${merchant.slug}`}>
                      {merchant.name}
                    </Link>
                  </h2>
                  <small className="admin-list-slug">{merchant.slug}</small>
                  <div className="admin-list-meta-grid">
                    <span>
                      <strong>Zona</strong>
                      {merchant.city || "Sin zona"}
                    </span>
                    <span>
                      <strong>Teléfono</strong>
                      {merchant.phone || "Sin teléfono"}
                    </span>
                    <span>
                      <strong>Dirección</strong>
                      {merchant.address || "Sin dirección"}
                    </span>
                  </div>
                </div>
                <div className="admin-card-actions">
                  <Button href={`/admin/comercios/${merchant.slug}`} variant="secondary">
                    Ver
                  </Button>
                  <Button
                    href={`/admin/comercios/${merchant.slug}/editar`}
                    variant="secondary"
                  >
                    Editar
                  </Button>
                  <form action={setMerchantActiveAction}>
                    <input name="merchant_id" type="hidden" value={merchant.id} />
                    <input name="merchant_slug" type="hidden" value={merchant.slug} />
                    <input
                      name="is_active"
                      type="hidden"
                      value={nextIsActive ? "true" : "false"}
                    />
                    <input name="return_to" type="hidden" value="/admin/comercios" />
                    <button className="button button-secondary" type="submit">
                      {merchant.isActive === false ? "Activar" : "Desactivar"}
                    </button>
                  </form>
                </div>
              </article>
            );
          })
        ) : (
          <p className="empty-state">Todavía no hay comercios registrados.</p>
        )}
      </section>
    </div>
  );
}
