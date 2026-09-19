import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LocationProvider } from "@/hooks/useLocation";
import { AuthProvider } from "@/hooks/useAuth";
import { CompareProvider, CompareFloatingBar, CompareSheet } from "@/components/home/CompareProducts";
import AgeVerificationModal from "@/components/home/AgeVerificationModal";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CITY_SLUGS } from "@/lib/locations";

// Critical pages — loaded eagerly
import CityHome from "./pages/CityHome";
import Auth from "./pages/Auth";

// Lazy-loaded pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Search = lazy(() => import("./pages/Search"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryDetail = lazy(() => import("./pages/CategoryDetail"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const BrandDetail = lazy(() => import("./pages/BrandDetail"));
const PartyPlanner = lazy(() => import("./pages/PartyPlanner"));
const Cocktails = lazy(() => import("./pages/Cocktails"));
const Guide = lazy(() => import("./pages/Guide"));
const GuideArticle = lazy(() => import("./pages/GuideArticle"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Favorites = lazy(() => import("./pages/Favorites"));
const RecentSearches = lazy(() => import("./pages/RecentSearches"));
const SavedLocations = lazy(() => import("./pages/SavedLocations"));
const Notifications = lazy(() => import("./pages/Notifications"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Brands = lazy(() => import("./pages/Brands"));
const Masterclass = lazy(() => import("./pages/Masterclass"));
const VideoDetail = lazy(() => import("./pages/VideoDetail"));
const CreatorProfile = lazy(() => import("./pages/CreatorProfile"));

// Admin — always lazy
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductPrices = lazy(() => import("./pages/admin/AdminProductPrices"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminSubCategories = lazy(() => import("./pages/admin/AdminSubCategories"));
const AdminLocations = lazy(() => import("./pages/admin/AdminLocations"));
const AdminParty = lazy(() => import("./pages/admin/AdminParty"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBrands = lazy(() => import("./pages/admin/AdminBrands"));
const AdminCocktails = lazy(() => import("./pages/admin/AdminCocktails"));
const AdminMagazine = lazy(() => import("./pages/admin/AdminMagazine"));
const AdminCheersGuide = lazy(() => import("./pages/admin/AdminCheersGuide"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));
const AdminHelpSupport = lazy(() => import("./pages/admin/AdminHelpSupport"));
const AdminBranding = lazy(() => import("./pages/admin/AdminBranding"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSitemap = lazy(() => import("./pages/admin/AdminSitemap"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminVideoReviews = lazy(() => import("./pages/admin/AdminVideoReviews"));
const AdminVideoCreators = lazy(() => import("./pages/admin/AdminVideoCreators"));
const AdminTypography = lazy(() => import("./pages/admin/AdminTypography"));
const AdminBulkUpload = lazy(() => import("./pages/admin/AdminBulkUpload"));
const AdminDatabaseTools = lazy(() => import("./pages/admin/AdminDatabaseTools"));
const AdminAISettings = lazy(() => import("./pages/admin/AdminAISettings"));
const AdminPerformanceReport = lazy(() => import("./pages/admin/AdminPerformanceReport"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const Contact = lazy(() => import("./pages/Contact"));

// Optimized QueryClient with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — don't refetch unless stale
      gcTime: 30 * 60 * 1000, // 30 min — keep in cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="space-y-3 w-full max-w-sm px-4">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-64 mx-auto" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LocationProvider>
          <CompareProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AgeVerificationModal />
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/gurgaon" replace />} />

                  {CITY_SLUGS.map(city => (
                    <Route key={city} path={`/${city}`} element={<CityHome citySlug={city} />} />
                  ))}

                  <Route path="/auth" element={<Auth />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/category/:slug/:subCategorySlug" element={<CategoryDetail />} />
                  <Route path="/category/:slug" element={<CategoryDetail />} />
                  <Route path="/:citySlug/category/:slug/:subCategorySlug" element={<CategoryDetail />} />
                  <Route path="/:citySlug/category/:slug" element={<CategoryDetail />} />
                  <Route path="/:citySlug/product/:slug/:volume" element={<ProductDetail />} />
                  <Route path="/:citySlug/product/:slug" element={<ProductDetail />} />
                  <Route path="/:citySlug/brand/:slug" element={<BrandDetail />} />
                  <Route path="/:state/:category/:subcategory/:productSlug" element={<ProductDetail />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/bevory/:state/:category/:subcategory/:productSlug" element={<ProductDetail />} />
                  <Route path="/brand/:slug" element={<BrandDetail />} />
                  <Route path="/brands" element={<Brands />} />
                  <Route path="/party-planner" element={<PartyPlanner />} />
                  <Route path="/cocktails" element={<Cocktails />} />
                  <Route path="/cocktail/:slug" element={<Cocktails />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/recent" element={<RecentSearches />} />
                  <Route path="/locations" element={<SavedLocations />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/help" element={<HelpSupport />} />
                  <Route path="/guide" element={<Guide />} />
                  <Route path="/guide/:slug" element={<GuideArticle />} />
                  <Route path="/masterclass" element={<Masterclass />} />
                  <Route path="/masterclass/:slug" element={<VideoDetail />} />
                  <Route path="/creator/:slug" element={<CreatorProfile />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/disclaimer" element={<Disclaimer />} />
                  <Route path="/contact" element={<Contact />} />

                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="prices" element={<AdminProductPrices />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="sub-categories" element={<AdminSubCategories />} />
                    <Route path="locations" element={<AdminLocations />} />
                    <Route path="party" element={<AdminParty />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="brands" element={<AdminBrands />} />
                    <Route path="cocktails" element={<AdminCocktails />} />
                    <Route path="magazine" element={<AdminMagazine />} />
                    <Route path="cheers-guide" element={<AdminCheersGuide />} />
                    <Route path="blog" element={<AdminBlog />} />
                    <Route path="announcements" element={<AdminAnnouncements />} />
                    <Route path="help-support" element={<AdminHelpSupport />} />
                    <Route path="branding" element={<AdminBranding />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="sitemap" element={<AdminSitemap />} />
                    <Route path="video-reviews" element={<AdminVideoReviews />} />
                    <Route path="video-creators" element={<AdminVideoCreators />} />
                    <Route path="typography" element={<AdminTypography />} />
                    <Route path="bulk-upload" element={<AdminBulkUpload />} />
                    <Route path="database" element={<AdminDatabaseTools />} />
                    <Route path="ai-settings" element={<AdminAISettings />} />
                    <Route path="performance-report" element={<AdminPerformanceReport />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <CompareFloatingBar />
              <CompareSheet />
            </BrowserRouter>
          </CompareProvider>
        </LocationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
