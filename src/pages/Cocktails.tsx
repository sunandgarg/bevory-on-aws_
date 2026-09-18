import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Wine, Clock, ChefHat, X, ChevronRight, Sparkles, Share2, Heart, Bookmark, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { apiClient } from "@/integrations/api/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import SEOHead from "@/components/SEOHead";

interface Cocktail {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_emoji: string | null;
  image_url: string | null;
  ingredients: string[] | null;
  instructions: string | null;
  difficulty: string | null;
  prep_time: string | null;
  category: string | null;
  base_spirit: string | null;
  is_featured: boolean | null;
  is_popular: boolean | null;
}

const SPIRIT_FILTERS = [
  { label: "All", value: "all", emoji: "🍸" },
  { label: "Whiskey", value: "Whiskey", emoji: "🥃" },
  { label: "Vodka", value: "Vodka", emoji: "🍸" },
  { label: "Rum", value: "Rum", emoji: "🍹" },
  { label: "Gin", value: "Gin", emoji: "🫒" },
  { label: "Tequila", value: "Tequila", emoji: "🌵" },
];

const CATEGORY_FILTERS = ["All", "Classic", "Modern", "Tropical"];

const Cocktails = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpirit, setSelectedSpirit] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);

  const { data: cocktails = [], isLoading } = useQuery({
    queryKey: ["cocktails"],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("cocktails")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("is_popular", { ascending: false })
        .order("name");
      
      if (error) throw error;
      return data as Cocktail[];
    },
  });

  useEffect(() => {
    const cocktailSlug = searchParams.get("slug") || searchParams.get("id");
    if (cocktailSlug && cocktails.length > 0) {
      const cocktail = cocktails.find(c => c.slug === cocktailSlug || c.id === cocktailSlug);
      if (cocktail) {
        setSelectedCocktail(cocktail);
      }
    }
  }, [searchParams, cocktails]);

  const filteredCocktails = cocktails.filter((cocktail) => {
    const matchesSearch = cocktail.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cocktail.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cocktail.ingredients?.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpirit = selectedSpirit === "all" || cocktail.base_spirit === selectedSpirit;
    const matchesCategory = selectedCategory === "All" || cocktail.category === selectedCategory;
    
    return matchesSearch && matchesSpirit && matchesCategory;
  });

  const featuredCocktails = filteredCocktails.filter(c => c.is_featured);
  const popularCocktails = filteredCocktails.filter(c => c.is_popular && !c.is_featured);
  const otherCocktails = filteredCocktails.filter(c => !c.is_featured && !c.is_popular);

  // Helper to convert prep_time to ISO 8601 duration format
  const formatPrepTimeISO = (prepTime: string | null): string => {
    if (!prepTime) return "PT5M"; // Default 5 minutes
    const match = prepTime.match(/(\d+)/);
    const minutes = match ? parseInt(match[1]) : 5;
    return `PT${minutes}M`;
  };

  // Generate structured data for SEO with all required Recipe fields
  const generateStructuredData = () => ({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Cocktail Recipes & Library",
    "description": "Discover classic and modern cocktail recipes. Learn how to make your favorite drinks with step-by-step instructions.",
    "url": "https://bevory.in/cocktails",
    "numberOfItems": cocktails.length,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": cocktails.slice(0, 10).map((c, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "Recipe",
          "name": c.name,
          "description": c.description || `Delicious ${c.name} cocktail recipe with ${c.base_spirit || 'spirits'}.`,
          "image": c.image_url || "https://bevory.in/og-image.png",
          "recipeCategory": "Cocktail",
          "recipeCuisine": "International",
          "prepTime": formatPrepTimeISO(c.prep_time),
          "cookTime": "PT0M",
          "totalTime": formatPrepTimeISO(c.prep_time),
          "recipeYield": "1 serving",
          "recipeIngredient": c.ingredients || [],
          "recipeInstructions": c.instructions ? [{
            "@type": "HowToStep",
            "text": c.instructions
          }] : [{
            "@type": "HowToStep",
            "text": `Mix ingredients and serve ${c.name}.`
          }],
          "author": {
            "@type": "Organization",
            "name": "BevOry"
          },
          "publisher": {
            "@type": "Organization",
            "name": "BevOry",
            "logo": {
              "@type": "ImageObject",
              "url": "https://bevory.in/favicon.png"
            }
          },
          "keywords": `${c.name}, ${c.base_spirit || ''} cocktail, cocktail recipe, drink recipe, mixology`,
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.5",
            "reviewCount": "10",
            "bestRating": "5",
            "worstRating": "1"
          },
          "nutrition": {
            "@type": "NutritionInformation",
            "calories": "150 kcal"
          },
          "url": `https://bevory.in/cocktails?slug=${c.slug || c.id}`
        }
      }))
    }
  });

  return (
    <>
      <SEOHead
        title="Cocktail Recipes & Library | BevOry"
        description="Explore our collection of classic and modern cocktail recipes. Learn how to make whiskey, vodka, rum, gin, and tequila cocktails with step-by-step instructions."
        keywords="cocktail recipes, drink recipes, whiskey cocktails, vodka cocktails, rum cocktails, gin cocktails, mixology"
        jsonLd={generateStructuredData()}
      />
      <MobileLayout showSearch={false} showCheersGuide={false}>
        <div className="pb-6">
          {/* Hero Header */}
          <header className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-background to-background" />
            
            <div className="relative px-4 pt-6 pb-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-5"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-3">
                  <Sparkles className="w-4 h-4" />
                  <span>Mixology Made Easy</span>
                </div>
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                  Cocktail Library
                </h1>
                <p className="text-muted-foreground">
                  Discover recipes for classic and modern cocktails
                </p>
              </motion.div>

              {/* Search */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-accent/10 rounded-2xl blur-xl" />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search cocktails, ingredients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-10 h-12 bg-card/80 backdrop-blur-sm border-border/50 rounded-2xl text-base shadow-lg"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-muted hover:bg-muted/80"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Spirit Filter Pills */}
            <nav className="px-4 pb-3" aria-label="Filter by spirit">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
              >
                {SPIRIT_FILTERS.map((spirit, index) => (
                  <motion.button
                    key={spirit.value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    onClick={() => setSelectedSpirit(spirit.value)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                      selectedSpirit === spirit.value
                        ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25 scale-105"
                        : "bg-secondary/80 text-foreground hover:bg-secondary hover:scale-102"
                    }`}
                  >
                    <span>{spirit.emoji}</span>
                    <span>{spirit.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            </nav>

            {/* Category Filter */}
            <div className="px-4 pb-4">
              <div className="flex gap-2">
                {CATEGORY_FILTERS.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCategory === category
                        ? "bg-foreground text-background"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <main className="px-4 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-secondary/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Featured Cocktails */}
                {featuredCocktails.length > 0 && (
                  <section>
                    <h2 className="font-serif font-semibold text-lg mb-3 flex items-center gap-2">
                      <span className="text-xl">⭐</span> Featured Cocktails
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      {featuredCocktails.map((cocktail, index) => (
                        <CocktailCard
                          key={cocktail.id}
                          cocktail={cocktail}
                          index={index}
                          onClick={() => setSelectedCocktail(cocktail)}
                          featured
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Popular Cocktails */}
                {popularCocktails.length > 0 && (
                  <section>
                    <h2 className="font-serif font-semibold text-lg mb-3 flex items-center gap-2">
                      <span className="text-xl">🔥</span> Popular Picks
                    </h2>
                    <div className="space-y-2">
                      {popularCocktails.map((cocktail, index) => (
                        <CocktailListItem
                          key={cocktail.id}
                          cocktail={cocktail}
                          index={index}
                          onClick={() => setSelectedCocktail(cocktail)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* All Cocktails */}
                {otherCocktails.length > 0 && (
                  <section>
                    <h2 className="font-serif font-semibold text-lg mb-3">All Recipes</h2>
                    <div className="space-y-2">
                      {otherCocktails.map((cocktail, index) => (
                        <CocktailListItem
                          key={cocktail.id}
                          cocktail={cocktail}
                          index={index}
                          onClick={() => setSelectedCocktail(cocktail)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {filteredCocktails.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-16 text-center"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                      <Wine className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-1">No cocktails found</p>
                    <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
                  </motion.div>
                )}
              </>
            )}
          </main>
        </div>

        {/* Cocktail Detail Sheet */}
        <CocktailDetailSheet
          cocktail={selectedCocktail}
          open={!!selectedCocktail}
          onClose={() => setSelectedCocktail(null)}
        />
      </MobileLayout>
    </>
  );
};

const CocktailCard = ({
  cocktail,
  index,
  onClick,
  featured = false,
}: {
  cocktail: Cocktail;
  index: number;
  onClick: () => void;
  featured?: boolean;
}) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    onClick={onClick}
    className={`p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] group ${
      featured
        ? "bg-gradient-to-br from-accent/20 via-accent/10 to-background border border-accent/20"
        : "bg-secondary/50 border border-border/50 hover:border-accent/30"
    }`}
  >
    <div className="text-5xl mb-3">{cocktail.image_emoji || "🍸"}</div>
    <h3 className="font-semibold text-sm mb-1.5 line-clamp-1 group-hover:text-accent transition-colors">
      {cocktail.name}
    </h3>
    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
      {cocktail.description}
    </p>
    <div className="flex items-center gap-2 mt-3">
      <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
        {cocktail.base_spirit}
      </Badge>
      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
        <Clock className="w-2.5 h-2.5" />
        {cocktail.prep_time}
      </span>
    </div>
  </motion.article>
);

const CocktailListItem = ({
  cocktail,
  index,
  onClick,
}: {
  cocktail: Cocktail;
  index: number;
  onClick: () => void;
}) => (
  <motion.article
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.03 }}
    onClick={onClick}
    className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50 cursor-pointer hover:bg-secondary hover:border-accent/30 transition-all group"
  >
    <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center text-3xl flex-shrink-0 shadow-sm border border-border/50">
      {cocktail.image_emoji || "🍸"}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-sm group-hover:text-accent transition-colors">{cocktail.name}</h3>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {cocktail.base_spirit}
        </Badge>
        <span className="text-xs text-muted-foreground">{cocktail.difficulty}</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
          <Clock className="w-3 h-3" />
          {cocktail.prep_time}
        </span>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-accent transition-colors" />
  </motion.article>
);

const CocktailDetailSheet = ({
  cocktail,
  open,
  onClose,
}: {
  cocktail: Cocktail | null;
  open: boolean;
  onClose: () => void;
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!cocktail) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: cocktail.name,
          text: `Check out this ${cocktail.name} recipe!`,
          url: `${window.location.origin}/cocktails?slug=${cocktail.slug || cocktail.id}`,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    }
  };

  const howToSchema = cocktail.instructions ? {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to Make ${cocktail.name}`,
    "description": cocktail.description || `Recipe for ${cocktail.name} cocktail`,
    "totalTime": cocktail.prep_time ? `PT${parseInt(cocktail.prep_time) || 5}M` : "PT5M",
    "tool": [{ "@type": "HowToTool", "name": "Cocktail shaker" }, { "@type": "HowToTool", "name": "Jigger" }],
    "supply": (cocktail.ingredients || []).map(ing => ({ "@type": "HowToSupply", "name": ing })),
    "step": cocktail.instructions.split(/[.!]\s+/).filter(Boolean).map((step, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "text": step.trim()
    })),
    "recipeCategory": cocktail.category || "Cocktail",
    "keywords": `${cocktail.name}, ${cocktail.base_spirit} cocktail, summer 2026`
  } : null;

  return (
    <>
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
      <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <ScrollArea className="h-full pr-4">
          <SheetHeader className="text-left pb-4">
            {/* Actions */}
            <div className="flex items-center justify-end gap-1 -mt-2 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLiked(!isLiked)}
                className={isLiked ? "text-red-500" : "text-muted-foreground"}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSaved(!isSaved)}
                className={isSaved ? "text-accent" : "text-muted-foreground"}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare} className="text-muted-foreground">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            <div className="text-7xl mb-4">{cocktail.image_emoji || "🍸"}</div>
            <SheetTitle className="text-2xl font-serif">{cocktail.name}</SheetTitle>
            <p className="text-muted-foreground leading-relaxed">{cocktail.description}</p>
          </SheetHeader>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 border border-border/50 text-center">
              <Wine className="w-5 h-5 mx-auto mb-2 text-accent" />
              <p className="text-xs text-muted-foreground mb-0.5">Base Spirit</p>
              <p className="text-sm font-semibold">{cocktail.base_spirit}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 border border-border/50 text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-accent" />
              <p className="text-xs text-muted-foreground mb-0.5">Prep Time</p>
              <p className="text-sm font-semibold">{cocktail.prep_time}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 border border-border/50 text-center">
              <ChefHat className="w-5 h-5 mx-auto mb-2 text-accent" />
              <p className="text-xs text-muted-foreground mb-0.5">Difficulty</p>
              <p className="text-sm font-semibold">{cocktail.difficulty}</p>
            </div>
          </div>

          {/* Ingredients */}
          <section className="mb-6">
            <h3 className="font-serif font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-xl">🧪</span> Ingredients
            </h3>
            <ul className="space-y-2">
              {cocktail.ingredients?.map((ingredient, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50"
                >
                  <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                  <span className="text-sm">{ingredient}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Instructions */}
          <section className="mb-6">
            <h3 className="font-serif font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-xl">📝</span> How to Make
            </h3>
            <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {cocktail.instructions}
              </p>
            </div>
          </section>

          {/* Category Badges */}
          <div className="flex flex-wrap gap-2 pb-8">
            <Badge variant="outline" className="text-sm">{cocktail.category}</Badge>
            {cocktail.is_popular && (
              <Badge variant="secondary" className="text-sm">
                🔥 Popular Choice
              </Badge>
            )}
            {cocktail.is_featured && (
              <Badge className="bg-accent text-accent-foreground text-sm">
                ⭐ Featured
              </Badge>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
    </>
  );
};

export default Cocktails;
