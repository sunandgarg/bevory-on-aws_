import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/api/client";
import type { Json } from "@/types/json";

interface BrandingItem {
  type: "image" | "text";
  imageUrl?: string;
  lightImageUrl?: string; // For light mode
  darkImageUrl?: string;  // For dark mode
  text?: string;
  bgColor?: string;
  textColor?: string;
}

export interface BrandingSettings {
  header: {
    favicon: BrandingItem;
    logo: BrandingItem;
  };
  footer: {
    favicon: BrandingItem;
    logo: BrandingItem;
  };
}

const DEFAULT_BRANDING: BrandingSettings = {
  header: {
    favicon: {
      type: "text",
      text: "B",
      bgColor: "#D4AF37",
      textColor: "#1a1a2e",
    },
    logo: {
      type: "text",
      text: "Bevory",
      textColor: "currentColor",
    },
  },
  footer: {
    favicon: {
      type: "text",
      text: "B",
      bgColor: "#D4AF37",
      textColor: "#1a1a2e",
    },
    logo: {
      type: "text",
      text: "Bevory",
      textColor: "currentColor",
    },
  },
};

// Legacy format for migration
interface LegacyBrandingSettings {
  favicon: BrandingItem;
  logo: BrandingItem;
}

export const useBranding = () => {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const { data, error } = await apiClient
          .from("app_settings")
          .select("*")
          .eq("key", "branding")
          .maybeSingle();

        if (!error && data?.value) {
          const value = data.value as unknown;
          
          // Check if it's the new format (has header/footer) or legacy format
          if (value && typeof value === 'object' && 'header' in value && 'footer' in value) {
            // New format
            const typedValue = value as BrandingSettings;
            setBranding({
              header: {
                favicon: { ...DEFAULT_BRANDING.header.favicon, ...typedValue.header?.favicon },
                logo: { ...DEFAULT_BRANDING.header.logo, ...typedValue.header?.logo },
              },
              footer: {
                favicon: { ...DEFAULT_BRANDING.footer.favicon, ...typedValue.footer?.favicon },
                logo: { ...DEFAULT_BRANDING.footer.logo, ...typedValue.footer?.logo },
              },
            });
          } else if (value && typeof value === 'object' && 'favicon' in value) {
            // Legacy format - apply same settings to both header and footer
            const legacyValue = value as LegacyBrandingSettings;
            const sharedFavicon = { ...DEFAULT_BRANDING.header.favicon, ...legacyValue.favicon };
            const sharedLogo = { ...DEFAULT_BRANDING.header.logo, ...legacyValue.logo };
            setBranding({
              header: { favicon: sharedFavicon, logo: sharedLogo },
              footer: { favicon: sharedFavicon, logo: sharedLogo },
            });
          }
        }
      } catch (error) {
        console.error("Error fetching branding:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  const updateBranding = async (newBranding: BrandingSettings) => {
    try {
      const jsonValue = JSON.parse(JSON.stringify(newBranding)) as Json;
      
      // Check if record exists
      const { data: existing } = await apiClient
        .from("app_settings")
        .select("id")
        .eq("key", "branding")
        .maybeSingle();

      if (existing) {
        const { error } = await apiClient
          .from("app_settings")
          .update({ value: jsonValue })
          .eq("key", "branding");
        if (error) throw error;
      } else {
        const { error } = await apiClient
          .from("app_settings")
          .insert([{ key: "branding", value: jsonValue, description: "Header and footer branding settings" }]);
        if (error) throw error;
      }

      setBranding(newBranding);
      return true;
    } catch (error) {
      console.error("Error updating branding:", error);
      return false;
    }
  };

  return { branding, loading, updateBranding, DEFAULT_BRANDING };
};
