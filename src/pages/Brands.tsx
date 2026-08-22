import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, ArrowLeft, Globe } from "lucide-react";
import { apiClient } from "@/integrations/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import MobileLayout from "@/components/layout/MobileLayout";
import SEOHead from "@/components/SEOHead";

interface Brand {
  id: string;
  brand_name: string;
  slug: string | null;
  logo_emoji: string | null;
  logo_url: string | null;
  description: string | null;
  country: string | null;
  show_in_spotlight: boolean | null;
  is_active: boolean | null;
}

const Brands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchBrands = async () => {
      const { data, error } = await apiClient
        .from("brand_spotlights")
        .select("id, brand_name, slug, logo_emoji, logo_url, description, country, show_in_spotlight, is_active")
        .eq("is_active", true)
        .order("brand_name");

      if (!error && data) {
        setBrands(data);
      }
      setLoading(false);
    };
    fetchBrands();
  }, []);

  const filteredBrands = brands.filter((brand) =>
    brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate spotlight and non-spotlight brands
  const spotlightBrands = filteredBrands.filter((b) => b.show_in_spotlight);
  const otherBrands = filteredBrands.filter((b) => !b.show_in_spotlight);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "All Brands | BevOry",
    description: "Explore our curated collection of premium liquor brands. Find whisky, vodka, rum, gin, and more from top brands worldwide.",
    url: typeof window !== "undefined" ? window.location.href : "",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: brands.map((brand, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Brand",
          name: brand.brand_name,
          description: brand.description || `Explore ${brand.brand_name} products`,
        },
      })),
    },
  };

  return (
    <MobileLayout showSearch={false} showCheersGuide={false} showHeader={false}>
      <SEOHead
        title="All Brands | BevOry - Premium Liquor Brands Directory"
        description="Discover and explore our comprehensive directory of premium liquor brands. From iconic whisky to craft spirits, find your favorite brands."
        canonical="/brands"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <Link to="/" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">All Brands</h1>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 pb-24">
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="w-full aspect-square rounded-2xl" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Featured/Spotlight Brands */}
              {spotlightBrands.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">⭐</span>
                    <h2 className="text-base font-semibold">Featured Brands</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {spotlightBrands.map((brand, index) => (
                      <BrandCard key={brand.id} brand={brand} index={index} featured />
                    ))}
                  </div>
                </section>
              )}

              {/* All Other Brands */}
              {otherBrands.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-base font-semibold">All Brands</h2>
                    <span className="text-xs text-muted-foreground">({otherBrands.length})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {otherBrands.map((brand, index) => (
                      <BrandCard key={brand.id} brand={brand} index={index} />
                    ))}
                  </div>
                </section>
              )}

              {filteredBrands.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-5xl mb-4">🔍</span>
                  <h3 className="font-medium text-lg mb-1">No brands found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search query
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </MobileLayout>
  );
};

interface BrandCardProps {
  brand: Brand;
  index: number;
  featured?: boolean;
}

const BrandCard = ({ brand, index, featured }: BrandCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.03 }}
  >
    <Link
      to={`/brand/${brand.slug || brand.id}`}
      className="flex flex-col items-center group"
    >
      <div
        className={`w-full aspect-square rounded-2xl flex items-center justify-center mb-2 overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${
          featured
            ? "bg-gradient-to-br from-primary/10 to-accent/10 ring-1 ring-primary/20"
            : "bg-secondary"
        }`}
      >
        {brand.logo_url ? (
          <img
            src={brand.logo_url}
            alt={brand.brand_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-4xl">{brand.logo_emoji || "🏷️"}</span>
        )}
      </div>
      <p className="text-xs font-medium text-center line-clamp-2 group-hover:text-primary transition-colors">
        {brand.brand_name}
      </p>
      {brand.country && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{brand.country}</p>
      )}
    </Link>
  </motion.div>
);

export default Brands;
