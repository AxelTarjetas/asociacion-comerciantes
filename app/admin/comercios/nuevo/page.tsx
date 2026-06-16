import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  createMerchantAction,
  getAdminCategories
} from "@/app/admin/comercios/actions";
import { isLocalAdminEnabled } from "@/lib/admin";

type NewMerchantPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "missing-required-fields": "Faltan datos obligatorios: nombre y categoría.",
  "supabase-not-configured":
    "Supabase admin no está configurado. Revisa NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
  "slug-unavailable":
    "No se pudo generar un slug disponible para este comercio. Prueba con un nombre más específico.",
  "create-failed":
    "No se pudo crear el comercio. Revisa que el slug no exista y que la categoría sea válida."
};

const categoriesErrorMessages: Record<string, string> = {
  "supabase-not-configured":
    "Supabase admin no está configurado. No se pueden crear comercios.",
  "categories-load-failed":
    "No se pudieron cargar las categorías reales desde Supabase.",
  "admin-disabled": "El admin local temporal no está habilitado."
};

export default async function NewMerchantPage({ searchParams }: NewMerchantPageProps) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const [params, categoriesResult] = await Promise.all([
    searchParams ?? Promise.resolve<{ error?: string }>({}),
    getAdminCategories()
  ]);
  const { error } = params;
  const errorMessage = error ? errorMessages[error] : null;
  const categoriesErrorMessage = categoriesResult.error
    ? categoriesErrorMessages[categoriesResult.error]
    : null;
  const hasCategories = categoriesResult.categories.length > 0;

  return (
    <div className="page-shell admin-form-page">
      <section className="admin-detail-hero admin-form-hero">
        <div className="admin-detail-hero-main">
          <p className="eyebrow">Admin local temporal</p>
          <h1>Nuevo comercio</h1>
          <p>
            Crea una ficha pública básica para empezar a mostrar ofertas y medir canjes.
          </p>
          <div className="admin-detail-context">
            <span>El slug se genera automáticamente desde el nombre.</span>
          </div>
        </div>
        <div className="admin-detail-actions">
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
        <form className="admin-form admin-structured-form" action={createMerchantAction}>
          <section className="admin-form-card" aria-label="Identidad del comercio">
            <div className="admin-form-card-header">
              <p className="eyebrow">Identidad</p>
              <h2>Datos básicos</h2>
            </div>
            <div className="admin-form-grid">
              <label>
                <span>Nombre</span>
                <input name="name" required type="text" />
                <small>Nombre público del comercio. También se usará para crear el slug inicial.</small>
              </label>

              <label>
                <span>Categoría</span>
                <select name="category_id" required defaultValue="">
                  <option value="" disabled>
                    Selecciona una categoría
                  </option>
                  {categoriesResult.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <small>Usa categorías reales de Supabase para evitar IDs mock.</small>
              </label>

              <label>
                <span>Estado</span>
                <select name="is_active" defaultValue="true">
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
                <small>Los comercios inactivos no se muestran en la parte pública.</small>
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
                <textarea name="description" rows={4} />
                <small>Texto breve para explicar qué ofrece el comercio.</small>
              </label>

              <label>
                <span>Ciudad / zona</span>
                <input name="city" type="text" />
                <small>Barrio, pedanía o zona principal.</small>
              </label>

              <label>
                <span>Dirección</span>
                <input name="address" type="text" />
                <small>Dirección visible para la ficha pública.</small>
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
                <input name="phone" type="text" />
                <small>Teléfono público del comercio.</small>
              </label>

              <label>
                <span>Web</span>
                <input name="website_url" type="url" />
                <small>URL completa, por ejemplo https://...</small>
              </label>

              <label className="admin-form-field-wide">
                <span>Imagen / logo URL</span>
                <input name="image_url" type="url" />
                <small>No hay subida de archivos todavía; usa solo una URL externa.</small>
              </label>
            </div>
          </section>

          <div className="admin-form-actions admin-form-footer-actions">
            <button className="button button-primary" type="submit">
              Crear comercio
            </button>
            <Button href="/admin/comercios" variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
