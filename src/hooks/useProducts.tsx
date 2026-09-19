import { useMemo, useCallback } from "react";
import { apiClient } from "@/integrations/api/client";
import { useLocation } from "./useLocation";
import { useQuery } from "@tanstack/react-query";

/* ===================== TYPES ===================== */

export interface Product {
  id: string;
  name: string;
  brand: string;
  slug: string | null;
  category_id: string | null;
  sub_category_id?: string | null;
  price?: number | null;
  mrp?: number | null;
  volume?: string | null;
  rating?: number | null;
  image_emoji?: string | null;
  image_url?: string | null;
  origin?: string | null;
  origin_flag?: string | null;
  abv?: number | null;
  age?: string | null;
  type_tag?: string | null;
  taste_profile?: string | null;
  is_trending?: boolean;
  is_all_time_favourite?: boolean;
  available_variants?: Array<{
    volume: string;
    volume_ml: number | null;
    price: number;
    mrp: number | null;
  }>;
  category?: {
    name: string;
    slug: string;
    emoji: string | null;
  };
  sub_category?: {
    name: string;
    slug: string | null;
    emoji: string | null;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  image_url?: string | null;
  description?: string | null;
}

const EMPTY_CATEGORIES: Category[] = [];
const EMPTY_PRODUCTS: Product[] = [];

/* ===================== FETCHERS ===================== */

const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await apiClient
    .from("categories")
    .select("id, name, slug, emoji, image_url, description")
    .eq("is_active", true)
    .order("order_index");
  if (error) throw error;
  return data as Category[];
};

const fetchCityCatalog = async (cityId: string): Promise<{ categories: Category[]; products: Product[] }> => {
  const { data, error } = await apiClient.catalog.getCity(cityId);
  if (error) throw error;
  return {
    categories: (data?.categories ?? []) as Category[],
    products: (data?.products ?? []) as Product[],
  };
};

/* ===================== HOOK ===================== */

export const useProducts = () => {
  const { selectedCity } = useLocation();

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // categories rarely change
    enabled: !selectedCity?.id,
  });

  const { data: catalogData, isLoading: loading } = useQuery({
    queryKey: ["city-catalog", selectedCity?.id ?? "none"],
    queryFn: () => fetchCityCatalog(selectedCity!.id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(selectedCity?.id),
  });
  const categories = catalogData?.categories ?? categoriesData ?? EMPTY_CATEGORIES;
  const productsRaw = catalogData?.products ?? EMPTY_PRODUCTS;

  // Pre-index products by category slug for O(1) lookups
  const productsByCategorySlug = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of productsRaw) {
      const slug = p.category?.slug;
      if (!slug) continue;
      const arr = map.get(slug);
      if (arr) arr.push(p);
      else map.set(slug, [p]);
    }
    return map;
  }, [productsRaw]);

  const getProductsByCategory = useCallback(
    (slug: string) => productsByCategorySlug.get(slug) ?? [],
    [productsByCategorySlug]
  );

  const trendingProducts = useMemo(
    () => productsRaw.filter(p => p.is_trending).slice(0, 12),
    [productsRaw]
  );

  return {
    products: productsRaw,
    categories,
    loading,
    getProductsByCategory,
    trendingProducts,
  };
};
