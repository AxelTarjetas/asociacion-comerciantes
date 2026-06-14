import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { getCategories } from "@/lib/queries/categories";
import { getAdminMerchants } from "@/lib/queries/merchants";
import { getAdminOffers } from "@/lib/queries/offers";

export default async function AdminPage() {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const [categories, merchants, offers] = await Promise.all([
    getCategories(),
    getAdminMerchants(),
    getAdminOffers()
  ]);

  return (
    <div className="page-shell">
      <section className="admin-hero">
        <p className="eyebrow">Admin temporal local</p>
        <h1>Panel de lectura para revisar datos del MVP.</h1>
        <p>
          Vista interna de desarrollo. No incluye autenticación, roles ni acciones de
          escritura todavía.
        </p>
      </section>

      <section className="admin-stats" aria-label="Resumen del admin">
        <article className="admin-stat">
          <span>Comercios</span>
          <strong>{merchants.length}</strong>
        </article>
        <article className="admin-stat">
          <span>Ofertas activas</span>
          <strong>{offers.filter((offer) => offer.isActive).length}</strong>
        </article>
        <article className="admin-stat">
          <span>Categorías</span>
          <strong>{categories.length}</strong>
        </article>
      </section>

      <section className="admin-actions" aria-label="Secciones del admin">
        <Button href="/admin/comercios">Comercios</Button>
        <Button href="/admin/ofertas" variant="secondary">
          Ofertas
        </Button>
        <Button href="/admin/canjes" variant="secondary">
          Canjes
        </Button>
      </section>
    </div>
  );
}
