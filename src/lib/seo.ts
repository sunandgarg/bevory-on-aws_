/**
 * Domain configuration for SEO
 * Primary domain is www.bevory.in
 */

export const PRIMARY_DOMAIN = "https://www.bevory.in";

/**
 * Generate a full canonical URL from a path
 */
export function getCanonicalUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${PRIMARY_DOMAIN}${normalizedPath}`;
}

/**
 * Generate OG image URL
 */
export function getOgImageUrl(path?: string): string {
  if (!path) return `${PRIMARY_DOMAIN}/og-image.png`;
  if (path.startsWith('http')) return path;
  return `${PRIMARY_DOMAIN}${path.startsWith('/') ? path : '/' + path}`;
}

/**
 * Check if current domain is the primary domain
 * Used for redirect logic
 */
export function isOnPrimaryDomain(): boolean {
  if (typeof window === 'undefined') return true;
  return window.location.hostname === 'www.bevory.in';
}

/**
 * Redirect to primary domain if on non-www
 */
export function redirectToPrimaryDomain(): void {
  if (typeof window === 'undefined') return;
  
  const hostname = window.location.hostname;
  
  // Redirect bevory.in to www.bevory.in
  if (hostname === 'bevory.in') {
    window.location.replace(
      `https://www.bevory.in${window.location.pathname}${window.location.search}`
    );
  }
}
