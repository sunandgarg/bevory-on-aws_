import { memo, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/integrations/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  description: string | null;
  image_url: string | null;
  is_trending: boolean | null;
  order_index: number | null;
}

const GRADIENT_MAP: Record<string, string> = {
  whisky: "from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-950/20",
  wine: "from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-950/20",
  gin: "from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-950/20",
  rum: "from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-950/20",
  vodka: "from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-sky-950/20",
  beer: "from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-950/20",
  tequila: "from-lime-100 to-lime-50 dark:from-lime-900/30 dark:to-lime-950/20",
  brandy: "from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-950/20",
};

const getGradient = (slug: string) => {
  return GRADIENT_MAP[slug.toLowerCase()] || "from-gray-100 to-gray-50 dark:from-gray-900/30 dark:to-gray-950/20";
};

const CategoriesSection = memo(() => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("categories")
        .select("id, name, slug, emoji, description, image_url, is_trending, order_index")
        .order("order_index")
        .order("name");
      
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Skeleton className="h-4 w-32 mx-auto mb-4" />
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 w-40 flex-shrink-0 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider mb-4 block">
            Browse Collection
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Explore by Category
          </h2>
          <p className="text-muted-foreground">
            Dive into our curated collection of spirits, wines, and beers from around the world.
          </p>
        </div>

        {/* Categories Carousel */}
        <div className="relative group">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm -ml-4 hidden md:flex"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm -mr-4 hidden md:flex"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Scrollable Container */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="flex-shrink-0"
              >
                <Link
                  to={`/category/${category.slug}`}
                  className={`group/card block cursor-pointer rounded-2xl bg-gradient-to-b ${getGradient(category.slug)} p-6 text-center transition-all hover-lift border border-transparent hover:border-accent/20 w-40 h-48`}
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-xl overflow-hidden group-hover/card:scale-110 transition-transform duration-300 flex items-center justify-center bg-background/50">
                    {category.image_url ? (
                      <img
                        src={`https://wsrv.nl/?url=${encodeURIComponent(category.image_url)}&w=128&output=webp&q=80`}
                        alt={category.name}
                        loading="lazy" decoding="async" width={64} height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">{category.emoji || "🍸"}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 text-sm">{category.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {category.description || "Explore collection"}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs font-medium text-accent opacity-0 group-hover/card:opacity-100 transition-opacity">
                    Explore
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

CategoriesSection.displayName = "CategoriesSection";

export default CategoriesSection;