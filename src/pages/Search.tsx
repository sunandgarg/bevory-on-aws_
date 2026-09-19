import { useEffect, useState, useMemo } from "react";
import { Search as SearchIcon, SlidersHorizontal, X, Star, TrendingUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import MobileLayout from "@/components/layout/MobileLayout";
import { useProducts } from "@/hooks/useProducts";
import { useLocation } from "@/hooks/useLocation";
import { Link, useSearchParams } from "react-router-dom";
import CompareButton from "@/components/product/CompareButton";
import FavoriteButton from "@/components/FavoriteButton";
import SEOHead from "@/components/SEOHead";
import { useProductUrl } from "@/hooks/useProductUrl";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q")?.trim() || "");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => searchParams.get("category"));
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<"rating" | "price_asc" | "price_desc" | "name">(() => {
    const requestedSort = searchParams.get("sort");
    return requestedSort === "price_asc" || requestedSort === "price_desc" || requestedSort === "name"
      ? requestedSort
      : "rating";
  });

  const { products, categories, loading } = useProducts();
  const { selectedCity } = useLocation();
  const { getProductUrlSafe } = useProductUrl();
  const trendingOnly = searchParams.get("sort") === "trending" || searchParams.get("trending") === "true";

  useEffect(() => {
    setQuery(searchParams.get("q")?.trim() || "");
    setSelectedCategory(searchParams.get("category"));

    const requestedSort = searchParams.get("sort");
    if (requestedSort === "price_asc" || requestedSort === "price_desc" || requestedSort === "name") {
      setSortBy(requestedSort);
    } else {
      setSortBy("rating");
    }
  }, [searchParams]);

  const updateSearchParam = (key: string, value?: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set(key, value);
    else nextParams.delete(key);
    setSearchParams(nextParams, { replace: true });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    updateSearchParam("q", value.trim() || null);
  };

  const handleCategoryChange = (slug: string) => {
    const nextCategory = selectedCategory === slug ? null : slug;
    setSelectedCategory(nextCategory);
    updateSearchParam("category", nextCategory);
  };

  const handleSortChange = (value: typeof sortBy) => {
    setSortBy(value);
    updateSearchParam("sort", value === "rating" ? null : value);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (trendingOnly) {
      result = result.filter((product) => product.is_trending);
    }

    // Search filter
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.brand.toLowerCase().includes(lowerQuery) ||
          p.category?.name.toLowerCase().includes(lowerQuery)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((p) => p.category?.slug === selectedCategory);
    }

    // Price filter
    result = result.filter((p) => {
      const price = Number(p.price) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Rating filter
    if (minRating > 0) {
      result = result.filter((p) => (p.rating || 0) >= minRating);
    }

    // Sort
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "price_asc":
        result.sort((a, b) => {
          if (!Number(a.price)) return 1;
          if (!Number(b.price)) return -1;
          return Number(a.price) - Number(b.price);
        });
        break;
      case "price_desc":
        result.sort((a, b) => {
          if (!Number(a.price)) return 1;
          if (!Number(b.price)) return -1;
          return Number(b.price) - Number(a.price);
        });
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [products, query, selectedCategory, priceRange, minRating, sortBy, trendingOnly]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setPriceRange([0, 50000]);
    setMinRating(0);
    setSortBy("rating");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");
    nextParams.delete("sort");
    nextParams.delete("trending");
    setSearchParams(nextParams, { replace: true });
  };

  const clearAll = () => {
    setQuery("");
    setSelectedCategory(null);
    setPriceRange([0, 50000]);
    setMinRating(0);
    setSortBy("rating");
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = Boolean(
    selectedCategory || trendingOnly || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 50000,
  );

  return (
    <>
      <SEOHead
        title={query ? `Search: ${query} | Bevory` : "Search Products - Find Your Perfect Drink | Bevory"}
        description="Search and compare prices for whisky, vodka, rum, gin, and more. Find the best deals on premium spirits near you."
        keywords="search spirits, find whisky, compare prices, buy alcohol online, liquor search"
        canonical="/search"
        robots="noindex, follow, max-image-preview:large"
      />
      <MobileLayout title="Search">
        <div className="pb-6">
          {/* Hero Header */}
          <header className="px-4 pt-4 pb-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Discover & Compare</span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-foreground">
                Find Your Perfect Drink
              </h1>
            </motion.div>

            {/* Search Bar */}
            <div className="flex gap-2">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative flex-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-accent/10 rounded-xl blur-xl" />
                <div className="relative">
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search drinks, brands..."
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    aria-label="Search drinks and brands"
                    className="pl-12 h-12 rounded-xl bg-card/80 backdrop-blur-sm border-border/50 shadow-lg"
                  />
                  <AnimatePresence>
                    {query && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => handleQueryChange("")}
                        aria-label="Clear search"
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-muted hover:bg-muted/80"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Open filters and sorting"
                    className={`h-12 w-12 rounded-xl shadow-lg ${hasActiveFilters ? "border-accent text-accent bg-accent/10" : ""}`}
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
                  <SheetHeader>
                    <SheetTitle className="font-serif">Filters & Sort</SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 space-y-8">
                    {/* Categories */}
                    <section>
                      <h3 className="font-semibold mb-3">Category</h3>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.slug)}
                            aria-pressed={selectedCategory === cat.slug}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              selectedCategory === cat.slug
                                ? "bg-accent text-accent-foreground shadow-lg"
                                : "bg-secondary text-foreground hover:bg-secondary/80"
                            }`}
                          >
                            {cat.emoji} {cat.name}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Price Range */}
                    <section>
                      <h3 className="font-semibold mb-3">
                        Price Range: ₹{priceRange[0].toLocaleString('en-IN')} - ₹{priceRange[1].toLocaleString('en-IN')}
                      </h3>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        min={0}
                        max={50000}
                        step={500}
                        className="py-4"
                      />
                    </section>

                    {/* Rating */}
                    <section>
                      <h3 className="font-semibold mb-3">Minimum Rating</h3>
                      <div className="flex gap-2">
                        {[0, 3, 3.5, 4, 4.5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setMinRating(rating)}
                            aria-pressed={minRating === rating}
                            className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm transition-all ${
                              minRating === rating
                                ? "bg-accent text-accent-foreground shadow-lg"
                                : "bg-secondary text-foreground hover:bg-secondary/80"
                            }`}
                          >
                            {rating === 0 ? (
                              "All"
                            ) : (
                              <>
                                <Star className="w-3.5 h-3.5 fill-current" />
                                {rating}+
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Sort */}
                    <section>
                      <h3 className="font-semibold mb-3">Sort By</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "rating", label: "Top Rated", icon: "⭐" },
                          { value: "price_asc", label: "Price: Low → High", icon: "💰" },
                          { value: "price_desc", label: "Price: High → Low", icon: "💎" },
                          { value: "name", label: "Name A-Z", icon: "🔤" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value as typeof sortBy)}
                            aria-pressed={sortBy === option.value}
                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                              sortBy === option.value
                                ? "bg-accent text-accent-foreground shadow-lg"
                                : "bg-secondary text-foreground hover:bg-secondary/80"
                            }`}
                          >
                            <span className="mr-2">{option.icon}</span>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" onClick={clearFilters} className="flex-1">
                        Clear All
                      </Button>
                      <Button onClick={() => setShowFilters(false)} className="flex-1 bg-accent text-accent-foreground">
                        Show {filteredProducts.length} Results
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </header>

          <main className="px-4">
            {/* Results Info */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                <span className="font-medium text-foreground">{filteredProducts.length}</span>{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
                {selectedCity && <span className="text-accent"> in {selectedCity.name}</span>}
                {trendingOnly && <span className="text-accent"> · Trending</span>}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-accent font-medium hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[3/4] bg-muted rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
                aria-live="polite"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <SearchIcon className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {products.length === 0 ? "Catalog is being updated" : "No matches found"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {products.length === 0
                    ? `Products for ${selectedCity?.name || "your city"} will appear as local prices are published.`
                    : "Try a shorter search or reset your filters."}
                </p>
                {products.length === 0 ? (
                  <Button variant="outline" asChild>
                    <Link to="/categories">Browse categories</Link>
                  </Button>
                ) : (
                  <Button variant="outline" onClick={clearAll}>
                    Reset search
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                  {filteredProducts.map((product, index) => (
                    <motion.article
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Link to={getProductUrlSafe(product)}>
                        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden relative group hover:border-accent/30 hover:shadow-lg transition-all">
                          {/* Action Buttons */}
                          <div className="absolute top-2 left-2 right-2 flex justify-between z-10">
                            <CompareButton productId={product.id} size="sm" />
                            <FavoriteButton productId={product.id} size="sm" />
                          </div>
                          
                          {/* Trending Badge */}
                          {product.is_trending && (
                            <Badge className="absolute top-2 left-1/2 -translate-x-1/2 bg-accent/90 text-accent-foreground text-[10px] z-10">
                              🔥 Trending
                            </Badge>
                          )}
                          
                          {/* Product Image */}
                          <div className="aspect-square bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={`${product.brand} ${product.name} bottle`}
                                width={400}
                                height={400}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <span className="text-6xl group-hover:scale-110 transition-transform">
                                {product.image_emoji || "🥃"}
                              </span>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="p-3.5">
                            <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>
                            <h3 className="font-medium text-sm line-clamp-1 group-hover:text-accent transition-colors">
                              {product.name}
                            </h3>
                            
                            {/* Sub-Category Badge */}
                            {product.sub_category && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-1 border-accent/30 text-accent">
                                {product.sub_category.emoji} {product.sub_category.name}
                              </Badge>
                            )}
                            
                            {/* Rating & Price */}
                            <div className="flex items-center justify-between mt-2.5">
                              <div className="flex items-center gap-1">
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    Number(product.rating) > 0
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground/50"
                                  }`}
                                />
                                <span className={`text-xs font-medium ${Number(product.rating) > 0 ? "" : "text-muted-foreground"}`}>
                                  {Number(product.rating) > 0 ? Number(product.rating).toFixed(1) : "New"}
                                </span>
                              </div>
                              <p className={`font-bold ${product.price ? "text-sm text-accent" : "text-[10px] text-muted-foreground"}`}>
                                {product.price ? `₹${Number(product.price).toLocaleString('en-IN')}` : "Price pending"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>
      </MobileLayout>
    </>
  );
};

export default Search;
