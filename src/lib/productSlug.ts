/**
 * Product URL generation following the format:
 * /{state-slug}/{category-slug}/{sub-category-slug}/{product-slug}
 * 
 * Examples:
 * - /haryana/beer/lager/kingfisher-premium-malt-strong
 * - /karnataka/whisky/blended/royal-stag
 */

import { generateSlug } from './slug';

interface ProductUrlParams {
  stateName?: string | null;
  categorySlug?: string | null;
  subCategorySlug?: string | null;
  productSlug?: string | null;
  productName?: string;
  brandName?: string;
}

/**
 * Generate the full product URL path
 */
export function generateProductUrl(params: ProductUrlParams): string {
  const {
    stateName,
    categorySlug,
    subCategorySlug,
    productSlug,
    productName,
    brandName
  } = params;

  // Generate product slug if not provided
  const slug = productSlug || (productName && brandName 
    ? generateSlug(`${brandName} ${productName}`) 
    : productName 
      ? generateSlug(productName)
      : '');

  if (!slug) return '/';

  // Build URL parts
  const parts = [];
  
  // Add state (default to 'india' if not provided)
  parts.push(stateName ? generateSlug(stateName) : 'india');
  
  // Add category (default to 'liquor' if not provided)
  parts.push(categorySlug || 'liquor');
  
  // Add sub-category (default to 'all' if not provided)
  parts.push(subCategorySlug || 'all');
  
  // Add product slug
  parts.push(slug);

  return '/' + parts.join('/');
}

/**
 * Generate product URL with volume appended
 * Format: /bevory/{state}/{category}/{subcategory}/{product-slug}-{volume}
 */
export function generateProductUrlWithVolume(
  params: ProductUrlParams,
  volume: string
): string {
  const baseUrl = generateProductUrl(params);
  
  // Normalize volume (e.g., "750ml" -> "750ml", "1000 ml" -> "1000ml")
  const normalizedVolume = volume.toLowerCase().replace(/\s+/g, '');
  
  return `${baseUrl}-${normalizedVolume}`;
}

/**
 * Parse product URL to extract components
 */
export function parseProductUrl(path: string): {
  state: string | null;
  category: string | null;
  subCategory: string | null;
  productSlug: string | null;
  volume: string | null;
} {
  const parts = path.split('/').filter(Boolean);
  
  // Expected format: state/category/subcategory/product-slug[-volume]
  // Can be 4 segments or more if there's bevory prefix (legacy)
  if (parts.length < 4) {
    return { state: null, category: null, subCategory: null, productSlug: null, volume: null };
  }

  // Skip 'bevory' prefix if present (legacy support)
  const startIndex = parts[0] === 'bevory' ? 1 : 0;
  
  if (parts.length - startIndex < 4) {
    return { state: null, category: null, subCategory: null, productSlug: null, volume: null };
  }

  const [state, category, subCategory, productWithVolume] = parts.slice(startIndex);
  
  // Check if product slug ends with a volume (e.g., -750ml, -1000ml)
  const volumeMatch = productWithVolume.match(/-(\d+ml)$/);
  const volume = volumeMatch ? volumeMatch[1] : null;
  const productSlug = volume 
    ? productWithVolume.replace(/-\d+ml$/, '')
    : productWithVolume;

  return {
    state,
    category,
    subCategory,
    productSlug,
    volume
  };
}

/**
 * Legacy slug redirect mapping
 * Converts old /product/{slug} URLs to new format
 */
export function isLegacyProductUrl(path: string): boolean {
  return path.startsWith('/product/');
}
