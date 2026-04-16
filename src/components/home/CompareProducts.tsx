import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeftRight, ChevronRight, ExternalLink, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/hooks/useLocation";
import { generateProductUrlStatic } from "@/hooks/useProductUrl";

interface CompareProduct {
  id: string;
  slug: string | null;
  name: string;
  brand: string;
  category_id: string | null;
  description: string | null;
  volume: string | null;
  abv: number | null;
  age: string | null;
  origin: string | null;
  origin_flag: string | null;
  taste_profile: string | null;
  image_emoji: string | null;
  rating: number | null;
  type_tag: string | null;
  price?: number | null;
  mrp?: number | null;
  category?: {
    name: string;
    slug: string;
  } | null;
  sub_category?: {
    name: string;
    slug: string | null;
  } | null;
}

interface CompareContextType {
  compareProducts: CompareProduct[];
  addToCompare: (productId: string) => Promise<void>;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  showCompareSheet: boolean;
  setShowCompareSheet: (show: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [compareProducts, setCompareProducts] = useState<CompareProduct[]>([]);
  const [showCompareSheet, setShowCompareSheet] = useState(false);
  const { selectedCity, selectedState } = useLocation();

  const addToCompare = async (productId: string) => {
    if (compareProducts.length >= 4) return;
    if (compareProducts.find((p) => p.id === productId)) return;

    const { data: product } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(name, slug),
        sub_category:sub_categories(name, slug)
      `)
      .eq("id", productId)
      .maybeSingle();

    if (product && selectedCity) {
      const { data: priceData } = await supabase
        .from("product_prices")
        .select("*")
        .eq("product_id", productId)
        .eq("city_id", selectedCity.id)
        .maybeSingle();

      setCompareProducts((prev) => [
        ...prev,
        {
          ...product,
          price: priceData?.price || null,
          mrp: priceData?.mrp || null,
        },
      ]);
    } else if (product) {
      setCompareProducts((prev) => [...prev, product]);
    }
  };

  const removeFromCompare = (productId: string) => {
    setCompareProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearCompare = () => {
    setCompareProducts([]);
  };

  const isInCompare = (productId: string) => {
    return compareProducts.some((p) => p.id === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        compareProducts,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        showCompareSheet,
        setShowCompareSheet,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
};

// Floating compare bar
export const CompareFloatingBar = () => {
  const { compareProducts, setShowCompareSheet, clearCompare } = useCompare();

  if (compareProducts.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-24 left-4 right-4 z-40 bg-card border border-border rounded-2xl p-3 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {compareProducts.slice(0, 3).map((product) => (
              <div
                key={product.id}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg border-2 border-card"
              >
                {product.image_emoji || "🥃"}
              </div>
            ))}
            {compareProducts.length > 3 && (
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground border-2 border-card">
                +{compareProducts.length - 3}
              </div>
            )}
          </div>
          <span className="text-sm font-medium">
            {compareProducts.length} items to compare
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearCompare}>
            Clear
          </Button>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground"
            onClick={() => setShowCompareSheet(true)}
          >
            Compare <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Compare sheet with side-by-side view
export const CompareSheet = () => {
  const { compareProducts, showCompareSheet, setShowCompareSheet, removeFromCompare } = useCompare();
  const [expandedDesc, setExpandedDesc] = useState<string | null>(null);
  const [expandedTaste, setExpandedTaste] = useState<string | null>(null);

  const truncateText = (text: string | null, id: string, type: "desc" | "taste") => {
    if (!text) return "—";
    const isExpanded = type === "desc" ? expandedDesc === id : expandedTaste === id;
    if (text.length <= 80 || isExpanded) return text;
    return (
      <>
        {text.slice(0, 80)}...
        <button
          onClick={() => type === "desc" ? setExpandedDesc(id) : setExpandedTaste(id)}
          className="text-accent ml-1"
        >
          See more
        </button>
      </>
    );
  };

  return (
    <Sheet open={showCompareSheet} onOpenChange={setShowCompareSheet}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-accent" />
            Compare Products
          </SheetTitle>
        </SheetHeader>

        {compareProducts.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <ArrowLeftRight className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Add products to compare</h3>
            <p className="text-sm text-muted-foreground">
              Select at least 2 products to compare them side by side
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(90vh-80px)]">
            <div className="flex">
              {compareProducts.map((product) => (
                <div key={product.id} className="min-w-[200px] w-[200px] border-r border-border last:border-r-0">
                  {/* Product Image */}
                  <div className="relative p-4 bg-muted/30">
                    <button
                      onClick={() => removeFromCompare(product.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-card flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="aspect-square flex items-center justify-center text-6xl mb-2">
                      {product.image_emoji || "🥃"}
                    </div>
                    {product.origin_flag && (
                      <div className="absolute top-2 left-2 text-lg">
                        {product.origin_flag}
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-3 space-y-3 text-sm">
                    {/* Name & Brand */}
                    <div>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                      <p className="font-semibold line-clamp-2">{product.name}</p>
                    </div>

                    {/* Size/Volume */}
                    <div className="py-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Size</p>
                      <p className="font-medium">{product.volume || "—"}</p>
                    </div>

                    {/* Price */}
                    <div className="py-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Price</p>
                      <p className="font-bold text-accent">
                        {product.price ? `₹${Number(product.price).toLocaleString()}` : "—"}
                      </p>
                    </div>

                    {/* Category */}
                    <div className="py-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Category</p>
                      <p className="font-medium">{product.category?.name || "—"}</p>
                    </div>

                    {/* Type */}
                    <div className="py-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Type</p>
                      <p className="font-medium">{product.type_tag || "—"}</p>
                    </div>

                    {/* Country */}
                    <div className="py-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Country</p>
                      <p className="font-medium flex items-center gap-1">
                        {product.origin_flag && <span>{product.origin_flag}</span>}
                        {product.origin || "—"}
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="py-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Rating</p>
                      <p className="font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 fill-accent text-accent" />
                        {product.rating || "—"}
                      </p>
                    </div>

                    {/* Description */}
                    <div className="py-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-xs leading-relaxed">
                        {truncateText(product.description, product.id, "desc")}
                      </p>
                    </div>

                    {/* Tasting Notes */}
                    <div className="py-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Tasting Notes</p>
                      <p className="text-xs leading-relaxed">
                        {truncateText(product.taste_profile, product.id, "taste")}
                      </p>
                    </div>

                    {/* Open Button */}
                    <div className="pt-2">
                      <Link 
                        to={generateProductUrlStatic(product, undefined)} 
                        onClick={() => setShowCompareSheet(false)}
                      >
                        <Button size="sm" className="w-full bg-accent text-accent-foreground gap-1">
                          View Details
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CompareProvider;
