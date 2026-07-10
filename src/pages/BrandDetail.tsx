import { useState, useEffect, memo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Star, ExternalLink, ChevronRight, Wine, Utensils, Sparkles, HelpCircle, Award, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MobileLayout from "@/components/layout/MobileLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation as useAppLocation } from "@/hooks/useLocation";
import { generateProductUrlStatic } from "@/hooks/useProductUrl";
import SEOHead from "@/components/SEOHead";
import OptimizedImage from "@/components/ui/OptimizedImage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Brand {
  id: string;
  brand_name: string;
  slug: string | null;
  logo_emoji: string | null;
  logo_url: string | null;
  image_url: string | null;
  description: string | null;
  link_url: string | null;
  featured_product_id: string | null;
  country: string | null;
  tasting_notes: unknown;
  story: string | null;
  how_to_enjoy: unknown;
  pairing_ideas: unknown;
  why_choose: string | null;
  faqs: unknown;
  final_verdict: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string | null;
  brand: string;
  image_emoji: string | null;
  rating: number | null;
  review_count: number | null;
  volume: string | null;
  abv: number | null;
  category: {
    name: string;
    slug: string;
    emoji: string | null;
  } | null;
  sub_category: {
    name: string;
    slug: string | null;
  } | null;
}

interface ProductWithPrice extends Product {
  price?: number | null;
}

interface TastingNote {
  title?: string;
  description?: string;
  note?: string;
  name?: string;
}

interface HowToEnjoy {
  title?: string;
  subheading?: string;
  description?: string;
}

interface PairingIdea {
  title?: string;
  items?: string[];
  description?: string;
}

interface FAQ {
  question?: string;
  answer?: string;
}

const BrandDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { selectedCity, selectedState } = useAppLocation();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<ProductWithPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrandData = async () => {
      if (!slug) return;

      let brandData = null;
      
      const { data: dataBySlug } = await supabase
        .from("brand_spotlights")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      
      if (dataBySlug) {
        brandData = dataBySlug;
      } else {
        const { data: dataById } = await supabase
          .from("brand_spotlights")
          .select("*")
          .eq("id", slug)
          .maybeSingle();
        brandData = dataById;
      }

      if (brandData) {
        setBrand(brandData);

        const { data: productsData } = await supabase
          .from("products")
          .select(`
            id, name, slug, brand, image_emoji, rating, review_count, volume, abv,
            category:categories(name, slug, emoji),
            sub_category:sub_categories(name, slug)
          `)
          .ilike("brand", `%${brandData.brand_name}%`)
          .order("is_trending", { ascending: false })
          .limit(20);

        if (productsData) {
          const productIds = productsData.map(p => p.id);
          let pricesMap: Record<string, number> = {};

          if (selectedCity?.id && productIds.length > 0) {
            const { data: pricesData } = await supabase
              .from("product_prices")
              .select("product_id, price")
              .eq("city_id", selectedCity.id)
              .in("product_id", productIds);

            if (pricesData) {
              pricesMap = pricesData.reduce((acc, p) => {
                acc[p.product_id] = p.price;
                return acc;
              }, {} as Record<string, number>);
            }
          }

          setProducts(
            productsData.map(p => ({
              ...p,
              price: pricesMap[p.id] || null,
            }))
          );
        }
      }

      setLoading(false);
    };

    fetchBrandData();
  }, [slug, selectedCity?.id]);

  // Parse tasting notes
  const parseTastingNotes = (): TastingNote[] => {
    if (!brand?.tasting_notes || !Array.isArray(brand.tasting_notes)) return [];
    return (brand.tasting_notes as unknown[]).map(item => {
      if (typeof item === 'string') return { description: item };
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        return {
          title: typeof obj.title === 'string' ? obj.title : undefined,
          description: typeof obj.description === 'string' ? obj.description : undefined,
          note: typeof obj.note === 'string' ? obj.note : undefined,
          name: typeof obj.name === 'string' ? obj.name : undefined,
        };
      }
      return {};
    }).filter(n => n.title || n.description || n.note || n.name);
  };

  // Parse how to enjoy
  const parseHowToEnjoy = (): HowToEnjoy[] => {
    if (!brand?.how_to_enjoy || !Array.isArray(brand.how_to_enjoy)) return [];
    return (brand.how_to_enjoy as unknown[]).map(item => {
      if (typeof item === 'string') return { description: item };
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        return {
          title: typeof obj.title === 'string' ? obj.title : typeof obj.subheading === 'string' ? obj.subheading : undefined,
          subheading: typeof obj.subheading === 'string' ? obj.subheading : undefined,
          description: typeof obj.description === 'string' ? obj.description : undefined,
        };
      }
      return {};
    }).filter(h => h.title || h.subheading || h.description);
  };

  // Parse pairing ideas
  const parsePairingIdeas = (): PairingIdea[] => {
    if (!brand?.pairing_ideas || !Array.isArray(brand.pairing_ideas)) return [];
    return (brand.pairing_ideas as unknown[]).map(item => {
      if (typeof item === 'string') return { description: item };
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        // Handle items as either array or comma-separated string
        let parsedItems: string[] | undefined;
        if (Array.isArray(obj.items)) {
          parsedItems = obj.items.filter(i => typeof i === 'string' && i.trim());
        } else if (typeof obj.items === 'string' && obj.items.trim()) {
          // If it's a string, split by comma if it has commas, otherwise treat as single item
          parsedItems = obj.items.includes(',') 
            ? obj.items.split(',').map(s => s.trim()).filter(Boolean)
            : [obj.items.trim()];
        }
        return {
          title: typeof obj.title === 'string' ? obj.title : undefined,
          items: parsedItems,
          description: typeof obj.description === 'string' ? obj.description : undefined,
        };
      }
      return {};
    }).filter(p => p.title || p.items || p.description);
  };

  // Parse FAQs
  const parseFAQs = (): FAQ[] => {
    if (!brand?.faqs || !Array.isArray(brand.faqs)) return [];
    return (brand.faqs as unknown[]).map(item => {
      if (typeof item === 'string') return { question: item };
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        return {
          question: typeof obj.question === 'string' ? obj.question : undefined,
          answer: typeof obj.answer === 'string' ? obj.answer : undefined,
        };
      }
      return {};
    }).filter(f => f.question || f.answer);
  };

  const tastingNotes = parseTastingNotes();
  const howToEnjoy = parseHowToEnjoy();
  const pairingIdeas = parsePairingIdeas();
  const faqs = parseFAQs();

  // Generate structured data for SEO
  const generateStructuredData = () => {
    if (!brand) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "Brand",
      "name": brand.brand_name,
      "description": brand.description || `Discover ${brand.brand_name} - premium spirits and beverages`,
      "url": window.location.href,
      "image": brand.image_url || brand.logo_url,
      "logo": brand.logo_url,
      ...(brand.country && { "foundingLocation": { "@type": "Country", "name": brand.country } }),
    };
  };

  if (loading) {
    return (
      <MobileLayout showSearch={false} showCheersGuide={false}>
        <div className="p-4 space-y-4">
          <Skeleton className="w-full h-56 rounded-2xl" />
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-full h-24" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!brand) {
    return (
      <MobileLayout showSearch={false} showCheersGuide={false}>
        <div className="p-4 text-center py-12">
          <p className="text-5xl mb-4">🏷️</p>
          <h1 className="text-xl font-serif font-bold mb-2">Brand Not Found</h1>
          <p className="text-muted-foreground mb-6">The brand you're looking for doesn't exist.</p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <>
      <SEOHead
        title={`${brand.brand_name} - Brand Guide & Products | BevOry`}
        description={brand.description || `Explore ${brand.brand_name} products, tasting notes, pairing ideas, and more. Discover the story behind this iconic brand.`}
        keywords={`${brand.brand_name}, ${brand.country || ''} spirits, whisky, premium beverages, tasting notes, food pairing`}
        canonical={`/brand/${brand.slug || slug}`}
        ogImage={brand.image_url || brand.logo_url || undefined}
        jsonLd={generateStructuredData() || undefined}
      />
      
      <MobileLayout showSearch={false} showCheersGuide={false}>
        <article className="pb-8" itemScope itemType="https://schema.org/Brand">
          {/* Sticky Header */}
          <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border">
            <div className="flex items-center gap-3 p-4">
              <Link to="/" className="p-2 -ml-2 hover:bg-secondary rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-serif font-bold text-lg truncate" itemProp="name">{brand.brand_name}</h1>
            </div>
          </header>

          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pt-4"
          >
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent/20 via-accent/10 to-background border border-accent/20">
              {brand.image_url && (
                <OptimizedImage
                  src={brand.image_url}
                  alt={`${brand.brand_name} brand image`}
                  width={800}
                  height={208}
                  className="w-full h-52"
                  objectFit="cover"
                  priority
                />
              )}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-background shadow-lg flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden border border-border">
                    {brand.logo_url ? (
                      <OptimizedImage
                        src={brand.logo_url}
                        alt={`${brand.brand_name} logo`}
                        width={80}
                        height={80}
                        className="w-full h-full"
                        objectFit="cover"
                      />
                    ) : (
                      <span>{brand.logo_emoji || "🏷️"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-serif font-bold leading-tight">{brand.brand_name}</h2>
                    {brand.country && (
                      <p className="text-sm text-accent font-medium mt-1" itemProp="foundingLocation">{brand.country}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      {products.length} {products.length === 1 ? 'product' : 'products'} available
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Description */}
          {brand.description && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="px-4 mt-5"
            >
              <div className="p-5 rounded-2xl bg-secondary/50 border border-border/50">
                <h3 className="font-serif font-semibold text-lg mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent" />
                  About {brand.brand_name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed" itemProp="description">
                  {brand.description}
                </p>
              </div>
            </motion.section>
          )}

          {/* Story */}
          {brand.story && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="px-4 mt-4"
            >
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                <h3 className="font-serif font-semibold text-lg mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Our Story
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {brand.story}
                </p>
              </div>
            </motion.section>
          )}

          {/* Tasting Notes */}
          {tastingNotes.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="px-4 mt-5"
            >
              <h3 className="font-serif font-semibold text-lg mb-3 flex items-center gap-2 px-1">
                <Wine className="w-5 h-5 text-accent" />
                Tasting Notes
              </h3>
              <div className="grid gap-3">
                {tastingNotes.map((note, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + i * 0.03 }}
                    className="p-4 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary/70 transition-colors"
                  >
                    {(note.title || note.name || note.note) && (
                      <h4 className="font-medium text-sm mb-1.5 text-foreground">
                        {note.title || note.name || note.note}
                      </h4>
                    )}
                    {note.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {note.description}
                      </p>
                    )}
                    {!note.description && !note.title && (note.note || note.name) && (
                      <Badge variant="secondary" className="mt-1">{note.note || note.name}</Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* How to Enjoy */}
          {howToEnjoy.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="px-4 mt-5"
            >
              <h3 className="font-serif font-semibold text-lg mb-3 flex items-center gap-2 px-1">
                <Sparkles className="w-5 h-5 text-accent" />
                How to Enjoy
              </h3>
              <div className="space-y-3">
                {howToEnjoy.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.17 + i * 0.03 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-secondary/80 to-secondary/40 border border-border/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-accent">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        {(item.title || item.subheading) && (
                          <h4 className="font-semibold text-sm mb-1.5">
                            {item.title || item.subheading}
                          </h4>
                        )}
                        {item.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Pairing Ideas */}
          {pairingIdeas.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="px-4 mt-5"
            >
              <h3 className="font-serif font-semibold text-lg mb-3 flex items-center gap-2 px-1">
                <Utensils className="w-5 h-5 text-accent" />
                Perfect Pairings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pairingIdeas.map((pairing, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.22 + i * 0.03 }}
                    className="p-4 rounded-xl bg-secondary/50 border border-border/50 hover:border-accent/30 transition-all"
                  >
                    {pairing.title && (
                      <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                        <span className="text-base">🍽️</span>
                        {pairing.title}
                      </h4>
                    )}
                    {pairing.items && pairing.items.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {pairing.items.slice(0, 6).map((item, j) => (
                          <Badge 
                            key={j} 
                            variant="outline" 
                            className="text-xs font-normal bg-background/50"
                          >
                            {item}
                          </Badge>
                        ))}
                        {pairing.items.length > 6 && (
                          <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
                            +{pairing.items.length - 6} more
                          </Badge>
                        )}
                      </div>
                    )}
                    {pairing.description && !pairing.items && (
                      <p className="text-sm text-muted-foreground">{pairing.description}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Why Choose */}
          {brand.why_choose && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="px-4 mt-5"
            >
              <div className="p-5 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/25">
                <h3 className="font-serif font-semibold text-lg mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  Why Choose {brand.brand_name}?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {brand.why_choose}
                </p>
              </div>
            </motion.section>
          )}

          {/* FAQs */}
          {faqs.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="px-4 mt-5"
            >
              <h3 className="font-serif font-semibold text-lg mb-3 flex items-center gap-2 px-1">
                <HelpCircle className="w-5 h-5 text-accent" />
                Frequently Asked Questions
              </h3>
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border border-border/50 rounded-xl px-4 bg-secondary/30 data-[state=open]:bg-secondary/50"
                  >
                    <AccordionTrigger className="text-sm font-medium text-left hover:no-underline py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.section>
          )}

          {/* Final Verdict */}
          {brand.final_verdict && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="px-4 mt-5"
            >
              <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/15 to-emerald-500/5 border border-green-500/25">
                <h3 className="font-serif font-semibold text-lg mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-500" />
                  Final Verdict
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {brand.final_verdict}
                </p>
              </div>
            </motion.section>
          )}

          {/* External Link */}
          {brand.link_url && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="px-4 mt-5"
            >
              <a
                href={brand.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors border border-border/50"
              >
                <span className="font-medium text-sm">Visit Official Website</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            </motion.section>
          )}

          {/* Products Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-8"
          >
            <div className="px-4 mb-4">
              <h3 className="font-serif font-semibold text-lg flex items-center gap-2">
                <span>🥃</span> Products by {brand.brand_name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Explore our collection of {brand.brand_name} products
              </p>
            </div>

            {products.length > 0 ? (
              <div className="px-4 space-y-2">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.38 + index * 0.02 }}
                  >
                    <Link to={generateProductUrlStatic(product, selectedState?.name)}>
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 transition-all group">
                        <div className="w-16 h-16 rounded-xl bg-background flex items-center justify-center text-3xl flex-shrink-0 shadow-sm border border-border/50">
                          {product.image_emoji || "🥃"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1 group-hover:text-accent transition-colors">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {product.category && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {product.category.emoji} {product.category.name}
                              </Badge>
                            )}
                            {product.volume && (
                              <span className="text-xs text-muted-foreground">{product.volume}</span>
                            )}
                            {product.abv && (
                              <span className="text-xs text-muted-foreground">{product.abv}%</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              {product.rating && (
                                <>
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  <span className="text-xs font-medium">{product.rating}</span>
                                  {product.review_count && (
                                    <span className="text-xs text-muted-foreground">({product.review_count})</span>
                                  )}
                                </>
                              )}
                            </div>
                            {product.price && (
                              <span className="text-sm font-bold text-accent">
                                ₹{product.price.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-accent transition-colors" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-12 text-center">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-muted-foreground text-sm">
                  No products found for this brand yet
                </p>
              </div>
            )}
          </motion.section>
        </article>
      </MobileLayout>
    </>
  );
};

export default BrandDetail;
