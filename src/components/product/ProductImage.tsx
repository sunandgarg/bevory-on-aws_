import { useState, useRef, useEffect, memo, useMemo } from "react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string | null;
  alt: string;
  fallbackEmoji?: string | null;
  className?: string;
  priority?: boolean;
  objectFit?: "contain" | "cover";
  width?: number;
  height?: number;
}

const SRCSET_WIDTHS = [200, 400, 600, 800];

/** Convert any image URL to WebP via wsrv.nl */
function toWebP(url: string, w: number, h?: number): string {
  if (!url || !url.startsWith("http")) return url;
  if (url.includes("wsrv.nl")) return url;
  try {
    const p = new URLSearchParams({ url, w: String(w), output: "webp", q: "80", fit: "contain", bg: "ffffff" });
    if (h) p.set("h", String(h));
    return `https://wsrv.nl/?${p.toString()}`;
  } catch {
    return url;
  }
}

function buildSrcSet(url: string): string {
  if (!url || !url.startsWith("http")) return "";
  return SRCSET_WIDTHS.map(w => `${toWebP(url, w)} ${w}w`).join(", ");
}

const ProductImage = memo(({
  src,
  alt,
  fallbackEmoji = "🍾",
  className,
  priority = false,
  objectFit = "contain",
  width = 400,
  height,
}: ProductImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0.01 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const optimizedSrc = useMemo(() => src ? toWebP(src, width, height) : null, [src, width, height]);
  const srcSet = useMemo(() => src ? buildSrcSet(src) : "", [src]);

  if (!src || hasError) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-secondary/80 to-secondary/40 rounded-xl",
          className
        )}
      >
        <span className="text-5xl">{fallbackEmoji}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-xl",
        className
      )}
    >
      {!isLoaded && isInView && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/50 to-muted/30" />
      )}
      {isInView && (
        <img
          src={optimizedSrc || undefined}
          srcSet={srcSet || undefined}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          alt={alt}
          width={width}
          height={height || width}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            "w-full h-full transition-all duration-500",
            objectFit === "contain" && "object-contain p-2",
            objectFit === "cover" && "object-cover",
            !isLoaded && "opacity-0 scale-95",
            isLoaded && "opacity-100 scale-100"
          )}
          style={{ objectPosition: "center center" }}
        />
      )}
    </div>
  );
});

ProductImage.displayName = "ProductImage";

export default ProductImage;
