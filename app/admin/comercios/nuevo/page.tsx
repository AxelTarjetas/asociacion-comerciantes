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
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin local temporal</p>
          <h1>Nuevo comercio</h1>
          <p>
            Creación mínima desde servidor para desarrollo local. No es auth real ni un
            panel de producción.
          </p>
        </div>
        <Button href="/admin/comercios" variant="secondary">
          Volver a comercios
        </Button>
      </section>

      {categoriesErrorMessage ? (
        <p className="admin-form-error">{categoriesErrorMessage}</p>
      ) : null}
      {!categoriesErrorMessage && !hasCategories ? (
        <p className="admin-form-error">Primero necesitas crear categorías en Supabase.</p>
      ) : null}
      {errorMessage ? <p className="admin-form-error">{errorMessage}</p> : null}

      {categoriesErrorMessage || !hasCategories ? null : (
        <form className="admin-form" action={createMerchantAction}>
          <label>
            <span>Nombre</span>
            <input name="name" required type="text" />
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
          </label>

          <label>
            <span>Descripción</span>
            <textarea name="description" rows={4} />
          </label>

          <label>
            <span>Dirección</span>
            <input name="address" type="text" />
          </label>

          <label>
            <span>Ciudad</span>
            <input name="city" type="text" />
          </label>

          <label>
            <span>Teléfono</span>
            <input name="phone" type="text" />
          </label>

          <label>
            <span>Web</span>
            <input name="website_url" type="url" />
          </label>

          <label>
            <span>Imagen</span>
            <input name="image_url" type="url" />
          </label>

          <label>
            <span>Estado</span>
            <select name="is_active" defaultValue="true">
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>

          <div className="admin-form-actions">
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
