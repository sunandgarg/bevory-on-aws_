import { useState, useCallback } from "react";
import { apiClient } from "@/integrations/api/client";
import { useLocation } from "./useLocation";
import { generatePartyPlan, calculateBudgetUtilization, type PartyRecommendation, type Product, type Category } from "@/engine/partyPlannerEngine";

export type { PartyRecommendation, Product };

export const usePartyPlanner = () => {
  const { selectedCity } = useLocation();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<PartyRecommendation[]>([]);
  const [budgetInfo, setBudgetInfo] = useState<{ used: number; percentage: number; message: string } | null>(null);

  const getRecommendations = useCallback(
    async (guests: number, budget: number, categorySlugsOrIds: string[] = ["blended-scotch", "beers", "red-wine"]) => {
      setLoading(true);
      setRecommendations([]);
      setBudgetInfo(null);

      try {
        // Fetch categories - try by ID first, then by slug
        let categories: Category[] = [];
        
        const { data: categoriesById } = await apiClient
          .from("categories")
          .select("id, name, slug, emoji")
          .eq("is_active", true)
          .in("id", categorySlugsOrIds);

        if (categoriesById && categoriesById.length > 0) {
          categories = categoriesById;
        } else {
          const { data: categoriesBySlug } = await apiClient
            .from("categories")
            .select("id, name, slug, emoji")
            .eq("is_active", true)
            .in("slug", categorySlugsOrIds);
          categories = categoriesBySlug || [];
        }

        if (categories.length === 0) {
          console.warn("No categories found for:", categorySlugsOrIds);
          setLoading(false);
          return;
        }

        const categorySlugs = categories.map(c => c.slug);
        const categoryIds = categories.map(c => c.id);

        // Fetch all products for selected categories
        const { data: productsRaw, error: productsError } = await apiClient
          .from("products")
          .select(`
            id, name, brand, rating, volume, image_emoji, image_url, category_id,
            category:categories(name, slug, emoji)
          `)
          .eq("is_active", true)
          .in("category_id", categoryIds);

        if (productsError) {
          console.error("Error fetching products:", productsError);
          setLoading(false);
          return;
        }

        if (!productsRaw || productsRaw.length === 0) {
          console.warn("No products found for categories:", categorySlugs);
          setLoading(false);
          return;
        }

        // Fetch prices - prioritize city-specific prices
        const priceMap = new Map<string, { price: number; mrp: number | null; volume_ml: number | null }>();

        if (selectedCity) {
          const { data: cityPrices } = await apiClient
            .from("product_prices")
            .select("product_id, price, mrp, volume_ml")
            .eq("city_id", selectedCity.id)
            .eq("price_available", true)
            .neq("requires_review", true)
            .gt("price", 0);

          if (cityPrices && cityPrices.length > 0) {
            for (const p of cityPrices) {
              const candidate = { price: Number(p.price), mrp: p.mrp == null ? null : Number(p.mrp), volume_ml: p.volume_ml ?? null };
              const current = priceMap.get(p.product_id);
              const candidateRank = candidate.volume_ml === 750 ? Number.MAX_SAFE_INTEGER : candidate.volume_ml ?? 0;
              const currentRank = current?.volume_ml === 750 ? Number.MAX_SAFE_INTEGER : current?.volume_ml ?? 0;
              if (!current || candidateRank > currentRank) priceMap.set(p.product_id, candidate);
            }
          }
        }

        // Build products with prices by category
        const productsByCategory: Record<string, Product[]> = {};

        for (const product of productsRaw) {
          const categorySlug = product.category?.slug;
          if (!categorySlug || !categorySlugs.includes(categorySlug)) continue;

          const priceData = priceMap.get(product.id);
          if (!priceData || priceData.price <= 0) continue;

          const enrichedProduct: Product = {
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: priceData.price,
            rating: product.rating,
            volume: product.volume,
            image_emoji: product.image_emoji,
            image_url: product.image_url,
            category: product.category,
          };

          if (!productsByCategory[categorySlug]) {
            productsByCategory[categorySlug] = [];
          }
          productsByCategory[categorySlug].push(enrichedProduct);
        }

        // Log for debugging
        console.log("Party Planner - Products by category:", 
          Object.entries(productsByCategory).map(([k, v]) => `${k}: ${v.length} products`)
        );

        // Generate recommendations
        const result = generatePartyPlan({
          guests,
          budget,
          selectedCategories: categories,
          productsByCategory,
        });

        // Calculate budget utilization
        const budgetUtilization = calculateBudgetUtilization(result, budget);

        setRecommendations(result);
        setBudgetInfo(budgetUtilization);

        console.log("Party Planner - Results:", {
          categories: result.length,
          totalCost: budgetUtilization.used,
          percentage: budgetUtilization.percentage,
        });

      } catch (err) {
        console.error("Party Planner Error:", err);
      }

      setLoading(false);
    },
    [selectedCity]
  );

  return {
    recommendations,
    getRecommendations,
    loading,
    budgetInfo,
  };
};
