import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { useProducts } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import { useLocation } from "@/hooks/useLocation";
import { citySlugFromName } from "@/lib/locations";

const categoryGradients: Record<string, string> = {
  whisky: "from-amber-500/20 to-amber-500/5",
  whiskey: "from-amber-500/20 to-amber-500/5",
  wine: "from-rose-500/20 to-rose-500/5",
  gin: "from-emerald-500/20 to-emerald-500/5",
  rum: "from-orange-500/20 to-orange-500/5",
  vodka: "from-sky-500/20 to-sky-500/5",
  beer: "from-yellow-500/20 to-yellow-500/5",
  brandy: "from-purple-500/20 to-purple-500/5",
  tequila: "from-lime-500/20 to-lime-500/5",
};

const Categories = () => {
  const { categories, products, loading } = useProducts();
  const { selectedCity } = useLocation();
  const citySlug = citySlugFromName(selectedCity?.name) || "gurgaon";

  const getCategoryProductCount = (categoryId: string) => {
    return products.filter((p) => p.category_id === categoryId).length;
  };

  const trendingCategories = categories.filter(c => (c as any).is_trending);
  const otherCategories = categories.filter(c => !(c as any).is_trending);

  // Generate structured data for SEO
  const generateStructuredData = () => ({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Beverage Categories",
    "description": "Browse our complete collection of spirits, wines, beers, and more. Find whisky, vodka, rum, gin, tequila, and other beverages.",
    "url": window.location.href,
    "numberOfItems": categories.length,
    "itemListElement": categories.map((c, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": c.name,
      "url": `${window.location.origin}/${citySlug}/category/${c.slug}`,
    })),
  });

  if (loading) {
    return (
      <MobileLayout title="Categories">
        <div className="p-4 space-y-4">
          <div className="h-12 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <>
      <SEOHead
        title="Browse All Categories - Whisky, Vodka, Rum, Gin & More | Bevory"
        description="Explore our complete collection of spirits and beverages. Browse whisky, vodka, rum, gin, tequila, wine, beer, and brandy categories with prices and reviews."
        keywords="whisky, vodka, rum, gin, tequila, wine, beer, brandy, spirits, beverages, liquor"
        jsonLd={generateStructuredData()}
      />
      <MobileLayout title="Categories">
        <div className="pb-6">
          {/* Hero Header */}
          <header className="px-4 pt-4 pb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-3">
                <Sparkles className="w-4 h-4" />
                <span>Curated Collections</span>
              </div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                Explore Categories
              </h1>
              <p className="text-muted-foreground">
                Browse our premium collection by type
              </p>
            </motion.div>
          </header>

          <main className="px-4 space-y-6">
            {/* Trending Categories */}
            {trendingCategories.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <h2 className="font-serif font-semibold text-lg">Trending Now</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {trendingCategories.map((category, index) => (
                    <CategoryCard 
                      key={category.id} 
                      category={category} 
                      index={index}
                      productCount={getCategoryProductCount(category.id)}
                      isTrending
                      citySlug={citySlug}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* All Categories */}
            <section>
              {trendingCategories.length > 0 && (
                <h2 className="font-serif font-semibold text-lg mb-4">All Categories</h2>
              )}
              <div className="grid grid-cols-2 gap-3">
                {otherCategories.map((category, index) => (
                  <CategoryCard 
                    key={category.id} 
                    category={category} 
                    index={index}
                    productCount={getCategoryProductCount(category.id)}
                    citySlug={citySlug}
                  />
                ))}
              </div>
            </section>
          </main>
        </div>
      </MobileLayout>
    </>
  );
};

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    slug: string;
    emoji: string | null;
    description?: string | null;
    is_trending?: boolean | null;
  };
  index: number;
  productCount: number;
  isTrending?: boolean;
  citySlug: string;
}

const CategoryCard = ({ category, index, productCount, isTrending, citySlug }: CategoryCardProps) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <Link to={`/${citySlug}/category/${category.slug}`}>
      <div
        className={`aspect-square rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden group transition-all hover:scale-[1.02] hover:shadow-xl
          bg-gradient-to-br ${categoryGradients[category.slug.toLowerCase()] || "from-secondary to-secondary/50"}
          border ${isTrending ? "border-accent/30" : "border-border/50"} hover:border-accent/50`}
      >
        {/* Trending Badge */}
        {isTrending && (
          <Badge className="absolute top-3 right-3 bg-accent/90 text-accent-foreground text-[10px]">
            🔥 Hot
          </Badge>
        )}
        
        {/* Emoji */}
        <span className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
          {category.emoji}
        </span>
        
        {/* Name */}
        <h3 className="font-serif font-semibold text-lg text-foreground text-center group-hover:text-accent transition-colors">
          {category.name}
        </h3>
        
        {/* Product Count */}
        <p className="text-xs text-muted-foreground mt-1.5">
          {productCount} products
        </p>
        
        {/* Explore Link */}
        <div className="flex items-center gap-1 mt-3 text-accent text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Explore <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  </motion.article>
);

export default Categories;
