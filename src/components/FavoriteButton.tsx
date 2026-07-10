import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteButtonProps {
  productId?: string;
  cocktailId?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "overlay";
  className?: string;
}

const FavoriteButton = ({
  productId,
  cocktailId,
  size = "md",
  variant = "default",
  className,
}: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isActive = isFavorite(productId, cocktailId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(productId, cocktailId);
  };

  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className={cn(
        sizeClasses[size],
        variant === "overlay" &&
          "bg-background/80 backdrop-blur-sm hover:bg-background/90",
        className
      )}
      onClick={handleClick}
    >
      <Heart
        className={cn(
          iconSizes[size],
          isActive ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )}
      />
    </Button>
  );
};

export default FavoriteButton;