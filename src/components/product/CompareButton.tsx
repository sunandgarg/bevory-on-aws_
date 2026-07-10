import { ArrowLeftRight } from "lucide-react";
import { useCompare } from "@/components/home/CompareProducts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CompareButtonProps {
  productId: string;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "tag" | "button";
  className?: string;
}

const CompareButton = ({ 
  productId, 
  size = "sm", 
  variant = "tag",
  className 
}: CompareButtonProps) => {
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { toast } = useToast();
  const inCompare = isInCompare(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inCompare) {
      removeFromCompare(productId);
      toast({
        title: "Removed from compare",
        description: "Product removed from compare list"
      });
    } else {
      await addToCompare(productId);
      toast({
        title: "Added to compare",
        description: "Product added to compare list"
      });
    }
  };

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-3 py-1",
    lg: "text-sm px-4 py-1.5"
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "rounded-full flex items-center justify-center transition-colors",
          size === "sm" && "w-7 h-7",
          size === "md" && "w-8 h-8",
          size === "lg" && "w-10 h-10",
          inCompare 
            ? "bg-accent text-accent-foreground" 
            : "bg-card/90 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          className
        )}
        title={inCompare ? "Remove from compare" : "Add to compare"}
      >
        <ArrowLeftRight className={cn(
          size === "sm" && "w-3.5 h-3.5",
          size === "md" && "w-4 h-4",
          size === "lg" && "w-5 h-5"
        )} />
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 rounded-lg font-medium transition-colors",
          sizeClasses[size],
          inCompare 
            ? "bg-accent text-accent-foreground" 
            : "bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground",
          className
        )}
      >
        <ArrowLeftRight className="w-3 h-3" />
        {inCompare ? "In Compare" : "Compare"}
      </button>
    );
  }

  // Tag variant (default)
  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1 rounded-full font-medium transition-all",
        sizeClasses[size],
        inCompare 
          ? "bg-accent text-accent-foreground" 
          : "bg-black/60 text-white hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      <ArrowLeftRight className="w-3 h-3" />
      {inCompare ? "✓" : "+"}
    </button>
  );
};

export default CompareButton;
