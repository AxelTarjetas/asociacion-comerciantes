"use server";

import { notFound, redirect } from "next/navigation";
import { isLocalAdminEnabled } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Category } from "@/types/app";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function redirectWithError(error: string): never {
  redirect(`/admin/comercios/nuevo?error=${error}`);
}

async function findAvailableMerchantSlug(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  baseSlug: string
) {
  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const candidate = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;
    const { data, error } = await supabase
      .from("merchants")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      console.warn(`Could not check merchant slug availability: ${error.message}`);
      return null;
    }

    if (!data) {
      return candidate;
    }
  }

  return null;
}

type AdminCategoriesResult =
  | {
      categories: Category[];
      error: null;
    }
  | {
      categories: [];
      error: "admin-disabled" | "supabase-not-configured" | "categories-load-failed";
    };

export async function getAdminCategories(): Promise<AdminCategoriesResult> {
  if (!isLocalAdminEnabled()) {
    return {
      categories: [],
      error: "admin-disabled"
    };
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      categories: [],
      error: "supabase-not-configured"
    };
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) {
    console.warn(`Could not load admin categories: ${error.message}`);
    return {
      categories: [],
      error: "categories-load-failed"
    };
  }

  return {
    categories: data ?? [],
    error: null
  };
}

export async function createMerchantAction(formData: FormData) {
  if (!isLocalAdminEnabled()) {
    notFound();
  }

  const name = getString(formData, "name");
  const categoryId = getString(formData, "category_id");
  const baseSlug = createSlug(name);

  if (!name || !categoryId || !baseSlug) {
    redirectWithError("missing-required-fields");
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    redirectWithError("supabase-not-configured");
  }

  const slug = await findAvailableMerchantSlug(supabase, baseSlug);

  if (!slug) {
    redirectWithError("slug-unavailable");
  }

  const { error } = await supabase.from("merchants").insert({
    name,
    slug,
    category_id: categoryId,
    description: optionalString(formData, "description"),
    address: optionalString(formData, "address"),
    city: optionalString(formData, "city"),
    phone: optionalString(formData, "phone"),
    website_url: optionalString(formData, "website_url"),
    image_url: optionalString(formData, "image_url"),
    is_active: getString(formData, "is_active") === "true"
  });

  if (error) {
    console.warn(`Could not create merchant from local admin: ${error.message}`);
    redirectWithError("create-failed");
  }

  redirect("/admin/comercios");
}
