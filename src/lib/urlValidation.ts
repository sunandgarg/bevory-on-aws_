// URL validation utility for external links
const TRUSTED_DOMAINS = [
  'bevory.com',
  'instagram.com',
  'facebook.com',
  'youtube.com',
  'twitter.com',
  'x.com',
  'whatsapp.com',
  'linkedin.com',
  'pinterest.com',
  'tiktok.com',
];

/**
 * Validates if a URL is from a trusted domain
 * Returns true for internal/relative URLs and trusted external domains
 */
export const isValidExternalUrl = (url: string): boolean => {
  try {
    // Allow relative URLs
    if (url.startsWith('/') || url.startsWith('#')) {
      return true;
    }

    const urlObj = new URL(url);
    
    // Require HTTPS for security
    if (urlObj.protocol !== 'https:') {
      return false;
    }
    
    // Check domain is in allowlist
    return TRUSTED_DOMAINS.some(domain => 
      urlObj.hostname === domain || 
      urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
};

/**
 * Opens an external URL safely with noopener and noreferrer
 */
export const openExternalUrl = (url: string): void => {
  window.open(url, "_blank", "noopener,noreferrer");
};

/**
 * Opens a URL safely, with validation for external URLs
 * Returns true if URL was opened, false if it was blocked
 */
export const safeOpenUrl = (url: string, isExternal: boolean = false): boolean => {
  if (isExternal) {
    if (!isValidExternalUrl(url)) {
      return false;
    }
    openExternalUrl(url);
    return true;
  }
  
  // For internal links, just open normally
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
};
