import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Star, ArrowRight, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useProducts } from "@/hooks/useProducts";
import { useLocation } from "@/hooks/useLocation";
import { Skeleton } from "@/components/ui/skeleton";

const TrendingSection = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const { products, loading } = useProducts();
  const { selectedCity } = useLocation();

  // Get trending products
  const trendingProducts = useMemo(() => 
    products.filter((p: any) => p.is_trending).slice(0, 12),
    [products]
  );

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  // Auto-scroll every 7 seconds
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [api]);

  if (loading) {
    return (
      <section id="trending" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <Skeleton className="h-5 w-32 mb-3" />
              <Skeleton className="h-10 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (trendingProducts.length === 0) {
    return null;
  }

  return (
    <section id="trending" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold text-accent uppercase tracking-wider">
                The Pour Lineup
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Trending This Week
            </h2>
            {selectedCity && (
              <p className="text-sm text-muted-foreground mt-1">
                Prices in {selectedCity.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Navigation Arrows */}
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              className="rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="gap-2 hidden sm:flex">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Drinks Carousel */}
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {trendingProducts.map((drink, index) => (
              <CarouselItem
                key={drink.id}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="group bg-card rounded-2xl p-5 border border-border hover:border-accent/30 transition-all cursor-pointer hover-lift h-full"
                >
                  {/* Image Area */}
                  <div className="relative h-40 mb-4 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden">
                    <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
                      {drink.image_emoji || "🥃"}
                    </span>
                    {/* Origin Flag */}
                    {(drink as any).origin_flag && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-card/90 backdrop-blur-sm text-xs flex items-center gap-1">
                        <span>{(drink as any).origin_flag}</span>
                        <span className="text-muted-foreground">{(drink as any).origin}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{drink.brand}</p>
                      <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                        {drink.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-xs text-muted-foreground">
                        {drink.category?.name || "Spirit"}
                      </span>
                      <span className="text-xs text-muted-foreground">{drink.volume}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="font-semibold text-sm">{drink.rating}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          {drink.price ? `₹${Number(drink.price).toLocaleString()}` : "Price N/A"}
                        </p>
                        {(drink as any).mrp && Number((drink as any).mrp) > Number(drink.price) && (
                          <p className="text-xs text-muted-foreground line-through">
                            ₹{Number((drink as any).mrp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(trendingProducts.length / 3) }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index * 3)}
              className={`w-2 h-2 rounded-full transition-all ${
                Math.floor(current / 3) === index
                  ? "bg-accent w-6"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingSection;
