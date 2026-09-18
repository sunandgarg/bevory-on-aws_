import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ArrowLeft, Package } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { useProducts } from "@/hooks/useProducts";
import { useLocation } from "@/hooks/useLocation";
import { useProductUrl } from "@/hooks/useProductUrl";
import CompareButton from "@/components/product/CompareButton";
import FavoriteButton from "@/components/FavoriteButton";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/integrations/api/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface SubCategory {
  id: string;
  name: string;
  slug: string | null;
  emoji: string | null;
  image_url: string | null;
}

const CategoryDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { categories, getProductsByCategory, loading } = useProducts();
  const { selectedCity } = useLocation();
  const { getProductUrlSafe } = useProductUrl();
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  const category = categories.find((c) => c.slug === slug);
  const allProducts = getProductsByCategory(slug || "");

  // Fetch sub-categories for this category
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!category?.id) return;
      const { data } = await apiClient
        .from("sub_categories")
        .select("id, name, slug, emoji, image_url")
        .eq("category_id", category.id)
        .eq("is_active", true)
        .order("order_index");
      if (data) setSubCategories(data);
    };
    fetchSubCategories();
  }, [category?.id]);

  // Filter products by selected sub-category
  const products = useMemo(() => {
    if (!selectedSubCategory) return allProducts;
    return allProducts.filter((p: any) => p.sub_category_id === selectedSubCategory);
  }, [allProducts, selectedSubCategory]);

  // Generate structured data for SEO
  const generateStructuredData = () => {
    if (!category) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${category.name} Collection`,
      "description": category.description || `Browse our collection of ${category.name} products with prices and reviews.`,
      "url": window.location.href,
      "numberOfItems": products.length,
      "itemListElement": products.slice(0, 10).map((p, i) => ({
        "@type": "Product",
        "position": i + 1,
        "name": `${p.brand} ${p.name}`,
        "brand": { "@type": "Brand", "name": p.brand },
        ...(p.price && {
          "offers": {
            "@type": "Offer",
            "price": p.price,
            "priceCurrency": "INR",
          }
        }),
      })),
    };
  };

  if (loading) {
    return (
      <MobileLayout showBack>
        <div className="p-4">
          <div className="h-10 w-48 bg-muted rounded-lg animate-pulse mb-4" />
          <div className="h-52 bg-muted rounded-2xl animate-pulse mb-6" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!category) {
    return (
      <MobileLayout showBack>
        <div className="p-4 text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-serif font-bold mb-2">Category Not Found</h1>
          <p className="text-muted-foreground mb-6">The category you're looking for doesn't exist.</p>
          <Link to="/categories">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Browse Categories
            </Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <>
      <SEOHead
        title={(category as any).meta_title || `${category.name} Prices & Reviews | Bevory`}
        description={(category as any).meta_description || category.description || `Browse our collection of ${category.name}. Compare prices, read reviews, and find the best ${category.name.toLowerCase()} in ${selectedCity?.name || 'India'}.`}
        keywords={`${category.name}, ${category.name.toLowerCase()} price guide, ${category.name.toLowerCase()} reviews, ${category.name.toLowerCase()} India`}
        canonical={`/category/${category.slug}`}
        jsonLd={generateStructuredData()}
      />
      <MobileLayout showBack title={category.name}>
        <div className="pb-6">
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            {category.image_url ? (
              <div className="relative h-56 overflow-hidden">
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{category.emoji}</span>
                      <h1 className="text-3xl font-serif font-bold text-foreground">{category.name}</h1>
                    </div>
                    <p className="text-muted-foreground">
                      {products.length} products
                      {selectedCity && <span className="text-accent"> • {selectedCity.name}</span>}
                    </p>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-gradient-to-br from-accent/10 to-background">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center text-5xl flex-shrink-0 shadow-lg border border-border">
                    {category.emoji}
                  </div>
                  <div>
                    <h1 className="text-2xl font-serif font-bold mb-1">{category.name}</h1>
                    <p className="text-muted-foreground text-sm">
                      {products.length} products
                      {selectedCity && <span className="text-accent"> • {selectedCity.name}</span>}
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.section>

          {/* Description */}
          {category.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="px-4 mt-4"
            >
              <p className="text-muted-foreground leading-relaxed text-sm p-4 rounded-xl bg-secondary/50 border border-border/50">
                {category.description}
              </p>
            </motion.div>
          )}

          {/* Sub-category Filter */}
          {subCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="px-4 mt-4"
            >
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  <Button
                    variant={selectedSubCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSubCategory(null)}
                    className="rounded-full flex-shrink-0"
                  >
                    All ({allProducts.length})
                  </Button>
                  {subCategories.map((sub) => {
                    const count = allProducts.filter((p: any) => p.sub_category_id === sub.id).length;
                    return (
                      <Button
                        key={sub.id}
                        variant={selectedSubCategory === sub.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSubCategory(sub.id)}
                        className="rounded-full flex-shrink-0 gap-1.5"
                      >
                        {sub.emoji && <span>{sub.emoji}</span>}
                        {sub.name} ({count})
                      </Button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </motion.div>
          )}

          {/* Products */}
          <main className="px-4 mt-6">
            {products.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {selectedSubCategory ? "No products in this sub-category" : "No products yet"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedSubCategory ? "Try selecting a different filter" : "Products in this category will appear here"}
                </p>
                {selectedSubCategory && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setSelectedSubCategory(null)}
                  >
                    Clear Filter
                  </Button>
                )}
              </motion.div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif font-semibold">
                    {selectedSubCategory 
                      ? subCategories.find(s => s.id === selectedSubCategory)?.name 
                      : `All ${category.name}`}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {products.length} items
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {products.map((product, index) => (
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
                          
                          {/* Product Image */}
                          <div className="aspect-square bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
                            {product.image_url ? (
                              <img 
                                src={`https://wsrv.nl/?url=${encodeURIComponent(product.image_url)}&w=400&output=webp&q=80`}
                                srcSet={`https://wsrv.nl/?url=${encodeURIComponent(product.image_url)}&w=200&output=webp&q=80 200w, https://wsrv.nl/?url=${encodeURIComponent(product.image_url)}&w=400&output=webp&q=80 400w`}
                                sizes="(max-width: 640px) 50vw, 200px"
                                alt={product.name}
                                loading="lazy" decoding="async" width={400} height={400}
                                className="w-full h-full object-cover"
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
                            {product.sub_category && !selectedSubCategory && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-1 border-accent/30 text-accent">
                                {product.sub_category.emoji} {product.sub_category.name}
                              </Badge>
                            )}
                            
                            {/* Rating & Price */}
                            <div className="flex items-center justify-between mt-2.5">
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-medium">
                                  {product.rating ? Number(product.rating).toFixed(1) : "4.5"}
                                </span>
                              </div>
                              <p className="font-bold text-sm text-accent">
                                {product.price ? `₹${Number(product.price).toLocaleString('en-IN')}` : "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </MobileLayout>
    </>
  );
};

export default CategoryDetail;
