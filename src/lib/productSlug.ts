/**
 * Canonical product URL generation.
 * Format: /{city-slug}/product/{product-slug}[/{volume}]
 */

import { generateSlug } from './slug';
import { BEVORY_CITIES } from './locations';

interface ProductUrlParams {
  cityName?: string | null;
  citySlug?: string | null;
  productSlug?: string | null;
  productName?: string;
  brandName?: string;
}

/**
 * Generate the full product URL path
 */
export function generateProductUrl(params: ProductUrlParams): string {
  const { cityName, citySlug, productSlug, productName, brandName } = params;

  // Generate product slug if not provided
  const slug = productSlug || (productName && brandName 
    ? generateSlug(`${brandName} ${productName}`) 
    : productName 
      ? generateSlug(productName)
      : '');

  if (!slug) return '/';

  const matchedCity = BEVORY_CITIES.find((city) => (
    city.slug === citySlug || city.name.toLowerCase() === cityName?.toLowerCase()
  ));
  return `/${matchedCity?.slug || citySlug || 'gurgaon'}/product/${slug}`;
}

/**
 * Generate product URL with volume appended
 * Format: /{city}/product/{product-slug}/{volume}
 */
export function generateProductUrlWithVolume(
  params: ProductUrlParams,
  volume: string
): string {
  const baseUrl = generateProductUrl(params);
  
  // Normalize volume (e.g., "750ml" -> "750ml", "1000 ml" -> "1000ml")
  const normalizedVolume = volume.toLowerCase().replace(/\s+/g, '');
  
  return `${baseUrl}/${normalizedVolume}`;
}

/**
 * Parse product URL to extract components
 */
export function parseProductUrl(path: string): {
  city: string | null;
  state: string | null;
  category: string | null;
  subCategory: string | null;
  productSlug: string | null;
  volume: string | null;
} {
  const parts = path.split('/').filter(Boolean);

  // Canonical format: /{city}/product/{product-slug}[/{volume}]
  if ((parts.length === 3 || parts.length === 4) && parts[1] === 'product') {
    return {
      city: parts[0],
      state: null,
      category: null,
      subCategory: null,
      productSlug: parts[2],
      volume: parts[3] || null,
    };
  }

  // Skip 'bevory' prefix if present (legacy support)
  const startIndex = parts[0] === 'bevory' ? 1 : 0;
  if (parts.length - startIndex < 4) {
    return { city: null, state: null, category: null, subCategory: null, productSlug: null, volume: null };
  }

  const [state, category, subCategory, productWithVolume] = parts.slice(startIndex);
  
  // Check if product slug ends with a volume (e.g., -750ml, -1000ml)
  const volumeMatch = productWithVolume.match(/-(\d+ml)$/);
  const volume = volumeMatch ? volumeMatch[1] : null;
  const productSlug = volume 
    ? productWithVolume.replace(/-\d+ml$/, '')
    : productWithVolume;

  return {
    city: null,
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
  const parts = path.split('/').filter(Boolean);
  if (path.startsWith('/product/') || path.startsWith('/bevory/')) return true;
  return parts.length === 4 && parts[1] !== 'product';
}
