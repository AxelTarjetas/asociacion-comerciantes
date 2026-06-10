import { categories as mockCategories } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category } from "@/types/app";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug
  };
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return mockCategories;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) {
    console.warn(`Could not load categories from Supabase: ${error.message}`);
    return mockCategories;
  }

  return (data ?? []).map(mapCategory);
}
