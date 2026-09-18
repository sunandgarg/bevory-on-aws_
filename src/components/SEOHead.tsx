import { useEffect } from "react";

// Primary domain for canonical URLs
const PRIMARY_DOMAIN = "https://bevory.in";

interface SEOHeadProps {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string; // Just the path, e.g., "/haryana/beer/lager/kingfisher"
  jsonLd?: Record<string, unknown>;
  // 2026 SEO enhancements
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  locale?: string;
  // GEO targeting
  geoRegion?: string;
  geoPlacename?: string;
  geoPosition?: string;
}

const SEOHead = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = "website",
  canonical,
  jsonLd,
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  locale = "en_IN",
  geoRegion = "IN",
  geoPlacename,
  geoPosition,
}: SEOHeadProps) => {
  useEffect(() => {
    // Ensure title is under 60 characters for optimal SEO
    const seoTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
    document.title = seoTitle;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      if (!content) return;
      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Ensure description is under 160 characters
    const seoDescription = description && description.length > 160 
      ? description.slice(0, 157) + "..." 
      : description;

    if (seoDescription) {
      updateMeta("description", seoDescription);
      updateMeta("og:description", seoDescription, true);
    }

    if (keywords) {
      updateMeta("keywords", keywords);
    }

    // Open Graph tags (2026 best practices)
    updateMeta("og:title", seoTitle, true);
    updateMeta("og:type", ogType, true);
    updateMeta("og:locale", locale, true);
    updateMeta("og:site_name", "Bevory", true);
    
    // Only set og:image if it's a valid image URL (not emoji)
    // Check if ogImage is a valid URL (starts with http/https or /)
    const isValidImageUrl = ogImage && (
      ogImage.startsWith('http://') || 
      ogImage.startsWith('https://') || 
      ogImage.startsWith('/')
    );
    
    if (isValidImageUrl) {
      updateMeta("og:image", ogImage, true);
      updateMeta("og:image:width", "1200", true);
      updateMeta("og:image:height", "630", true);
      updateMeta("og:image:alt", seoTitle, true);
    } else {
      // Use default OG image if no valid image URL
      updateMeta("og:image", `${PRIMARY_DOMAIN}/og-image.png`, true);
      updateMeta("og:image:width", "1200", true);
      updateMeta("og:image:height", "630", true);
      updateMeta("og:image:alt", seoTitle, true);
    }

    // Article-specific Open Graph
    if (ogType === "article") {
      if (author) updateMeta("article:author", author, true);
      if (publishedTime) updateMeta("article:published_time", publishedTime, true);
      if (modifiedTime) updateMeta("article:modified_time", modifiedTime, true);
      if (section) updateMeta("article:section", section, true);
      if (tags) {
        tags.forEach((tag, i) => updateMeta(`article:tag`, tag, true));
      }
    }

    // Twitter Card (2026 optimized)
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", seoTitle);
    updateMeta("twitter:site", "@bevory");
    if (seoDescription) {
      updateMeta("twitter:description", seoDescription);
    }
    // Use valid image or default for Twitter
    const twitterImage = isValidImageUrl ? ogImage : `${PRIMARY_DOMAIN}/og-image.png`;
    updateMeta("twitter:image", twitterImage!);
    updateMeta("twitter:image:alt", seoTitle);

    // GEO targeting for local SEO
    updateMeta("geo.region", geoRegion);
    if (geoPlacename) updateMeta("geo.placename", geoPlacename);
    if (geoPosition) updateMeta("geo.position", geoPosition);
    updateMeta("ICBM", geoPosition || "28.4595,77.0266"); // Default: Gurgaon

    // Robots meta (allow indexing)
    updateMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

    // Mobile optimization
    updateMeta("mobile-web-app-capable", "yes");
    updateMeta("apple-mobile-web-app-capable", "yes");
    updateMeta("apple-mobile-web-app-status-bar-style", "default");

    // Canonical URL (critical for SEO) - always use the apex domain
    const canonicalUrl = canonical 
      ? (canonical.startsWith('http') ? canonical : `${PRIMARY_DOMAIN}${canonical.startsWith('/') ? canonical : '/' + canonical}`)
      : `${PRIMARY_DOMAIN}${window.location.pathname}`;
    
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);

    // Also set og:url
    updateMeta("og:url", canonicalUrl, true);

    // JSON-LD structured data with enhanced schema
    if (jsonLd) {
      // Add default context and organization
      const enhancedJsonLd = {
        "@context": "https://schema.org",
        ...jsonLd,
      };

      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.textContent = JSON.stringify(enhancedJsonLd);
      } else {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify(enhancedJsonLd);
        document.head.appendChild(script);
      }
    }

    // Cleanup
    return () => {
      document.title = "Bevory - Know Before You Drink";
    };
  }, [title, description, keywords, ogImage, ogType, canonical, jsonLd, author, publishedTime, modifiedTime, section, tags, locale, geoRegion, geoPlacename, geoPosition]);

  return null;
};

export default SEOHead;
