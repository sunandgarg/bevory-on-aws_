/**
 * Image Processing Engine for Product Images
 * 
 * Features:
 * - Auto-crop and center images
 * - Background removal integration
 * - Consistent sizing and alignment
 * - WebP conversion for performance
 */

import { supabase } from "@/integrations/supabase/client";

// Maximum dimensions for processed images
const MAX_DIMENSION = 800;
const TARGET_SIZE = 600;

/**
 * Process image URL to ensure optimal display
 * Uses wsrv.nl for image transformations
 */
export function getOptimizedProductImageUrl(
  imageUrl: string | null,
  options: {
    width?: number;
    height?: number;
    fit?: "contain" | "cover" | "inside";
    background?: string;
  } = {}
): string | null {
  if (!imageUrl) return null;

  const { 
    width = TARGET_SIZE, 
    height = TARGET_SIZE, 
    fit = "contain",
    background = "ffffff" // White background by default
  } = options;

  // Local migrated assets and uploads are already optimized and served by this app.
  if (imageUrl.startsWith("/")) return imageUrl;

  // For external URLs, use wsrv.nl proxy
  try {
    const params = new URLSearchParams({
      url: imageUrl,
      w: width.toString(),
      h: height.toString(),
      fit: fit,
      bg: background,
      output: "webp",
      q: "85",
    });
    return `https://wsrv.nl/?${params.toString()}`;
  } catch {
    return imageUrl;
  }
}

/**
 * Generate srcset for responsive images
 */
export function generateProductImageSrcset(imageUrl: string | null): string | null {
  if (!imageUrl) return null;

  const sizes = [200, 400, 600, 800];
  const srcset = sizes.map(size => {
    const optimizedUrl = getOptimizedProductImageUrl(imageUrl, { width: size, height: size });
    return `${optimizedUrl} ${size}w`;
  }).join(", ");

  return srcset;
}

/**
 * Upload and process a product image
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Validate file
    if (!file.type.startsWith("image/")) {
      return { url: null, error: "File must be an image" };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { url: null, error: "Image must be less than 5MB" };
    }

    // Create a unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `products/${productId}/${Date.now()}.${ext}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from("images")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      return { url: null, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("images")
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (err) {
    console.error("Error uploading image:", err);
    return { url: null, error: "Failed to upload image" };
  }
}

/**
 * Create a canvas-based image processor for client-side optimization
 */
export async function processImageForDisplay(
  imageUrl: string
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      // Calculate dimensions to maintain aspect ratio
      const aspectRatio = img.width / img.height;
      let targetWidth = TARGET_SIZE;
      let targetHeight = TARGET_SIZE;

      if (aspectRatio > 1) {
        // Landscape
        targetHeight = TARGET_SIZE / aspectRatio;
      } else {
        // Portrait
        targetWidth = TARGET_SIZE * aspectRatio;
      }

      // Set canvas size
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;

      // Fill with white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

      // Center the image
      const x = (TARGET_SIZE - targetWidth) / 2;
      const y = (TARGET_SIZE - targetHeight) / 2;

      // Draw image centered
      ctx.drawImage(img, x, y, targetWidth, targetHeight);

      // Convert to data URL
      resolve(canvas.toDataURL("image/webp", 0.85));
    };

    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}
