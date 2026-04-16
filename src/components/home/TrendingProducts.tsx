import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Star, TrendingUp, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { useLocation } from "@/hooks/useLocation";
import { useProductUrl } from "@/hooks/useProductUrl";
import FavoriteButton from "@/components/FavoriteButton";
import CompareButton from "@/components/product/CompareButton";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface TrendingProductsProps {
  defaultCategory?: string;
}

const CATEGORY_TABS = ["whisky", "wine", "beer", "vodka", "gin", "rum"] as const;

const TrendingProducts = memo(({ defaultCategory = "whisky" }: TrendingProductsProps) => {
  const [selectedTab, setSelectedTab] = useState(defaultCategory);
  const { products, loading } = useProducts();
  const { selectedCity } = useLocation();
  const { getProductUrlSafe } = useProductUrl();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "trending_default_category")
        .maybeSingle();
      if (data?.value) {
        const defaultCat = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        setSelectedTab(defaultCat);
      }
    };
    fetchSettings();
  }, []);

  // Pre-index products by category slug for O(1) tab switching
  const productsByTab = useMemo(() => {
    const map = new Map<string, typeof products>();
    for (const tab of CATEGORY_TABS) {
      map.set(tab, []);
    }
    for (const p of products) {
      const slug = p.category?.slug?.toLowerCase();
      if (!slug) continue;
      for (const tab of CATEGORY_TABS) {
        if (slug.includes(tab)) {
          map.get(tab)!.push(p);
          break;
        }
      }
    }
    return map;
  }, [products]);

  const filteredProducts = useMemo(
    () => (productsByTab.get(selectedTab) ?? []).slice(0, 8),
    [productsByTab, selectedTab]
  );

  const handleTabClick = useCallback((tab: string) => setSelectedTab(tab), []);

  if (loading) {
    return (
      <div className="px-4 space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-16 rounded-full" />)}
        </div>
        <div className="flex gap-3 overflow-x-auto">
          {[1, 2, 3].map(i => <Skeleton key={i} className="w-36 h-52 rounded-xl flex-shrink-0" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h2 className="text-base font-semibold">Trending</h2>
        </div>
        <Link to="/search" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all duration-150 ${
              selectedTab === tab
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 w-full">
            <p className="text-sm text-muted-foreground">No {selectedTab} products found</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="w-36 flex-shrink-0">
              <Link to={getProductUrlSafe(product)}>
                <div className="bg-card rounded-xl border border-border overflow-hidden group hover:border-border/80 transition-colors">
                  <div className="relative h-28 bg-muted/30 flex items-center justify-center">
                    {product.image_url ? (
                      <OptimizedImage
                        src={product.image_url}
                        alt={product.name}
                        width={144}
                        height={112}
                        className="w-full h-full"
                        objectFit="cover"
                        placeholder="blur"
                      />
                    ) : (
                      <span className="text-4xl group-hover:scale-105 transition-transform duration-200">
                        {product.image_emoji || "🥃"}
                      </span>
                    )}
                    {product.type_tag && (
                      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-foreground/70 text-background text-[9px] font-medium">
                        {product.type_tag}
                      </div>
                    )}
                    <div className="absolute top-1.5 left-1.5">
                      <CompareButton productId={product.id} size="sm" variant="icon" />
                    </div>
                    <div className="absolute top-1.5 right-1.5">
                      <FavoriteButton productId={product.id} size="sm" variant="overlay" />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] text-muted-foreground truncate">{product.brand}</p>
                    <p className="font-medium text-xs truncate mt-0.5">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{product.volume}</p>
                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/50">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-accent text-accent" />
                        <span className="text-[10px] font-medium">{product.rating || "—"}</span>
                      </div>
                      <p className="font-semibold text-xs">
                        {product.price ? `₹${Number(product.price).toLocaleString()}` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      {selectedCity && (
        <p className="text-[10px] text-muted-foreground mt-2">
          📍 Prices in {selectedCity.name}
        </p>
      )}
    </div>
  );
});

TrendingProducts.displayName = "TrendingProducts";
export default TrendingProducts;
