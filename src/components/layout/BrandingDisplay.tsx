import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

interface BrandingDisplayProps {
  variant?: "header" | "footer" | "auth" | "loading";
  className?: string;
}

const sizeMap = {
  header: "h-8",
  footer: "h-5",
  auth: "h-12",
  loading: "h-16 animate-pulse-glow",
};

/**
 * Hardcoded BevOry logo display - NO database override
 * Uses only src/assets/logo.png
 */
const BrandingDisplay = ({ variant = "header", className = "" }: BrandingDisplayProps) => {
  const heightClass = sizeMap[variant];

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <img
        src={logo}
        alt="BevOry — Know Before You Drink"
        className={`${heightClass} w-auto object-contain`}
        data-no-dim
        loading={variant === "header" ? "eager" : "lazy"}
        decoding="async"
      />
    </Link>
  );
};

export default BrandingDisplay;
