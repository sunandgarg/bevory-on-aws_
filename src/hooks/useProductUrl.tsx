import { useCallback } from "react";
import { useLocation } from "./useLocation";
import { generateProductUrl, generateProductUrlWithVolume } from "@/lib/productSlug";

interface ProductUrlParams {
  id: string;
  slug?: string | null;
  brand?: string;
  name?: string;
  category?: {
    slug?: string;
    name?: string;
  } | null;
  sub_category?: {
    slug?: string | null;
    name?: string;
  } | null;
}

/**
 * Hook to generate SEO-optimized product URLs
 * Format: /{city}/product/{product-slug}
 */
export const useProductUrl = () => {
  const { selectedCity } = useLocation();

  const getProductUrl = useCallback((product: ProductUrlParams): string => {
    return generateProductUrl({
      cityName: selectedCity?.name,
      productSlug: product.slug || product.id,
      productName: product.name,
      brandName: product.brand,
    });
  }, [selectedCity?.name]);

  /**
   * Generate product URL with volume
   * Format: /bevory/{state}/{category}/{subcategory}/{product-slug}-{volume}
   */
  const getProductUrlWithVolume = useCallback((
    product: ProductUrlParams, 
    volume: string
  ): string => {
    return generateProductUrlWithVolume({
      cityName: selectedCity?.name,
      productSlug: product.slug || product.id,
      productName: product.name,
      brandName: product.brand,
    }, volume);
  }, [selectedCity?.name]);

  /**
   * Fallback to legacy URL if no category/subcategory info available
   */
  const getProductUrlSafe = useCallback((product: ProductUrlParams): string => {
    return getProductUrl(product);
  }, [getProductUrl]);

  return {
    getProductUrl,
    getProductUrlWithVolume,
    getProductUrlSafe
  };
};

/**
 * Standalone function to generate product URL without hooks
 * Use this when you don't have access to React context
 * Format: /{city}/product/{product-slug}
 */
export function generateProductUrlStatic(
  product: ProductUrlParams,
  cityName?: string | null
): string {
  return generateProductUrl({
    cityName,
    productSlug: product.slug || product.id,
    productName: product.name,
    brandName: product.brand,
  });
}
