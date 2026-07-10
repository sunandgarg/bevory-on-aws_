/**
 * Party Planner Engine v2.0
 * Smart drink recommendations that exhaust the budget optimally
 */

export interface Product {
  id: string;
  name: string;
  brand: string;
  price?: number | null;
  rating?: number | null;
  volume?: string | null;
  image_emoji?: string | null;
  image_url?: string | null;
  category?: {
    name: string;
    slug: string;
    emoji: string | null;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
}

export interface PartyRecommendation {
  category: {
    id: string;
    name: string;
    emoji: string;
  };
  quantity: number;
  products: Array<Product & { recommendedQuantity: number }>;
  totalCost: number;
  notes: string;
  servings: number;
}

export interface PartyPlanParams {
  guests: number;
  budget: number;
  selectedCategories: Category[];
  productsByCategory: Record<string, Product[]>;
}

// Serving calculations per category
const CATEGORY_CONFIG: Record<string, { drinksPerPerson: number; servingsPerUnit: number; unitName: string }> = {
  beer: { drinksPerPerson: 3, servingsPerUnit: 1, unitName: "bottles" },
  wine: { drinksPerPerson: 2, servingsPerUnit: 5, unitName: "bottles" },
  whisky: { drinksPerPerson: 2, servingsPerUnit: 12, unitName: "bottles" },
  whiskey: { drinksPerPerson: 2, servingsPerUnit: 12, unitName: "bottles" },
  rum: { drinksPerPerson: 2, servingsPerUnit: 12, unitName: "bottles" },
  vodka: { drinksPerPerson: 2, servingsPerUnit: 12, unitName: "bottles" },
  gin: { drinksPerPerson: 2, servingsPerUnit: 12, unitName: "bottles" },
  tequila: { drinksPerPerson: 2, servingsPerUnit: 12, unitName: "bottles" },
  brandy: { drinksPerPerson: 2, servingsPerUnit: 12, unitName: "bottles" },
  champagne: { drinksPerPerson: 1, servingsPerUnit: 6, unitName: "bottles" },
  liqueurs: { drinksPerPerson: 1, servingsPerUnit: 15, unitName: "bottles" },
};

const getConfig = (slug: string) => {
  const normalized = slug.toLowerCase();
  return CATEGORY_CONFIG[normalized] || { drinksPerPerson: 2, servingsPerUnit: 8, unitName: "units" };
};

/**
 * Calculate value score for a product (higher = better value)
 */
const getValueScore = (product: Product): number => {
  const price = product.price || 999999;
  const rating = product.rating || 3.5;
  // Value = rating^2 / price (emphasize rating while considering price)
  return (rating * rating) / price * 1000;
};

/**
 * Generate smart notes for the recommendation
 */
const generateNotes = (
  slug: string,
  quantity: number,
  guests: number,
  servings: number,
  budgetUsed: number,
  categoryBudget: number
): string => {
  const config = getConfig(slug);
  const budgetPercent = Math.round((budgetUsed / categoryBudget) * 100);
  
  const baseNote = `${quantity} ${config.unitName} (~${servings} servings for ${guests} guests)`;
  
  if (budgetPercent >= 90) {
    return `${baseNote} • Budget optimally used`;
  } else if (budgetPercent >= 70) {
    return `${baseNote} • Good value selection`;
  }
  return baseNote;
};

/**
 * Select products to maximize budget usage while maintaining variety
 */
const selectProductsForBudget = (
  products: Product[],
  targetBudget: number,
  minUnits: number
): Array<Product & { recommendedQuantity: number }> => {
  if (products.length === 0) return [];

  // Sort by value score (best value first)
  const sortedProducts = [...products].sort((a, b) => getValueScore(b) - getValueScore(a));
  
  const result: Map<string, { product: Product; quantity: number }> = new Map();
  let totalSpent = 0;
  let totalUnits = 0;

  // First pass: try to meet minimum units with best value products
  for (const product of sortedProducts) {
    if (totalUnits >= minUnits) break;
    const price = product.price || 0;
    if (price <= 0) continue;

    const canBuy = Math.floor((targetBudget - totalSpent) / price);
    const needMore = minUnits - totalUnits;
    const toBuy = Math.min(canBuy, Math.max(1, needMore));

    if (toBuy > 0) {
      result.set(product.id, { product, quantity: toBuy });
      totalSpent += price * toBuy;
      totalUnits += toBuy;
    }
  }

  // Second pass: exhaust remaining budget with variety
  const remainingBudget = targetBudget - totalSpent;
  if (remainingBudget > 0) {
    // Try to add more variety by selecting different products
    const usedIds = new Set(result.keys());
    
    for (const product of sortedProducts) {
      if (usedIds.has(product.id)) continue;
      const price = product.price || 0;
      if (price <= 0 || price > remainingBudget - totalSpent + targetBudget * 0.1) continue;

      const canBuy = Math.floor((targetBudget - totalSpent) / price);
      if (canBuy > 0) {
        result.set(product.id, { product, quantity: Math.min(canBuy, 2) }); // Max 2 for variety
        totalSpent += price * Math.min(canBuy, 2);
      }
    }

    // Third pass: max out remaining budget by adding more of the best value products
    for (const product of sortedProducts) {
      const price = product.price || 0;
      if (price <= 0) continue;

      const additionalCanBuy = Math.floor((targetBudget - totalSpent) / price);
      if (additionalCanBuy > 0) {
        const existing = result.get(product.id);
        if (existing) {
          existing.quantity += additionalCanBuy;
        } else {
          result.set(product.id, { product, quantity: additionalCanBuy });
        }
        totalSpent += price * additionalCanBuy;
      }

      // Stop if we've used most of the budget
      if (totalSpent >= targetBudget * 0.95) break;
    }
  }

  return Array.from(result.values()).map(({ product, quantity }) => ({
    ...product,
    recommendedQuantity: quantity,
  }));
};

/**
 * Main function to generate party plan recommendations
 */
export const generatePartyPlan = ({
  guests,
  budget,
  selectedCategories,
  productsByCategory,
}: PartyPlanParams): PartyRecommendation[] => {
  const recommendations: PartyRecommendation[] = [];
  
  if (selectedCategories.length === 0 || budget <= 0) {
    return recommendations;
  }

  // Calculate category weights based on typical party consumption
  const categoryWeights: Record<string, number> = {};
  let totalWeight = 0;

  for (const category of selectedCategories) {
    const slug = category.slug.toLowerCase();
    const products = productsByCategory[category.slug] || [];
    
    // Skip categories with no products
    if (products.length === 0) continue;

    // Weight based on typical consumption patterns
    let weight = 1;
    if (slug === "beer") weight = 1.5; // Beer is often more consumed
    if (slug === "whisky" || slug === "whiskey") weight = 1.3;
    if (slug === "wine") weight = 1.2;
    if (slug === "champagne" || slug === "liqueurs") weight = 0.6;

    categoryWeights[category.id] = weight;
    totalWeight += weight;
  }

  // Allocate budget proportionally
  for (const category of selectedCategories) {
    const products = productsByCategory[category.slug] || [];
    if (products.length === 0) continue;

    const weight = categoryWeights[category.id] || 1;
    const categoryBudget = Math.floor((budget * weight) / totalWeight);
    
    // Skip if budget too low for any product
    const minPrice = Math.min(...products.filter(p => p.price && p.price > 0).map(p => p.price!));
    if (categoryBudget < minPrice) continue;

    const config = getConfig(category.slug);
    
    // Calculate minimum units needed based on guests
    const totalDrinksNeeded = guests * config.drinksPerPerson;
    const minUnitsNeeded = Math.ceil(totalDrinksNeeded / config.servingsPerUnit);

    // Select products to fit budget
    const selectedProducts = selectProductsForBudget(products, categoryBudget, minUnitsNeeded);
    
    if (selectedProducts.length === 0) continue;

    // Calculate totals
    const totalQuantity = selectedProducts.reduce((sum, p) => sum + p.recommendedQuantity, 0);
    const totalCost = selectedProducts.reduce((sum, p) => sum + (p.price || 0) * p.recommendedQuantity, 0);
    const totalServings = totalQuantity * config.servingsPerUnit;

    recommendations.push({
      category: {
        id: category.id,
        name: category.name,
        emoji: category.emoji || "🍸",
      },
      quantity: totalQuantity,
      products: selectedProducts.slice(0, 8), // Limit displayed products
      totalCost,
      servings: totalServings,
      notes: generateNotes(
        category.slug,
        totalQuantity,
        guests,
        totalServings,
        totalCost,
        categoryBudget
      ),
    });
  }

  // Sort by cost (highest first)
  recommendations.sort((a, b) => b.totalCost - a.totalCost);

  return recommendations;
};

/**
 * Calculate if budget is being well utilized
 */
export const calculateBudgetUtilization = (
  recommendations: PartyRecommendation[],
  budget: number
): { used: number; percentage: number; message: string } => {
  const used = recommendations.reduce((sum, r) => sum + r.totalCost, 0);
  const percentage = Math.round((used / budget) * 100);
  
  let message = "";
  if (percentage >= 90) {
    message = "Excellent! Your budget is optimally utilized.";
  } else if (percentage >= 70) {
    message = "Good budget utilization. Consider adding more variety.";
  } else if (percentage >= 50) {
    message = "Room for more drinks. Add categories or increase quantities.";
  } else {
    message = "Low budget usage. Check product availability in your city.";
  }

  return { used, percentage, message };
};
