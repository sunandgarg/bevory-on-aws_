/**
 * SEO-optimized slug generation following 2026 best practices
 * 
 * Guidelines:
 * - Lowercase only
 * - Use hyphens as separators (not underscores)
 * - Remove special characters and accents
 * - Max 60-70 characters for optimal SEO
 * - No trailing hyphens
 * - Preserve meaningful words
 */

/**
 * Normalize accented characters to ASCII equivalents
 */
const normalizeAccents = (text: string): string => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Generate a URL-friendly slug from text
 * Follows 2026 SEO/GEO best practices
 */
export function generateSlug(text: string, maxLength: number = 60): string {
  if (!text) return '';
  
  return normalizeAccents(text)
    .toLowerCase()
    .trim()
    // Replace common special characters with meaningful alternatives
    .replace(/&/g, 'and')
    .replace(/@/g, 'at')
    .replace(/%/g, 'percent')
    .replace(/\+/g, 'plus')
    // Remove all other special characters except alphanumeric and spaces
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace multiple spaces or hyphens with single hyphen
    .replace(/[\s-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Truncate to max length at word boundary
    .slice(0, maxLength)
    // Clean up any trailing hyphen from truncation
    .replace(/-+$/, '');
}

/**
 * Generate a unique slug by appending a random suffix if needed
 */
export function generateUniqueSlug(text: string, existingSlugs?: string[], maxLength: number = 60): string {
  const baseSlug = generateSlug(text, maxLength);
  
  if (!existingSlugs || !existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  // Add random suffix (keeping within length limit)
  const suffix = Math.random().toString(36).substring(2, 6);
  const maxBaseLength = maxLength - suffix.length - 1; // -1 for hyphen
  const truncatedBase = generateSlug(text, maxBaseLength);
  
  return `${truncatedBase}-${suffix}`;
}

/**
 * Validate if a slug follows SEO best practices
 */
export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  
  // Check basic format
  const validFormat = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
  
  // Check length (recommended: 3-60 chars)
  const validLength = slug.length >= 3 && slug.length <= 60;
  
  // No consecutive hyphens
  const noDoubleHyphens = !slug.includes('--');
  
  return validFormat && validLength && noDoubleHyphens;
}

/**
 * Generate SEO-optimized slug for products
 * Format: brand-product-name
 */
export function generateProductSlug(brand: string, name: string): string {
  return generateSlug(`${brand} ${name}`, 60);
}

/**
 * Generate SEO-optimized slug for articles
 * Removes common stop words for cleaner URLs
 */
export function generateArticleSlug(title: string): string {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall'];
  
  const words = title.toLowerCase().split(/\s+/);
  const filteredWords = words.filter(word => !stopWords.includes(word));
  
  // Keep at least 3 words even if they're stop words
  const finalWords = filteredWords.length >= 3 ? filteredWords : words;
  
  return generateSlug(finalWords.join(' '), 60);
}
