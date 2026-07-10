import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, Plus, Check, Star, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProducts } from "@/hooks/useProducts";
import { useCompare } from "@/components/home/CompareProducts";
import { useLocation } from "@/hooks/useLocation";

const CompareSection = () => {
  const { products, loading: productsLoading } = useProducts();
  const { compareProducts, addToCompare, removeFromCompare, clearCompare } = useCompare();
  const { selectedCity } = useLocation();
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showComparison, setShowComparison] = useState(false);

  // Pre-populate with sample products if empty
  useEffect(() => {
    if (products.length > 0 && compareProducts.length === 0) {
      // Add first two trending products for demo
      const trending = products.filter((p: any) => p.is_trending).slice(0, 2);
      trending.forEach((p: any) => addToCompare(p.id));
    }
  }, [products]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const features = ["Taste Profile", "Origin", "ABV", "Age", "Volume"];

  const getBestValue = () => {
    if (compareProducts.length < 2) return null;
    const withPrices = compareProducts.filter(p => p.price);
    if (withPrices.length < 2) return null;
    
    // Best value = highest rating per rupee
    const scored = withPrices.map(p => ({
      id: p.id,
      score: (p.rating || 0) / (Number(p.price) || 1) * 1000,
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.id;
  };

  const bestValueId = getBestValue();

  return (
    <section id="compare" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ArrowLeftRight className="w-5 h-5 text-accent" />
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">
              Compare
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Compare Brands Side by Side
          </h2>
          <p className="text-muted-foreground">
            Make informed decisions by comparing your favorite drinks across price, taste, and quality metrics.
          </p>
        </div>

        {/* Comparison Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {/* Product Cards */}
            <AnimatePresence mode="popLayout">
              {compareProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`relative p-6 rounded-2xl bg-card border-2 transition-all ${
                    bestValueId === product.id ? "border-accent" : "border-border"
                  }`}
                >
                  {/* Remove button */}
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-muted hover:bg-destructive/20 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {bestValueId === product.id && (
                    <div className="flex items-center gap-1 mb-3 text-accent text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Best Value
                    </div>
                  )}
                  <div className="text-6xl mb-4 text-center">{product.image_emoji || "🥃"}</div>
                  <h3 className="font-semibold text-center mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground text-center mb-2">{product.brand}</p>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="text-sm font-medium">{product.rating}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {product.price ? `₹${Number(product.price).toLocaleString()}` : "N/A"}
                    </p>
                    {product.mrp && Number(product.mrp) > Number(product.price) && (
                      <p className="text-sm text-muted-foreground line-through">
                        ₹{Number(product.mrp).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Attributes */}
                  <div className="mt-6 space-y-3 pt-4 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taste</span>
                      <span className="font-medium text-right text-xs">{product.taste_profile || "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Origin</span>
                      <span className="font-medium">{product.origin_flag} {product.origin || "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ABV</span>
                      <span className="font-medium">{product.abv ? `${product.abv}%` : "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Age</span>
                      <span className="font-medium">{product.age || "-"}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add Another Card */}
            {compareProducts.length < 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                onClick={() => setShowProductPicker(true)}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border hover:border-accent/50 transition-colors cursor-pointer group min-h-[300px]"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                  <Plus className="w-8 h-8 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Add Another
                </p>
                <p className="text-sm text-muted-foreground mt-1">Tap to compare</p>
              </motion.div>
            )}
          </div>

          {/* City indicator */}
          {selectedCity && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              📍 Prices shown for {selectedCity.name}
            </p>
          )}

          {/* CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {compareProducts.length > 0 && (
              <Button
                variant="outline"
                onClick={clearCompare}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Clear All
              </Button>
            )}
            <Button
              size="lg"
              onClick={() => setShowProductPicker(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <ArrowLeftRight className="w-5 h-5" />
              Add Products to Compare
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Product Picker Dialog */}
      <Dialog open={showProductPicker} onOpenChange={setShowProductPicker}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Product to Compare</DialogTitle>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-2">
            {productsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const isSelected = compareProducts.some(p => p.id === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      if (!isSelected) {
                        addToCompare(product.id);
                        setShowProductPicker(false);
                        setSearchQuery("");
                      }
                    }}
                    disabled={isSelected || compareProducts.length >= 4}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                      isSelected
                        ? "bg-accent/10 cursor-not-allowed"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <span className="text-2xl">{product.image_emoji || "🥃"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.brand} {product.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-accent text-accent" />
                          {product.rating}
                        </span>
                        <span>•</span>
                        <span>{product.category?.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {product.price ? `₹${Number(product.price).toLocaleString()}` : "-"}
                      </p>
                      {isSelected && (
                        <span className="text-xs text-accent">Added</span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">No products found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CompareSection;
