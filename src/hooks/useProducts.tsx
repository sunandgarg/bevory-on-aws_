import { useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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

/* ===================== FETCHERS ===================== */

const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, emoji, image_url, description")
    .order("order_index");
  if (error) throw error;
  return data as Category[];
};

const fetchProducts = async (cityId?: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(name, slug, emoji),
      sub_category:sub_categories(name, slug, emoji)
    `);
  if (error) throw error;

  if (!cityId) return data as Product[];

  const { data: prices } = await supabase
    .from("product_prices")
    .select("product_id, price, mrp")
    .eq("city_id", cityId);

  if (!prices?.length) return data as Product[];

  // O(1) lookup via Map instead of array scan per product
  const priceMap = new Map<string, { price: number; mrp: number | null }>();
  for (const p of prices) {
    priceMap.set(p.product_id, { price: p.price, mrp: p.mrp });
  }

  return data.map(p => {
    const cityPrice = priceMap.get(p.id);
    return cityPrice
      ? { ...p, price: cityPrice.price, mrp: cityPrice.mrp }
      : { ...p, price: 0, mrp: null };
  }) as Product[];
};

/* ===================== HOOK ===================== */

export const useProducts = () => {
  const { selectedCity } = useLocation();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // categories rarely change
  });

  const { data: productsRaw = [], isLoading: loading } = useQuery({
    queryKey: ["products", selectedCity?.id ?? "all"],
    queryFn: () => fetchProducts(selectedCity?.id),
    staleTime: 5 * 60 * 1000,
  });

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
