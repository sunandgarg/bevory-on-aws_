import { useCallback } from "react";
import { useLocation } from "./useLocation";
import { generateSlug } from "@/lib/slug";

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
 * Format: /{state}/{category}/{subcategory}/{product-slug}
 */
export const useProductUrl = () => {
  const { selectedCity, selectedState } = useLocation();

  const getProductUrl = useCallback((product: ProductUrlParams): string => {
    // Get state slug (default to 'india' if not selected)
    const stateSlug = selectedState?.name 
      ? generateSlug(selectedState.name) 
      : 'india';
    
    // Get category slug
    const categorySlug = product.category?.slug 
      || (product.category?.name ? generateSlug(product.category.name) : 'liquor');
    
    // Get sub-category slug
    const subCategorySlug = product.sub_category?.slug 
      || (product.sub_category?.name ? generateSlug(product.sub_category.name) : 'all');
    
    // Get product slug
    const productSlug = product.slug 
      || generateSlug(`${product.brand || ''} ${product.name || ''}`);

    return `/${stateSlug}/${categorySlug}/${subCategorySlug}/${productSlug}`;
  }, [selectedState]);

  /**
   * Generate product URL with volume
   * Format: /bevory/{state}/{category}/{subcategory}/{product-slug}-{volume}
   */
  const getProductUrlWithVolume = useCallback((
    product: ProductUrlParams, 
    volume: string
  ): string => {
    const baseUrl = getProductUrl(product);
    const normalizedVolume = volume.toLowerCase().replace(/\s+/g, '');
    return `${baseUrl}-${normalizedVolume}`;
  }, [getProductUrl]);

  /**
   * Fallback to legacy URL if no category/subcategory info available
   */
  const getProductUrlSafe = useCallback((product: ProductUrlParams): string => {
    // If we have category info, use new format
    if (product.category?.slug || product.category?.name) {
      return getProductUrl(product);
    }
    // Fallback to legacy format
    return `/product/${product.slug || product.id}`;
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
 * Format: /{state}/{category}/{subcategory}/{product-slug}
 */
export function generateProductUrlStatic(
  product: ProductUrlParams,
  stateName?: string | null
): string {
  const stateSlug = stateName ? generateSlug(stateName) : 'india';
  const categorySlug = product.category?.slug 
    || (product.category?.name ? generateSlug(product.category.name) : 'liquor');
  const subCategorySlug = product.sub_category?.slug 
    || (product.sub_category?.name ? generateSlug(product.sub_category.name) : 'all');
  const productSlug = product.slug 
    || generateSlug(`${product.brand || ''} ${product.name || ''}`);

  return `/${stateSlug}/${categorySlug}/${subCategorySlug}/${productSlug}`;
}
