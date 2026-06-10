import { MerchantCard } from "@/components/merchants/MerchantCard";
import { categories, getMerchants, getOffersByMerchantId } from "@/lib/mock-data";

export default function MerchantsPage() {
  const merchants = getMerchants();

  return (
    <div className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">Comercios locales</p>
        <h1>Negocios con promociones activas para captar clientes de proximidad.</h1>
        <p>
          Una primera guía pública para dar visibilidad a cada comercio y conectar sus
          ofertas con vecinos de la zona.
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
