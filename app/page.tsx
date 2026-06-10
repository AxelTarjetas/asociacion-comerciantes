import { Button } from "@/components/ui/Button";
import { getMerchants, getOffers } from "@/lib/mock-data";

export default function HomePage() {
  const merchants = getMerchants();
  const offers = getOffers();

  return (
    <div className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Comercios locales, promociones exclusivas y resultados medibles</p>
          <h1>Promociones que dan visibilidad y atraen clientes cerca de tu comercio.</h1>
          <p className="hero-copy">
            Comercio Vivo ayuda a pequeños negocios a lanzar ofertas claras, llegar a
            vecinos de su zona y comprobar qué promociones generan interés real antes
            de escalar el modelo a toda una asociación.
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
              <span>comercios piloto</span>
            </div>
            <div className="hero-stat">
              <strong>{offers.length}</strong>
              <span>promociones medibles</span>
            </div>
            <div className="hero-stat">
              <strong>1</strong>
              <span>validación comercial</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section-heading">
        <p className="eyebrow">Cómo ayuda a tu comercio</p>
        <h2>Promociones simples, más visibilidad y señales claras para decidir.</h2>
      </section>

      <section className="feature-strip" aria-label="Cómo ayuda a tu comercio">
        <article className="feature">
          <h2>Crea promociones atractivas</h2>
          <p>
            Convierte una oferta sencilla en una razón concreta para visitar tu tienda
            esta semana.
          </p>
        </article>
        <article className="feature">
          <h2>Llega a vecinos de tu zona</h2>
          <p>
            Da más visibilidad a tu comercio entre personas cercanas que ya compran en
            el barrio.
          </p>
        </article>
        <article className="feature">
          <h2>Mide el interés generado</h2>
          <p>
            Usa códigos y cupones para saber qué mensajes funcionan y qué promociones
            merecen repetirse.
          </p>
        </article>
      </section>

      <section className="growth-section">
        <div>
          <p className="eyebrow">Estrategia MVP</p>
          <h2>Pensado para empezar comercio por comercio y escalar a asociaciones.</h2>
        </div>
        <p>
          Primero validamos con negocios individuales: una promoción, una ficha clara y
          una forma simple de medir respuesta. Cuando el formato demuestre valor, la
          misma base puede agrupar campañas por asociación, zona o categoría sin cambiar
          la experiencia principal.
        </p>
      </section>
    </div>
  );
}
