import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandingDisplayProps {
  variant?: "header" | "footer" | "auth" | "loading";
  className?: string;
}

const sizeMap: Record<NonNullable<BrandingDisplayProps["variant"]>, {
  mark: string;
  word: string;
  animation?: string;
}> = {
  header: { mark: "h-7 w-7", word: "text-xl" },
  footer: { mark: "h-5 w-5", word: "text-sm" },
  auth: { mark: "h-11 w-11", word: "text-3xl" },
  loading: { mark: "h-14 w-14", word: "text-4xl", animation: "animate-pulse-glow" },
};

const BrandingDisplay = ({ variant = "header", className = "" }: BrandingDisplayProps) => {
  const size = sizeMap[variant];

  return (
    <Link
      to="/"
      aria-label="Bevory home"
      className={cn("inline-flex items-center gap-2 text-foreground", size.animation, className)}
    >
      <span
        aria-hidden="true"
        className={`${size.mark} shrink-0 bg-current`}
        style={{
          WebkitMask: "url('/favicon.png?v=5') center / contain no-repeat",
          mask: "url('/favicon.png?v=5') center / contain no-repeat",
        }}
      />
      <span className={`${size.word} font-bold leading-none`} style={{ fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
        Bevory
      </span>
    </Link>
  );
};

export default BrandingDisplay;
