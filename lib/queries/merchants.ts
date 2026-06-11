import {
  getMerchantBySlug as getMockMerchantBySlug,
  getMerchants as getMockMerchants
} from "@/lib/mock-data";
import { isLocalAdminEnabled } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, MerchantWithCategory } from "@/types/app";

type MerchantRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  image_url: string | null;
  category_id: string;
  categories: Category | Category[] | null;
};

function normalizeCategory(category: Category | Category[] | null): Category | null {
  return Array.isArray(category) ? (category[0] ?? null) : category;
}

function mapMerchant(row: MerchantRow): MerchantWithCategory {
  const category = normalizeCategory(row.categories);
  const fallbackCategory = {
    id: row.category_id,
    name: "Sin categoría",
    slug: "sin-categoria"
  };

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categoryId: row.category_id,
    description: row.description ?? "",
    address: row.address ?? "",
    phone: row.phone ?? "",
    imageUrl: row.image_url ?? undefined,
    category: category ?? fallbackCategory
  };
}

const merchantSelect = `
  id,
  name,
  slug,
  description,
  address,
  phone,
  image_url,
  category_id,
  categories (
    id,
    name,
    slug
  )
`;

export async function getMerchants(): Promise<MerchantWithCategory[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return getMockMerchants();
  }

  const { data, error } = await supabase
    .from("merchants")
    .select(merchantSelect)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.warn(`Could not load merchants from Supabase: ${error.message}`);
    return getMockMerchants();
  }

  try {
    return ((data ?? []) as unknown as MerchantRow[]).map(mapMerchant);
  } catch (mappingError) {
    console.warn("Could not map merchants from Supabase:", mappingError);
    return getMockMerchants();
  }
}

export async function getMerchantBySlug(
  slug: string
): Promise<MerchantWithCategory | undefined> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return getMockMerchantBySlug(slug);
  }

  const { data, error } = await supabase
    .from("merchants")
    .select(merchantSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.warn(`Could not load merchant from Supabase: ${error.message}`);
    return getMockMerchantBySlug(slug);
  }

  try {
    return data ? mapMerchant(data as unknown as MerchantRow) : undefined;
  } catch (mappingError) {
    console.warn("Could not map merchant from Supabase:", mappingError);
    return getMockMerchantBySlug(slug);
  }
}

export async function getAdminMerchantBySlug(
  slug: string
): Promise<MerchantWithCategory | undefined> {
  if (!isLocalAdminEnabled()) {
    console.warn("Local admin is disabled. Using mock merchant detail.");
    return getMockMerchantBySlug(slug);
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.warn(
      "Supabase admin is not configured. Using mock merchant detail for local admin."
    );
    return getMockMerchantBySlug(slug);
  }

  const { data, error } = await supabase
    .from("merchants")
    .select(merchantSelect)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.warn(`Could not load admin merchant from Supabase: ${error.message}`);
    return getMockMerchantBySlug(slug);
  }

  try {
    return data ? mapMerchant(data as unknown as MerchantRow) : undefined;
  } catch (mappingError) {
    console.warn("Could not map admin merchant from Supabase:", mappingError);
    return getMockMerchantBySlug(slug);
  }
}
