import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { getAdminMerchants } from "@/lib/queries/merchants";

export default async function AdminMerchantsPage() {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const merchants = await getAdminMerchants();

  return (
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>Comercios</h1>
          <p>Listado de solo lectura para revisar comercios registrados.</p>
        </div>
        <div className="admin-heading-actions">
          <Button href="/admin/comercios/nuevo">Nuevo comercio</Button>
          <Button href="/admin" variant="secondary">
            Volver al admin
          </Button>
        </div>
      </section>

      <section
        className="admin-table admin-merchants-table"
        aria-label="Listado admin de comercios"
      >
        <div className="admin-table-row admin-table-head">
          <span>Comercio</span>
          <span>Categoría</span>
          <span>Teléfono</span>
          <span>Dirección</span>
          <span>Estado</span>
        </div>
        {merchants.map((merchant) => (
          <div className="admin-table-row" key={merchant.id}>
            <span>
              <strong>
                <Link href={`/admin/comercios/${merchant.slug}`}>
                  {merchant.name}
                </Link>
              </strong>
              <small>{merchant.slug}</small>
            </span>
            <span>{merchant.category.name}</span>
            <span>{merchant.phone || "Sin teléfono"}</span>
            <span>{merchant.address || "Sin dirección"}</span>
            <span
              className={
                merchant.isActive === false
                  ? "status-badge status-badge-inactive"
                  : "status-badge status-badge-active"
              }
            >
              {merchant.isActive === false ? "Inactivo" : "Activo"}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
