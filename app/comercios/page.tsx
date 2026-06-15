import { MerchantCard } from "@/components/merchants/MerchantCard";
import { getCategories } from "@/lib/queries/categories";
import { getMerchants } from "@/lib/queries/merchants";
import { getOffers } from "@/lib/queries/offers";

export default async function MerchantsPage() {
  const [categories, merchants, offers] = await Promise.all([
    getCategories(),
    getMerchants(),
    getOffers()
  ]);

  return (
    <div className="page-shell public-list-page">
      <section className="listing-header">
        <div>
          <p className="eyebrow">Tu barrio tiene mucho que ofrecer</p>
          <h1>Comercios locales para descubrir</h1>
          <p>Encuentra negocios cercanos, conoce lo que hacen y mira sus promociones.</p>
        </div>
        <div className="listing-count" aria-label={`${merchants.length} comercios locales`}>
          <strong>{merchants.length}</strong>
          <span>comercios locales</span>
        </div>
      </section>

      {categories.length > 0 ? (
        <div className="toolbar" aria-label="Categorias disponibles">
          {categories.map((category) => (
            <span className="pill" key={category.id}>
              {category.name}
            </span>
          ))}
        </div>
      ) : null}

      <section className="grid public-card-grid" aria-label="Listado de comercios">
        {merchants.length > 0 ? (
          merchants.map((merchant) => (
            <MerchantCard
              key={merchant.id}
              merchant={merchant}
              offerCount={offers.filter((offer) => offer.merchantId === merchant.id).length}
            />
          ))
        ) : (
          <div className="public-empty-state">
            <span aria-hidden="true">CV</span>
            <h2>Pronto habrá comercios para descubrir</h2>
            <p>Estamos preparando el directorio local.</p>
          </div>
        )}
      </section>
    </div>
  );
}
