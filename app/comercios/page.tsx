import { MerchantCard } from "@/components/merchants/MerchantCard";
import { categories, getMerchants, getOffersByMerchantId } from "@/lib/mock-data";

export default function MerchantsPage() {
  const merchants = getMerchants();

  return (
    <div className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">Comercios asociados</p>
        <h1>Negocios locales para descubrir cerca de ti.</h1>
        <p>
          Una primera guía pública con comercios activos, categorías útiles y datos
          basicos de contacto.
        </p>
        <div className="toolbar" aria-label="Categorias disponibles">
          {categories.map((category) => (
            <span className="pill" key={category.id}>
              {category.name}
            </span>
          ))}
        </div>
      </section>

      <section className="grid" aria-label="Listado de comercios">
        {merchants.map((merchant) => (
          <MerchantCard
            key={merchant.id}
            merchant={merchant}
            offerCount={getOffersByMerchantId(merchant.id).length}
          />
        ))}
      </section>
    </div>
  );
}
