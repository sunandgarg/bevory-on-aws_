import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useQuery } from "@tanstack/react-query";

interface BrandSpotlightItem {
  id: string;
  brand_name: string;
  slug: string | null;
  logo_emoji: string | null;
  logo_url: string | null;
  description: string | null;
  featured_product_id: string | null;
  link_url: string | null;
  is_active: boolean;
  show_in_spotlight: boolean | null;
}

const fetchBrands = async (): Promise<BrandSpotlightItem[]> => {
  const { data, error } = await supabase
    .from("brand_spotlights")
    .select("id, brand_name, slug, logo_emoji, logo_url, description, featured_product_id, link_url, is_active, show_in_spotlight")
    .eq("is_active", true)
    .eq("show_in_spotlight", true)
    .order("order_index");
  if (error) throw error;
  return data || [];
};

const PLACEHOLDER_BRANDS = [
  { id: "1", name: "Johnnie Walker", emoji: "🥃" },
  { id: "2", name: "Jack Daniel's", emoji: "🥃" },
  { id: "3", name: "Glenfiddich", emoji: "🥃" },
  { id: "4", name: "Chivas Regal", emoji: "🥃" },
  { id: "5", name: "Absolut", emoji: "🍸" },
  { id: "6", name: "Bacardi", emoji: "🍹" },
  { id: "7", name: "Tanqueray", emoji: "🍸" },
  { id: "8", name: "Hennessy", emoji: "🥃" },
];

const BrandSpotlight = memo(() => {
  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["brand-spotlights"],
    queryFn: fetchBrands,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="px-4">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="flex gap-2.5 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="w-[68px] h-[68px] rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4" aria-label="Featured Brand Spotlight">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Brands</h2>
        <Link
          to="/brands"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {brands.length > 0 ? (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          {brands.map((brand) => (
            <Link key={brand.id} to={`/brand/${brand.slug || brand.id}`} className="group block w-[68px] flex-shrink-0">
              <div className="w-[68px] h-[68px] rounded-2xl bg-secondary flex items-center justify-center text-2xl overflow-hidden group-hover:ring-2 group-hover:ring-accent/30 transition-all duration-150">
                {brand.logo_url ? (
                  <OptimizedImage
                    src={brand.logo_url}
                    alt={brand.brand_name}
                    width={68}
                    height={68}
                    className="w-full h-full"
                    objectFit="cover"
                    placeholder="blur"
                  />
                ) : (
                  <span>{brand.logo_emoji || "🏷️"}</span>
                )}
              </div>
              <p className="text-[10px] font-medium text-center text-muted-foreground group-hover:text-foreground truncate mt-1.5 transition-colors">
                {brand.brand_name}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2.5">
          {PLACEHOLDER_BRANDS.map((brand) => (
            <Link key={brand.id} to={`/search?q=${encodeURIComponent(brand.name)}`} className="group block">
              <div className="aspect-square rounded-xl bg-secondary flex items-center justify-center text-2xl group-hover:ring-2 group-hover:ring-accent/30 transition-all duration-150">
                {brand.emoji}
              </div>
              <p className="text-[10px] font-medium text-center text-muted-foreground group-hover:text-foreground truncate mt-1.5 transition-colors">
                {brand.name}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
});

BrandSpotlight.displayName = "BrandSpotlight";
export default BrandSpotlight;
