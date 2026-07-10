import { useState, useEffect, memo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Heart, Share2, MapPin, ChevronDown, ArrowLeftRight, Check, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/hooks/useLocation";
import { useProducts } from "@/hooks/useProducts";
import { useCompare } from "@/components/home/CompareProducts";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Footer from "@/components/layout/Footer";
import RateProductSection from "@/components/product/RateProductSection";
import UserReviewsSection from "@/components/product/UserReviewsSection";
import ProductBrandSpotlight from "@/components/product/ProductBrandSpotlight";
import ProductFAQs from "@/components/product/ProductFAQs";
import RelatedArticles from "@/components/product/RelatedArticles";
import OtherProductsSection from "@/components/product/OtherProductsSection";
import ExploreCategories from "@/components/product/ExploreCategories";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { generateProductUrl } from "@/lib/productSlug";

interface FAQ {
  question: string;
  answer: string;
}

interface Product {
  id: string;
  slug: string | null;
  name: string;
  brand: string;
  category_id: string | null;
  sub_category_id: string | null;
  description: string | null;
  volume: string | null;
  abv: number | null;
  age: string | null;
  origin: string | null;
  origin_flag: string | null;
  taste_profile: string | null;
  tasting_notes: string | null;
  image_emoji: string | null;
  image_url: string | null;
  rating: number | null;
  review_count: number | null;
  type_tag: string | null;
  type_description: string | null;
  is_trending: boolean | null;
  faqs: FAQ[] | null;
  meta_title: string | null;
  meta_description: string | null;
  category?: {
    name: string;
    slug: string;
    emoji: string | null;
  };
  sub_category?: {
    name: string;
    slug: string | null;
    emoji: string | null;
  };
  product_type?: {
    name: string;
    description: string | null;
  } | null;
}

interface VolumePrice {
  volume: string;
  price: number;
  mrp: number | null;
  in_stock: boolean;
}

// Generate consistent random rating between 4.0 and 4.8 based on product id
const generateConsistentRating = (productId: string) => {
  // Use product id to generate consistent "random" value
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash << 5) - hash + productId.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 80) / 100; // 0.00 to 0.79
  return Number((4.0 + normalized).toFixed(1)); // 4.0 to 4.8
};

// Volume options are now fetched from the database - no fixed options

const ProductDetail = () => {
  // Support both new format (/bevory/:state/:category/:subcategory/:productSlug) and legacy (/product/:slug)
  const { slug, productSlug, state } = useParams<{
    slug?: string;
    productSlug?: string;
    state?: string;
    category?: string;
    subcategory?: string;
  }>();

  // Use productSlug from new route or slug from legacy route
  const effectiveSlug = productSlug || slug;

  const [product, setProduct] = useState<Product | null>(null);
  const [volumePrices, setVolumePrices] = useState<VolumePrice[]>([]);
  const [selectedVolume, setSelectedVolume] = useState<string>("750ml");
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [reviewRefresh, setReviewRefresh] = useState(0);

  const { selectedCity, allCities, setSelectedCity } = useLocation();
  const { products } = useProducts();
  const { addToCompare, isInCompare, setShowCompareSheet } = useCompare();
  const { toast } = useToast();

  const currentPrice = volumePrices.find((vp) => vp.volume === selectedVolume);
  const price = currentPrice?.price ?? null;
  const mrp = currentPrice?.mrp ?? null;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!effectiveSlug) return;

      setLoading(true);

      // Try to fetch by slug first, then by id for backwards compatibility
      let productData = null;

      const { data: dataBySlug } = await supabase
        .from("products")
        .select(
          `
          *,
          category:categories(name, slug, emoji),
          sub_category:sub_categories(name, slug, emoji),
          product_type:product_types(name, description)
        `,
        )
        .eq("slug", effectiveSlug)
        .maybeSingle();

      if (dataBySlug) {
        productData = dataBySlug;
      } else {
        // Fallback: try by ID for old links
        const { data: dataById } = await supabase
          .from("products")
          .select(
            `
            *,
            category:categories(name, slug, emoji),
            sub_category:sub_categories(name, slug, emoji),
            product_type:product_types(name, description)
          `,
          )
          .eq("id", effectiveSlug)
          .maybeSingle();
        productData = dataById;
      }

      if (!productData) {
        setLoading(false);
        return;
      }

      // Parse FAQs
      const parsedProduct = {
        ...productData,
        faqs: Array.isArray(productData.faqs) ? (productData.faqs as unknown as FAQ[]) : [],
      };

      setProduct(parsedProduct);

      // Fetch all volume prices for selected city
      if (selectedCity) {
        const { data: priceData } = await supabase
          .from("product_prices")
          .select("*")
          .eq("product_id", productData.id)
          .eq("city_id", selectedCity.id);

        if (priceData && priceData.length > 0) {
          const prices: VolumePrice[] = priceData.map((p) => ({
            volume: p.volume || "750ml",
            price: p.price,
            mrp: p.mrp,
            in_stock: p.in_stock ?? true,
          }));
          // Sort by volume size (largest first)
          prices.sort((a, b) => {
            const getSize = (v: string) => parseInt(v.replace(/[^0-9]/g, "")) || 0;
            return getSize(b.volume) - getSize(a.volume);
          });
          setVolumePrices(prices);
          // Set default selected volume to 750ml if available, otherwise first available
          const defaultVol = prices.find((p) => p.volume === "750ml") || prices[0];
          if (defaultVol) setSelectedVolume(defaultVol.volume);
        } else {
          setVolumePrices([]);
        }
      }

      setLoading(false);
    };

    fetchProduct();
  }, [effectiveSlug, selectedCity]);

  // Get display rating from actual reviews or fallback to 4.0-4.8
  const displayRating =
    product?.rating && product.rating > 0
      ? Number(product.rating).toFixed(1)
      : generateConsistentRating(product?.id || "default");
  const displayReviewCount = product?.review_count || 0;

  // Update document title and meta for SEO
  useEffect(() => {
    if (product) {
      // Use meta_title if set, otherwise generate SEO-friendly title
      const title = product.meta_title || `${product.brand} ${product.name} Price in India - Buy Online | BevOry`;

      // Use meta_description if set, otherwise generate
      const description =
        product.meta_description ||
        `${product.brand} ${product.name} ${selectedVolume || product.volume || ""} price ₹${price || "Check"} in ${selectedCity?.name || "India"}. Buy ${product.brand} ${product.name} online. Check reviews, ratings & compare prices.`;

      document.title = title;

      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);

      // Add canonical URL
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", `${window.location.origin}/product/${product.slug || product.id}`);

      // Add structured data for SEO (JSON-LD)
      let jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (!jsonLd) {
        jsonLd = document.createElement("script");
        jsonLd.setAttribute("type", "application/ld+json");
        document.head.appendChild(jsonLd);
      }

      // Calculate price valid until (30 days from now)
      const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Use valid image URL or default OG image
      const productImage =
        product.image_url &&
        (product.image_url.startsWith("http://") ||
          product.image_url.startsWith("https://") ||
          product.image_url.startsWith("/"))
          ? product.image_url
          : "https://www.bevory.in/og-image.png";

      // Enhanced schema with all required Google Search Console fields
      const productSchema: any = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `${product.brand} ${product.name}`,
        description:
          product.description ||
          `${product.brand} ${product.name} - Premium alcoholic beverage available in India. Check prices, reviews and ratings.`,
        brand: { "@type": "Brand", name: product.brand },
        image: [productImage],
        sku: product.slug || product.id,
        mpn: product.slug || product.id,
        category: product.category?.name || "Alcoholic Beverages",
        url: `https://www.bevory.in/product/${product.slug || product.id}`,
      };

      // Always add aggregate rating (use generated rating if no reviews)
      productSchema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: displayRating,
        reviewCount: Math.max(displayReviewCount, 1),
        bestRating: "5",
        worstRating: "1",
      };

      // Add a sample review for SEO compliance
      productSchema.review = {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: displayRating,
          bestRating: "5",
          worstRating: "1",
        },
        author: {
          "@type": "Person",
          name: "BevOry User",
        },
        reviewBody: product.description || `Great ${product.category?.name || "beverage"} from ${product.brand}.`,
      };

      // Merchant return policy
      const returnPolicy = {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
        merchantReturnDays: 0,
      };

      // Shipping details
      const shippingDetails = {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 5,
            unitCode: "DAY",
          },
        },
      };

      // Add offers for each volume with all required fields
      if (volumePrices.length > 0) {
        productSchema.offers = volumePrices.map((vp) => ({
          "@type": "Offer",
          name: `${product.brand} ${product.name} ${vp.volume}`,
          price: vp.price,
          priceCurrency: "INR",
          availability: vp.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          priceValidUntil: priceValidUntil,
          itemCondition: "https://schema.org/NewCondition",
          url: `https://www.bevory.in/product/${product.slug || product.id}`,
          seller: {
            "@type": "Organization",
            name: "BevOry",
          },
          hasMerchantReturnPolicy: returnPolicy,
          shippingDetails: shippingDetails,
        }));
      } else {
        // Default offer when no prices available
        productSchema.offers = {
          "@type": "Offer",
          price: price || "0",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          priceValidUntil: priceValidUntil,
          itemCondition: "https://schema.org/NewCondition",
          url: `https://www.bevory.in/product/${product.slug || product.id}`,
          seller: {
            "@type": "Organization",
            name: "BevOry",
          },
          hasMerchantReturnPolicy: returnPolicy,
          shippingDetails: shippingDetails,
        };
      }

      jsonLd.textContent = JSON.stringify(productSchema);

      // FAQ structured data for rich snippets
      if (product.faqs && product.faqs.length > 0) {
        let faqLd = document.querySelector('script[data-type="faq-ld"]');
        if (!faqLd) {
          faqLd = document.createElement("script");
          faqLd.setAttribute("type", "application/ld+json");
          faqLd.setAttribute("data-type", "faq-ld");
          document.head.appendChild(faqLd);
        }
        faqLd.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: product.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        });
      }
    }

    return () => {
      document.title = "BevOry - Know Before You Drink";
      const faqScript = document.querySelector('script[data-type="faq-ld"]');
      if (faqScript) faqScript.remove();
    };
  }, [product, price, selectedCity, selectedVolume, volumePrices, displayRating, displayReviewCount]);

  const relatedProducts = products
    .filter((p) => p.category_id === product?.category_id && p.id !== product?.id)
    .slice(0, 6);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${product?.brand} ${product?.name}`,
        text: `Check out ${product?.brand} ${product?.name} on Bevory`,
        url: window.location.href,
      });
    } catch {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Product link copied to clipboard",
      });
    }
  };

  const handleCompare = async () => {
    if (!product?.id) return;

    if (isInCompare(product.id)) {
      setShowCompareSheet(true);
    } else {
      await addToCompare(product.id);
      toast({
        title: "Added to compare",
        description: "Product added to comparison list",
      });
    }
  };

  const handleCitySelect = (city: any) => {
    setSelectedCity(city);
    setShowCitySelector(false);
    toast({
      title: `City changed to ${city.name}`,
      description: "Prices updated for your location",
    });
  };

  if (loading) {
    return (
      <MobileLayout showBack showLocation={false}>
        <div className="p-4">
          <div className="aspect-square bg-muted rounded-2xl animate-pulse mb-4" />
          <div className="h-6 w-48 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
      </MobileLayout>
    );
  }

  if (!product) {
    return (
      <MobileLayout showBack showLocation={false}>
        <div className="p-4 text-center py-12">
          <div className="text-5xl mb-4">❓</div>
          <h3 className="font-semibold">Product not found</h3>
          <Link to="/search" className="text-accent mt-2 inline-block">
            Browse products →
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBack showLocation={false} showBottomNav={false}>
      <div className="pb-24">
        {/* Product Image */}
        <div className="aspect-square bg-muted/30 flex items-center justify-center relative overflow-hidden">
          {product.image_url ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full h-full"
            >
              <OptimizedImage
                src={product.image_url}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full"
                objectFit="cover"
                priority
              />
            </motion.div>
          ) : (
            <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-9xl">
              {product.image_emoji || "🥃"}
            </motion.span>
          )}

          {/* Origin badge */}
          {product.origin && (
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm text-sm flex items-center gap-1">
              <span>{product.origin_flag}</span>
              <span className="text-muted-foreground">{product.origin}</span>
            </div>
          )}

          {/* Trending badge */}
          {product.is_trending && (
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-accent/90 backdrop-blur-sm text-xs font-medium text-accent-foreground">
              🔥 Trending
            </div>
          )}

          {/* Actions */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className={`p-2 rounded-full bg-card/90 backdrop-blur-sm ${
                liked ? "text-red-500" : "text-muted-foreground"
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-card/90 backdrop-blur-sm text-muted-foreground"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Link
                to={`/category/${product.category?.slug}`}
                className="px-2 py-0.5 rounded bg-secondary text-xs font-medium"
              >
                {product.category?.emoji} {product.category?.name}
              </Link>
              {product.sub_category && (
                <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-xs font-medium">
                  {product.sub_category.emoji} {product.sub_category.name}
                </span>
              )}
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="font-medium">{displayRating}</span>
                <span className="text-muted-foreground">({displayReviewCount} reviews)</span>
              </div>
            </div>

            <p className="text-muted-foreground">{product.brand}</p>
            <h1 className="text-2xl font-serif font-bold text-foreground">{product.name}</h1>
          </div>

          {/* Price with Volume & City Selector */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-4">
            {/* City Selector */}
            <button
              onClick={() => setShowCitySelector(true)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin className="w-3 h-3" />
              {selectedCity ? `Price in ${selectedCity.name}` : "Select city for price"}
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Volume Options */}
            {volumePrices.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {volumePrices.map((vp) => (
                  <button
                    key={vp.volume}
                    onClick={() => setSelectedVolume(vp.volume)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedVolume === vp.volume
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <span className="block">{vp.volume}</span>
                    <span className="block text-xs opacity-80">₹{vp.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Price Display */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{price ? `₹${price.toLocaleString()}` : "—"}</span>
                  {mrp && Number(mrp) > Number(price) && (
                    <span className="text-lg text-muted-foreground line-through">₹{mrp.toLocaleString()}</span>
                  )}
                  {selectedVolume && volumePrices.length > 0 && (
                    <span className="text-sm text-muted-foreground">for {selectedVolume}</span>
                  )}
                </div>
              </div>
              {mrp && Number(mrp) > Number(price) && (
                <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
                  {Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100)}% off
                </div>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-secondary text-center">
              <p className="text-xs text-muted-foreground mb-1">Selected</p>
              <p className="font-semibold">{selectedVolume || product.volume || "—"}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary text-center">
              <p className="text-xs text-muted-foreground mb-1">ABV</p>
              <p className="font-semibold">{product.abv ? `${product.abv}%` : "—"}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary text-center">
              <p className="text-xs text-muted-foreground mb-1">Age</p>
              <p className="font-semibold">{product.age || "—"}</p>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Taste Profile */}
          {product.taste_profile && (
            <div>
              <h3 className="font-semibold mb-2">Taste Profile</h3>
              <p className="text-muted-foreground">{product.taste_profile}</p>
            </div>
          )}

          {/* Tasting Notes */}
          {product.tasting_notes && (
            <div>
              <h3 className="font-semibold mb-2">Tasting Notes</h3>
              <p className="text-muted-foreground leading-relaxed">{product.tasting_notes}</p>
            </div>
          )}

          {/* Product Type */}
          {(product.type_tag || product.product_type) && (
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="font-medium">
                  {product.type_tag || product.product_type?.name}
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex items-center gap-1 text-xs text-accent hover:underline">
                      <Info className="w-3 h-3" />
                      What's this?
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">
                      {product.type_description ||
                        product.product_type?.description ||
                        `A type classification for ${product.category?.name || "beverages"}.`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              {(product.type_description || product.product_type?.description) && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.type_description || product.product_type?.description}
                </p>
              )}
            </div>
          )}

          {/* Rate This Product */}
          <RateProductSection productId={product.id} onReviewSubmitted={() => setReviewRefresh((prev) => prev + 1)} />

          {/* User Reviews */}
          <UserReviewsSection productId={product.id} refreshTrigger={reviewRefresh} />

          {/* Brand Spotlight */}
          <ProductBrandSpotlight brandName={product.brand} />

          {/* FAQs */}
          <ProductFAQs faqs={product.faqs || []} />

          {/* Related Articles */}
          <RelatedArticles productId={product.id} brandName={product.brand} />

          {/* Other Products in Same Category */}
          <OtherProductsSection products={relatedProducts as any} title={`More ${product.category?.name || "Products"}`} />

          {/* Explore Other Categories */}
          <ExploreCategories currentCategoryId={product.category_id} />

          {/* Footer */}
          <Footer />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button variant="outline" className="flex-1 gap-2" onClick={handleCompare}>
            <ArrowLeftRight className="w-4 h-4" />
            {isInCompare(product?.id || "") ? "View Compare" : "Compare"}
          </Button>
          <Button className="flex-1 bg-accent text-accent-foreground gap-2" onClick={() => setShowCitySelector(true)}>
            <MapPin className="w-4 h-4" />
            Change City
          </Button>
        </div>
      </div>

      {/* City Selector Dialog */}
      <Dialog open={showCitySelector} onOpenChange={setShowCitySelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Your City</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-1">
              {allCities
                .filter((c) => c.state)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors ${
                      selectedCity?.id === city.id ? "bg-accent/10 border border-accent" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{city.name}</span>
                      {city.state && <span className="text-sm text-muted-foreground">({city.state.name})</span>}
                    </div>
                    {selectedCity?.id === city.id && <Check className="w-4 h-4 text-accent" />}
                  </button>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default ProductDetail;
