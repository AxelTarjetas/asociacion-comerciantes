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
    <div className="page-shell">
      <section className="admin-page-heading">
        <div>
          <p className="eyebrow">Admin local temporal</p>
          <h1>Editar comercio</h1>
          <p>Actualización mínima desde servidor para desarrollo local.</p>
        </div>
        <Button href={`/admin/comercios/${merchant.slug}`} variant="secondary">
          Volver al detalle
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
        <form className="admin-form" action={updateMerchantAction}>
          <input name="merchant_id" type="hidden" value={merchant.id} />
          <input name="current_slug" type="hidden" value={merchant.slug} />

          <label>
            <span>Nombre</span>
            <input name="name" required type="text" defaultValue={merchant.name} />
          </label>

          <label>
            <span>Slug</span>
            <input name="slug" required type="text" defaultValue={merchant.slug} />
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
          </label>

          <label>
            <span>Descripción</span>
            <textarea name="description" rows={4} defaultValue={merchant.description} />
          </label>

          <label>
            <span>Dirección</span>
            <input name="address" type="text" defaultValue={merchant.address} />
          </label>

          <label>
            <span>Ciudad / zona</span>
            <input name="city" type="text" defaultValue={merchant.city ?? ""} />
          </label>

          <label>
            <span>Teléfono</span>
            <input name="phone" type="text" defaultValue={merchant.phone} />
          </label>

          <label>
            <span>Web</span>
            <input
              name="website_url"
              type="url"
              defaultValue={merchant.websiteUrl ?? ""}
            />
          </label>

          <label>
            <span>Imagen / logo URL</span>
            <input name="image_url" type="url" defaultValue={merchant.imageUrl ?? ""} />
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
          </label>

          <div className="admin-form-actions">
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
