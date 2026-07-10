import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface ImageOptimizationSettings {
  enabled: boolean;
  quality: number; // 1-100
  maxWidth: number;
  maxHeight: number;
  format: 'webp' | 'avif' | 'auto';
}

const DEFAULT_SETTINGS: ImageOptimizationSettings = {
  enabled: true,
  quality: 80,
  maxWidth: 1920,
  maxHeight: 1080,
  format: 'webp'
};

// Image optimization service URLs (free CDN-based converters)
const getOptimizedImageUrl = (
  src: string, 
  settings: ImageOptimizationSettings,
  width?: number,
  height?: number
): string => {
  if (!settings.enabled || !src) return src;
  
  // Skip if already a data URL or blob
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;
  
  // Skip if already optimized (has query params for optimization)
  if (src.includes('?format=') || src.includes('&format=')) return src;
  
  // Skip emoji or non-URL sources
  if (!src.startsWith('http')) return src;

  try {
    const url = new URL(src);
    
    // For Supabase storage URLs, add transformation parameters
    if (url.hostname.includes('supabase')) {
      const params = new URLSearchParams();
      if (width) params.set('width', String(Math.min(width, settings.maxWidth)));
      if (height) params.set('height', String(Math.min(height, settings.maxHeight)));
      params.set('quality', String(settings.quality));
      if (settings.format !== 'auto') {
        params.set('format', settings.format);
      }
      return `${src}${src.includes('?') ? '&' : '?'}${params.toString()}`;
    }

    // For external URLs, use wsrv.nl (free image CDN)
    // This converts and optimizes images on the fly
    const optimizedWidth = width ? Math.min(width, settings.maxWidth) : settings.maxWidth;
    const optimizedHeight = height ? Math.min(height, settings.maxHeight) : undefined;
    
    const wsrvParams = new URLSearchParams({
      url: src,
      w: String(optimizedWidth),
      q: String(settings.quality),
      output: settings.format === 'auto' ? 'webp' : settings.format,
    });
    
    if (optimizedHeight) {
      wsrvParams.set('h', String(optimizedHeight));
    }
    
    return `https://wsrv.nl/?${wsrvParams.toString()}`;
  } catch {
    return src;
  }
};

// Generate srcset for responsive images
const generateSrcSet = (
  src: string,
  settings: ImageOptimizationSettings,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920]
): string => {
  if (!settings.enabled || !src || !src.startsWith('http')) return '';
  
  try {
    return sizes
      .filter(size => size <= settings.maxWidth)
      .map(size => `${getOptimizedImageUrl(src, settings, size)} ${size}w`)
      .join(', ');
  } catch {
    return '';
  }
};

export const useImageOptimization = () => {
  const [settings, setSettings] = useState<ImageOptimizationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "image_optimization")
        .maybeSingle();

      if (!error && data?.value) {
        const value = data.value as unknown as ImageOptimizationSettings;
        setSettings({ ...DEFAULT_SETTINGS, ...value });
      }
    } catch (error) {
      console.error("Error fetching image optimization settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: ImageOptimizationSettings) => {
    try {
      const jsonValue = JSON.parse(JSON.stringify(newSettings)) as Json;
      
      const { data: existing } = await supabase
        .from("app_settings")
        .select("id")
        .eq("key", "image_optimization")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("app_settings")
          .update({ value: jsonValue })
          .eq("key", "image_optimization");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("app_settings")
          .insert([{ 
            key: "image_optimization", 
            value: jsonValue, 
            description: "Image optimization and WebP conversion settings" 
          }]);
        if (error) throw error;
      }

      setSettings(newSettings);
      return true;
    } catch (error) {
      console.error("Error updating image optimization settings:", error);
      return false;
    }
  };

  const optimizeUrl = useCallback((src: string, width?: number, height?: number) => {
    return getOptimizedImageUrl(src, settings, width, height);
  }, [settings]);

  const getSrcSet = useCallback((src: string, sizes?: number[]) => {
    return generateSrcSet(src, settings, sizes);
  }, [settings]);

  return { 
    settings, 
    loading, 
    updateSettings, 
    optimizeUrl, 
    getSrcSet,
    DEFAULT_SETTINGS 
  };
};
