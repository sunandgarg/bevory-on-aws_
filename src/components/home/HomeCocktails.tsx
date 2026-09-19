import { useState, useCallback, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, ChevronLeft, ChevronRight, Utensils } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/integrations/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface Cocktail {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_emoji: string | null;
  image_url: string | null;
  base_spirit: string | null;
  prep_time: string | null;
  difficulty: string | null;
  is_featured: boolean | null;
}

const HomeCocktails = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: cocktails = [], isLoading } = useQuery({
    queryKey: ["home-cocktails"],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("cocktails")
        .select("id, name, slug, description, image_emoji, image_url, base_spirit, prep_time, difficulty, is_featured")
        .or("is_featured.eq.true,is_popular.eq.true")
        .order("is_featured", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as Cocktail[];
    },
  });

  const scrollPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + cocktails.length) % cocktails.length);
  }, [cocktails.length]);

  const scrollNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % cocktails.length);
  }, [cocktails.length]);

  if (isLoading) {
    return (
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-36 h-44 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (cocktails.length === 0) return null;

  return (
    <div className="px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-accent" />
          <h2 className="font-semibold">Cocktail Recipes</h2>
        </div>
        <Link to="/cocktails" className="text-sm text-accent">
          See all
        </Link>
      </div>

      {/* Mobile-optimized horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
        {cocktails.map((cocktail, index) => (
          <Link 
            key={cocktail.id} 
            to={`/cocktail/${cocktail.slug || cocktail.id}`}
            className="flex-shrink-0 snap-start"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="w-36 bg-card rounded-xl border border-border overflow-hidden hover:border-accent/50 transition-colors"
            >
              {/* Image */}
              <div className="h-24 bg-muted/50 flex items-center justify-center relative">
                {cocktail.image_url ? (
                  <OptimizedImage
                    src={cocktail.image_url}
                    alt={cocktail.name}
                    width={144}
                    height={96}
                    className="w-full h-full"
                    objectFit="cover"
                    placeholder="blur"
                  />
                ) : (
                  <span className="text-4xl">{cocktail.image_emoji || "🍸"}</span>
                )}
                {cocktail.is_featured && (
                  <span className="absolute top-1 left-1 text-sm">⭐</span>
                )}
              </div>

              {/* Content */}
              <div className="p-2">
                <p className="font-medium text-sm line-clamp-1">{cocktail.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {cocktail.base_spirit || "Classic"}
                  </span>
                  <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {cocktail.prep_time || "5m"}
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default memo(HomeCocktails);
