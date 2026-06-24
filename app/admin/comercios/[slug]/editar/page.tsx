import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { isLocalAdminEnabled } from "@/lib/admin";
import {
  getAdminCategories,
  updateMerchantAction
} from "@/app/admin/comercios/actions";
import { getAdminMerchantBySlug } from "@/lib/queries/merchants";

type EditMerchantPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "missing-required-fields":
    "Faltan datos obligatorios: nombre, slug y categoría.",
  "supabase-not-configured":
    "Supabase admin no está configurado. Revisa NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
  "slug-already-exists":
    "Ya existe otro comercio con ese slug. Usa un slug diferente.",
  "invalid-url": "La web o la imagen deben ser URLs válidas http(s).",
  "update-failed": "No se pudo guardar el comercio. Revisa los datos."
};

const categoriesErrorMessages: Record<string, string> = {
  "supabase-not-configured":
    "Supabase admin no está configurado. No se pueden editar comercios.",
  "categories-load-failed":
    "No se pudieron cargar las categorías reales desde Supabase.",
  "admin-disabled": "El admin local temporal no está habilitado."
};

export default async function EditMerchantPage({
  params,
  searchParams
}: EditMerchantPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const [{ slug }, filters, categoriesResult] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ error?: string }>({}),
    getAdminCategories()
  ]);
  const merchant = await getAdminMerchantBySlug(slug);

  if (!merchant) {
    notFound();
  }

  const errorMessage = filters.error ? errorMessages[filters.error] : null;
  const categoriesErrorMessage = categoriesResult.error
    ? categoriesErrorMessages[categoriesResult.error]
    : null;
  const hasCategories = categoriesResult.categories.length > 0;

  return (
    <div className="page-shell admin-form-page">
      <section className="admin-detail-hero admin-form-hero">
        <div className="admin-detail-hero-main">
          <p className="eyebrow">Admin local temporal</p>
          <div className="admin-detail-badges">
            <span
              className={
                merchant.isActive === false
                  ? "status-badge status-badge-inactive"
                  : "status-badge status-badge-active"
              }
            >
              {merchant.isActive === false ? "Inactivo" : "Activo"}
            </span>
            <span className="status-badge status-badge-muted">
              {merchant.category.name}
            </span>
          </div>
          <h1>Editar comercio</h1>
          <p>Actualiza la ficha pública, los datos de contacto y la visibilidad.</p>
          <div className="admin-detail-context">
            <span>{merchant.name}</span>
            <span>{merchant.slug}</span>
          </div>
        </div>
        <div className="admin-detail-actions">
          <Button href={`/admin/comercios/${merchant.slug}`} variant="secondary">
            Volver al detalle
          </Button>
          <Button href="/admin/comercios" variant="secondary">
            Volver a comercios
          </Button>
        </div>
      </section>

      {categoriesErrorMessage ? (
        <p className="admin-form-error">{categoriesErrorMessage}</p>
      ) : null}
      {!categoriesErrorMessage && !hasCategories ? (
        <p className="admin-form-error">Primero necesitas crear categorías en Supabase.</p>
      ) : null}
      {errorMessage ? <p className="admin-form-error">{errorMessage}</p> : null}

      {categoriesErrorMessage || !hasCategories ? null : (
        <form className="admin-form admin-structured-form" action={updateMerchantAction}>
          <input name="merchant_id" type="hidden" value={merchant.id} />
          <input name="current_slug" type="hidden" value={merchant.slug} />

          <section className="admin-form-card" aria-label="Identidad del comercio">
            <div className="admin-form-card-header">
              <p className="eyebrow">Identidad</p>
              <h2>Datos básicos</h2>
            </div>
            <div className="admin-form-grid">
              <label>
                <span>Nombre</span>
                <input name="name" required type="text" defaultValue={merchant.name} />
                <small>Nombre público del comercio.</small>
              </label>

              <label>
                <span>Slug</span>
                <input name="slug" required type="text" defaultValue={merchant.slug} />
                <small>Se normaliza al guardar y debe ser único.</small>
              </label>

              <label>
                <span>Categoría</span>
                <select name="category_id" required defaultValue={merchant.categoryId}>
                  {categoriesResult.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <small>Categoría real de Supabase asociada al comercio.</small>
              </label>

              <label>
                <span>Estado</span>
                <select
                  name="is_active"
                  defaultValue={merchant.isActive === false ? "false" : "true"}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
                <small>Controla si aparece en la parte pública.</small>
              </label>
            </div>
          </section>

          <section className="admin-form-card" aria-label="Información pública">
            <div className="admin-form-card-header">
              <p className="eyebrow">Ficha pública</p>
              <h2>Descripción y ubicación</h2>
            </div>
            <div className="admin-form-grid">
              <label className="admin-form-field-wide">
                <span>Descripción</span>
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={merchant.description}
                />
                <small>Texto breve para explicar qué ofrece el comercio.</small>
              </label>

              <label>
                <span>Ciudad / zona</span>
                <input name="city" type="text" defaultValue={merchant.city ?? ""} />
                <small>Ejemplo: Murcia, Puente Tocinos o tu barrio.</small>
              </label>

              <label>
                <span>Dirección</span>
                <input name="address" type="text" defaultValue={merchant.address} />
                <small>Añade calle, número y zona si la conoces.</small>
              </label>
            </div>
          </section>

          <section className="admin-form-card" aria-label="Contacto y enlaces">
            <div className="admin-form-card-header">
              <p className="eyebrow">Contacto</p>
              <h2>Teléfono, web e imagen</h2>
            </div>
            <div className="admin-form-grid">
              <label>
                <span>Teléfono</span>
                <input name="phone" type="text" defaultValue={merchant.phone} />
                <small>Teléfono público del comercio.</small>
              </label>

              <label>
                <span>Web</span>
                <input
                  name="website_url"
                  type="url"
                  defaultValue={merchant.websiteUrl ?? ""}
                />
                <small>Debe ser una URL http(s) válida si se informa.</small>
              </label>

              <label className="admin-form-field-wide">
                <span>Imagen / logo URL</span>
                <input
                  name="image_url"
                  type="url"
                  defaultValue={merchant.imageUrl ?? ""}
                />
                <small>No hay subida de archivos todavía; usa solo una URL externa.</small>
              </label>
            </div>
          </section>

          <div className="admin-form-actions admin-form-footer-actions">
            <button className="button button-primary" type="submit">
              Guardar cambios
            </button>
            <Button href={`/admin/comercios/${merchant.slug}`} variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
