import { useState, useEffect, useRef, memo } from "react";
import { cn } from "@/lib/utils";
import { useImageOptimization } from "@/hooks/useImageOptimization";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean; // Load immediately without lazy loading
  placeholder?: "blur" | "empty";
  onLoadComplete?: () => void;
  aspectRatio?: string; // e.g., "16/9", "1/1", "4/3"
  objectFit?: "cover" | "contain" | "fill" | "none";
  sizes?: string; // Responsive sizes attribute
}

const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  priority = false,
  placeholder = "empty",
  onLoadComplete,
  aspectRatio,
  objectFit = "cover",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { optimizeUrl, getSrcSet, settings } = useImageOptimization();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadComplete?.();
  };

  const handleError = () => {
    setError(true);
    // Fallback to original source if optimization fails
    if (imgRef.current && settings.enabled) {
      imgRef.current.src = src;
    }
  };

  // Get optimized URL and srcset
  const optimizedSrc = isInView ? optimizeUrl(src, width, height) : undefined;
  const srcSet = isInView && settings.enabled ? getSrcSet(src) : undefined;

  // Determine aspect ratio style
  const aspectStyle = aspectRatio ? { aspectRatio } : undefined;

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-muted/30",
        !isLoaded && placeholder === "blur" && "animate-pulse",
        className
      )}
      style={aspectStyle}
    >
      {/* Low quality placeholder */}
      {!isLoaded && placeholder === "blur" && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/30" />
      )}
      
      <img
        ref={imgRef}
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        {...({ fetchpriority: priority ? "high" : "auto" } as any)}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          objectFit === "cover" && "object-cover w-full h-full",
          objectFit === "contain" && "object-contain w-full h-full",
          objectFit === "fill" && "object-fill w-full h-full",
          objectFit === "none" && "object-none",
          !isLoaded && "opacity-0",
          isLoaded && "opacity-100",
          error && "hidden"
        )}
        {...props}
      />

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <span className="text-4xl">🖼️</span>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
