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

// Wider responsive ladder — covers small thumbs to retina large screens
const SRCSET_WIDTHS = [200, 320, 480, 640, 800, 1200, 1600];

/** Convert any image URL through wsrv.nl with a chosen output format */
function toFormat(url: string, w: number, fmt: "webp" | "avif", h?: number): string {
  if (!url || !url.startsWith("http")) return url;
  if (url.includes("wsrv.nl")) return url;
  try {
    const p = new URLSearchParams({
      url,
      w: String(w),
      output: fmt,
      q: fmt === "avif" ? "60" : "80", // AVIF compresses much harder at same quality
      fit: "contain",
      bg: "ffffff",
    });
    if (h) p.set("h", String(h));
    return `https://wsrv.nl/?${p.toString()}`;
  } catch {
    return url;
  }
}

function buildSrcSet(url: string, fmt: "webp" | "avif"): string {
  if (!url || !url.startsWith("http")) return "";
  return SRCSET_WIDTHS.map((w) => `${toFormat(url, w, fmt)} ${w}w`).join(", ");
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

  const fallbackSrc = useMemo(() => (src ? toFormat(src, width, "webp", height) : null), [src, width, height]);
  const webpSrcSet = useMemo(() => (src ? buildSrcSet(src, "webp") : ""), [src]);
  const avifSrcSet = useMemo(() => (src ? buildSrcSet(src, "avif") : ""), [src]);
  const sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px";

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
        <picture>
          {avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />}
          {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}
          <img
            src={fallbackSrc || undefined}
            alt={alt}
            width={width}
            height={height || width}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            {...({ fetchpriority: priority ? "high" : "auto" } as any)}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={cn(
              "absolute inset-0 m-auto block max-w-full max-h-full transition-all duration-500",
              objectFit === "contain" && "object-contain p-3",
              objectFit === "cover" && "w-full h-full object-cover",
              !isLoaded && "opacity-0 scale-95",
              isLoaded && "opacity-100 scale-100"
            )}
            style={{ objectPosition: "center center" }}
          />
        </picture>
      )}
    </div>
  );
});

ProductImage.displayName = "ProductImage";

export default ProductImage;
