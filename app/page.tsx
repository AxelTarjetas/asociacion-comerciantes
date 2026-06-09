import { Button } from "@/components/ui/Button";
import { getMerchants, getOffers } from "@/lib/mock-data";

export default function HomePage() {
  const merchants = getMerchants();
  const offers = getOffers();

  return (
    <div className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Comercio local, ofertas activas y cupones medibles</p>
          <h1>Una plataforma sencilla para que el barrio compre cerca.</h1>
          <p className="hero-copy">
            Comercio Vivo ayuda a las asociaciones de comerciantes a mostrar negocios
            locales, publicar promociones útiles y medir cupones por código sin cargar
            de trabajo a cada comercio.
          </p>
          <div className="hero-actions">
            <Button href="/comercios">Ver comercios</Button>
            <Button href="/ofertas" variant="secondary">
              Explorar ofertas
            </Button>
          </div>
        </div>
        <div className="hero-visual" aria-label="Escaparate de comercios locales">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
            alt="Comercio local con mesas preparadas para clientes"
          />
          <div className="hero-visual-caption">
            <div className="hero-stat">
              <strong>{merchants.length}</strong>
              <span>comercios iniciales</span>
            </div>
            <div className="hero-stat">
              <strong>{offers.length}</strong>
              <span>ofertas activas</span>
            </div>
            <div className="hero-stat">
              <strong>1</strong>
              <span>gestión centralizada</span>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-strip" aria-label="Beneficios principales">
        <article className="feature">
          <h2>Descubrimiento local</h2>
          <p>
            Listados claros para encontrar comercios por categoría, ubicación y
            actividad.
          </p>
        </article>
        <article className="feature">
          <h2>Ofertas vivas</h2>
          <p>
            Promociones con fecha fin y código visible para activar campañas de barrio
            sin complejidad.
          </p>
        </article>
        <article className="feature">
          <h2>Cupones medibles</h2>
          <p>
            Base preparada para contar usos por código o QR cuando conectemos Supabase
            en el siguiente bloque.
          </p>
        </article>
      </section>
    </div>
  );
}
