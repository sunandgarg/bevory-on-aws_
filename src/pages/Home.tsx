import { memo, lazy, Suspense } from "react";
import {
  PartyPopper,
  ArrowLeftRight,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BookOpen,
  Flame,
  Wine,
} from "lucide-react";
import { Link } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { useProducts } from "@/hooks/useProducts";
import AgeVerificationModal from "@/components/home/AgeVerificationModal";
import TrendingProducts from "@/components/home/TrendingProducts";
import Footer from "@/components/layout/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { Skeleton } from "@/components/ui/skeleton";

const BrandSpotlight = lazy(() => import("@/components/home/BrandSpotlight"));
const HomeCocktails = lazy(() => import("@/components/home/HomeCocktails"));
const BevoryGuide = lazy(() => import("@/components/home/BevoryGuide"));
const ProductReviews = lazy(() => import("@/components/home/ProductReviews"));
const VideoReviews = lazy(() => import("@/components/home/VideoReviews"));

const SectionSkeleton = () => (
  <div className="px-4 space-y-3">
    <Skeleton className="h-5 w-32" />
    <div className="flex gap-3 overflow-x-auto">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="w-40 h-48 rounded-xl flex-shrink-0" />
      ))}
    </div>
  </div>
);

const QUICK_ACTIONS = [
  { icon: TrendingUp, label: "Trending", to: "/search?sort=trending", color: "text-primary" },
  { icon: Wine, label: "Cocktails", to: "/cocktails", color: "text-accent" },
  { icon: BookOpen, label: "Guide", to: "/guide", color: "text-success" },
] as const;

const Home = () => {
  const { categories } = useProducts();

  return (
    <MobileLayout showSearch={true} showCheersGuide={true}>
      <AgeVerificationModal />

      <div className="space-y-5 pb-4">
        {/* ─── Hero Banner ─── */}
        <div className="px-4 pt-1">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-foreground to-foreground/90 p-5 text-background animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary/15 blur-2xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/15 backdrop-blur-sm text-xs font-medium mb-3">
                <Sparkles className="w-3 h-3 text-accent" />
                Know Before You Drink
              </div>
              <h1 className="text-[22px] font-bold leading-[1.2] mb-1.5 tracking-tight">
                Compare prices across{" "}
                <span className="text-accent">30 cities</span>
              </h1>
              <p className="text-sm text-background/70 mb-4 max-w-[260px]">
                Discover, compare & celebrate every pour — India's #1 beverage guide
              </p>

              <div className="flex gap-2">
                <Link
                  to="/party-planner"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold shadow-[var(--shadow-gold)] hover:brightness-110 transition-all duration-200 active:scale-[0.97]"
                >
                  <PartyPopper className="w-3.5 h-3.5" />
                  Plan a Party
                </Link>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-background/15 backdrop-blur-sm text-background text-sm font-medium hover:bg-background/25 transition-all duration-200 active:scale-[0.97]"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Compare
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Quick Actions ─── */}
        <div className="px-4">
          <div className="grid grid-cols-3 gap-2">
            {QUICK_ACTIONS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card border border-border/50 hover:border-border transition-all active:scale-[0.97]"
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ─── Categories ─── */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold">Browse Categories</h2>
            <Link
              to="/categories"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {categories.slice(0, 8).map((cat) => (
              <Link key={cat.id} to={`/category/${cat.slug}`} className="group block w-[72px] flex-shrink-0">
                <div className="w-[72px] h-[72px] rounded-2xl bg-secondary/80 border border-border/40 flex items-center justify-center text-2xl mb-1.5 overflow-hidden group-hover:border-accent/40 group-hover:shadow-[var(--shadow-sm)] transition-all duration-200">
                  {cat.image_url ? (
                    <OptimizedImage
                      src={cat.image_url}
                      alt={cat.name}
                      width={72}
                      height={72}
                      className="w-full h-full"
                      objectFit="cover"
                      placeholder="blur"
                    />
                  ) : (
                    <span className="group-hover:scale-110 transition-transform duration-200">
                      {cat.emoji || "🍸"}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-center text-muted-foreground group-hover:text-foreground truncate transition-colors">
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* ─── Trending ─── */}
        <TrendingProducts />

        {/* ─── Brand Spotlight ─── */}
        <Suspense fallback={<SectionSkeleton />}>
          <BrandSpotlight />
        </Suspense>

        {/* ─── Promotional Card ─── */}
        <div className="px-4">
          <Link
            to="/party-planner"
            className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Flame className="w-4 h-4 text-accent" />
                  <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                    Party Planner
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground mb-0.5">
                  Planning a get-together?
                </p>
                <p className="text-xs text-muted-foreground">
                  Get AI-powered drink recommendations for your budget
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-accent" />
              </div>
            </div>
          </Link>
        </div>

        {/* ─── Lazy Loaded Sections ─── */}
        <Suspense fallback={<SectionSkeleton />}>
          <HomeCocktails />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <BevoryGuide />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <ProductReviews />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <VideoReviews />
        </Suspense>

        <Footer />
      </div>
    </MobileLayout>
  );
};

export default memo(Home);
