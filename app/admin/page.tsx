import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import { getCategories } from "@/lib/queries/categories";
import { getAdminCampaigns } from "@/lib/queries/campaigns";
import { getAdminMerchants } from "@/lib/queries/merchants";
import { getAdminOffers } from "@/lib/queries/offers";
import { getAdminCouponRedemptions } from "@/lib/queries/redemptions";
import { formatDate } from "@/lib/utils";

export default async function AdminPage() {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const [categories, merchants, offers, campaigns, redemptions] = await Promise.all([
    getCategories(),
    getAdminMerchants(),
    getAdminOffers(),
    getAdminCampaigns(),
    getAdminCouponRedemptions()
  ]);

  const activeMerchants = merchants.filter((merchant) => merchant.isActive).length;
  const activeOffers = offers.filter((offer) => offer.isActive).length;
  const activeCampaigns = campaigns.filter((campaign) => campaign.isActive).length;
  const latestRedemption = redemptions[0];
  const hasPublicSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const hasAdminSupabaseConfig = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const statCards = [
    {
      label: "Comercios",
      value: merchants.length,
      helper: `${activeMerchants} activos`,
      mark: "CO"
    },
    {
      label: "Ofertas",
      value: activeOffers,
      helper: `${offers.length} registradas`,
      mark: "OF"
    },
    {
      label: "Campañas",
      value: campaigns.length,
      helper: `${activeCampaigns} activas`,
      mark: "CA"
    },
    {
      label: "Canjes",
      value: redemptions.length,
      helper: latestRedemption ? `Último: ${formatDate(latestRedemption.redeemedAt)}` : "Sin canjes",
      mark: "CJ"
    }
  ];

  const navigationCards = [
    {
      href: "/admin/comercios",
      title: "Gestión de comercios",
      description: "Revisa fichas, estados y datos de contacto.",
      meta: `${merchants.length} comercios`
    },
    {
      href: "/admin/ofertas",
      title: "Gestión de ofertas",
      description: "Controla promociones, códigos y rendimiento.",
      meta: `${activeOffers} activas`
    },
    {
      href: "/admin/campanas",
      title: "Campañas",
      description: "Agrupa ofertas por acciones comerciales.",
      meta: `${campaigns.length} campañas`
    },
    {
      href: "/admin/canjes",
      title: "Canjes y resultados",
      description: "Consulta actividad y señales comerciales.",
      meta: `${redemptions.length} canjes`
    }
  ];

  return (
    <div className="page-shell admin-dashboard">
      <section className="admin-dashboard-hero">
        <div>
          <p className="eyebrow">Admin temporal local</p>
          <h1>Panel de gestión</h1>
          <p>
            Gestiona comercios, ofertas, campañas y canjes desde un panel claro para el
            MVP.
          </p>
        </div>
        <aside className="admin-system-card" aria-label="Estado del sistema">
          <span className="admin-system-title">Estado interno</span>
          <div className="admin-system-list">
            <span className="status-badge status-badge-active">Admin local activo</span>
            <span
              className={
                hasPublicSupabaseConfig
                  ? "status-badge status-badge-active"
                  : "status-badge status-badge-muted"
              }
            >
              {hasPublicSupabaseConfig ? "Supabase público configurado" : "Fallback mock público"}
            </span>
            <span
              className={
                hasAdminSupabaseConfig
                  ? "status-badge status-badge-active"
                  : "status-badge status-badge-muted"
              }
            >
              {hasAdminSupabaseConfig ? "Escritura server configurada" : "Service role pendiente"}
            </span>
          </div>
        </aside>
      </section>

      <section className="admin-dashboard-stats" aria-label="Resumen del admin">
        {statCards.map((stat) => (
          <article className="admin-dashboard-stat" key={stat.label}>
            <span className="admin-stat-mark">{stat.mark}</span>
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.helper}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-dashboard-panel admin-quick-panel">
          <div className="admin-panel-heading">
            <p className="eyebrow">Acciones rápidas</p>
            <h2>Crear o revisar en un clic</h2>
          </div>
          <div className="admin-quick-actions">
            <Button href="/admin/comercios/nuevo">Nuevo comercio</Button>
            <Button href="/admin/ofertas/nueva" variant="secondary">
              Nueva oferta
            </Button>
            <Button href="/admin/campanas/nueva" variant="secondary">
              Nueva campaña
            </Button>
            <Button href="/admin/canjes" variant="secondary">
              Ver canjes
            </Button>
          </div>
        </div>

        <div className="admin-dashboard-panel admin-snapshot-panel">
          <div className="admin-panel-heading">
            <p className="eyebrow">Resumen operativo</p>
            <h2>Datos del MVP</h2>
          </div>
          <dl className="admin-snapshot-list">
            <div>
              <dt>Categorías</dt>
              <dd>{categories.length}</dd>
            </div>
            <div>
              <dt>Ofertas inactivas</dt>
              <dd>{offers.length - activeOffers}</dd>
            </div>
            <div>
              <dt>Último canje</dt>
              <dd>{latestRedemption ? latestRedemption.offerTitle : "Sin actividad"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="admin-dashboard-section" aria-labelledby="admin-navigation-title">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Navegación</p>
            <h2 id="admin-navigation-title">Áreas de gestión</h2>
          </div>
        </div>
        <div className="admin-navigation-grid">
          {navigationCards.map((card) => (
            <Link className="admin-navigation-card" href={card.href} key={card.href}>
              <span>{card.meta}</span>
              <strong>{card.title}</strong>
              <p>{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
