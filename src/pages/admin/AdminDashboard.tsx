import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  FileUp,
  MapPin,
  Package,
  Plus,
  Settings,
  Sparkles,
  Star,
  Tag,
  Users,
  Video,
  Wine,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  products: number;
  categories: number;
  cities: number;
  users: number;
  reviews: number;
  articles: number;
  videos: number;
  brands: number;
  cocktails: number;
}

interface RecentActivity {
  id: string;
  kind: "Review" | "Article";
  title: string;
  createdAt: string;
}

const initialStats: DashboardStats = {
  products: 0,
  categories: 0,
  cities: 0,
  users: 0,
  reviews: 0,
  articles: 0,
  videos: 0,
  brands: 0,
  cocktails: 0,
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(initialStats);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setLoadError(false);

      const results = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("cities").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("product_reviews").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
        supabase.from("video_reviews").select("id", { count: "exact", head: true }),
        supabase.from("brand_spotlights").select("id", { count: "exact", head: true }),
        supabase.from("cocktails").select("id", { count: "exact", head: true }),
        supabase
          .from("product_reviews")
          .select("id, created_at, title, reviewer_name, rating")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("blog_posts")
          .select("id, created_at, title")
          .order("created_at", { ascending: false })
          .limit(4),
      ]);

      if (results.some((result) => result.error)) {
        setLoadError(true);
      }

      setStats({
        products: results[0].count ?? 0,
        categories: results[1].count ?? 0,
        cities: results[2].count ?? 0,
        users: results[3].count ?? 0,
        reviews: results[4].count ?? 0,
        articles: results[5].count ?? 0,
        videos: results[6].count ?? 0,
        brands: results[7].count ?? 0,
        cocktails: results[8].count ?? 0,
      });

      const reviews: RecentActivity[] = (results[9].data ?? []).map((review) => ({
        id: review.id,
        kind: "Review",
        title: review.title || `${review.rating}★ review by ${review.reviewer_name || "Anonymous"}`,
        createdAt: review.created_at,
      }));
      const articles: RecentActivity[] = (results[10].data ?? []).map((article) => ({
        id: article.id,
        kind: "Article",
        title: article.title,
        createdAt: article.created_at,
      }));

      setRecentActivity(
        [...reviews, ...articles]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6),
      );
      setLoading(false);
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-7">
        <Skeleton className="h-20 w-full max-w-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-36 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const primaryStats = [
    { label: "Products", value: stats.products, icon: Package, href: "/admin/products", tone: "bg-blue-50 text-blue-700" },
    { label: "Categories", value: stats.categories, icon: Tag, href: "/admin/categories", tone: "bg-emerald-50 text-emerald-700" },
    { label: "Cities", value: stats.cities, icon: MapPin, href: "/admin/locations", tone: "bg-orange-50 text-orange-700" },
    { label: "Users", value: stats.users, icon: Users, href: "/admin/users", tone: "bg-violet-50 text-violet-700" },
  ];

  const contentStats = [
    { label: "Reviews", value: stats.reviews, icon: Star, href: "/admin/reviews" },
    { label: "Articles", value: stats.articles, icon: BookOpen, href: "/admin/blog" },
    { label: "Videos", value: stats.videos, icon: Video, href: "/admin/video-reviews" },
    { label: "Brands", value: stats.brands, icon: Sparkles, href: "/admin/brands" },
    { label: "Cocktails", value: stats.cocktails, icon: Wine, href: "/admin/cocktails" },
  ];

  const setupItems = [
    {
      complete: stats.categories > 0,
      title: "Create product categories",
      description: "Categories should be added before importing products.",
      href: "/admin/categories",
      action: "Add categories",
    },
    {
      complete: stats.products > 0,
      title: "Add your product catalog",
      description: "Add products manually or import them in bulk.",
      href: stats.categories > 0 ? "/admin/bulk-upload" : "/admin/categories",
      action: stats.categories > 0 ? "Import products" : "Start with categories",
    },
    {
      complete: stats.cities > 0,
      title: "Check service locations",
      description: "Make sure every supported city is visible and correctly ordered.",
      href: "/admin/locations",
      action: "Review locations",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge variant="secondary" className="mb-3 px-3 py-1 text-sm">
            Admin overview
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome back</h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
            Manage the catalog, content, users, and settings from one simple workspace.
          </p>
        </div>
        <Button asChild size="lg" className="min-h-12 rounded-xl px-5 text-base">
          <Link to="/admin/products">
            <Plus className="mr-2 h-5 w-5" />
            Add product
          </Link>
        </Button>
      </section>

      {loadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Some dashboard information could not be loaded.</p>
            <p className="text-base">Refresh the page or check the database connection.</p>
          </div>
        </div>
      )}

      <section aria-labelledby="key-numbers">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="key-numbers" className="text-2xl font-semibold">Key numbers</h2>
          <span className="text-base text-muted-foreground">Live database totals</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {primaryStats.map((stat) => (
            <Link key={stat.label} to={stat.href} className="group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="h-full rounded-2xl border-border/80 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.tone}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <p className="mt-5 text-4xl font-bold tracking-tight">{stat.value.toLocaleString()}</p>
                  <p className="mt-1 text-base font-medium text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Get the site ready</CardTitle>
            <CardDescription className="text-base">
              Complete these core setup steps in order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {setupItems.map((item, index) => (
              <div
                key={item.title}
                className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    item.complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {item.complete ? <CheckCircle2 className="h-6 w-6" /> : <span className="text-lg font-bold">{index + 1}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">{item.title}</p>
                    {item.complete && <Badge className="bg-emerald-600">Done</Badge>}
                  </div>
                  <p className="mt-1 text-base text-muted-foreground">{item.description}</p>
                </div>
                <Button asChild variant={item.complete ? "outline" : "default"} className="min-h-11 rounded-xl text-base">
                  <Link to={item.href}>{item.complete ? "Review" : item.action}</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Quick actions</CardTitle>
            <CardDescription className="text-base">Common tasks, one click away.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              { label: "Add a product", description: "Create one catalog item", icon: Plus, href: "/admin/products" },
              { label: "Import data", description: "Upload products in bulk", icon: FileUp, href: "/admin/bulk-upload" },
              { label: "Manage prices", description: "Update city-level pricing", icon: Package, href: "/admin/prices" },
              { label: "Open settings", description: "Configure the application", icon: Settings, href: "/admin/settings" },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="group flex min-h-[72px] items-center gap-4 rounded-xl border border-border p-4 hover:border-primary/30 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold">{action.label}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Content overview</CardTitle>
            <CardDescription className="text-base">Published and submitted content totals.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {contentStats.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="group flex min-h-14 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="flex items-center gap-3 text-base font-medium">
                  <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  {item.label}
                </span>
                <span className="text-xl font-bold">{item.value.toLocaleString()}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Recent activity</CardTitle>
            <CardDescription className="text-base">Newest reviews and articles.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map((activity) => (
                  <div key={`${activity.kind}-${activity.id}`} className="flex min-h-16 items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                    <Badge variant="outline" className="shrink-0 text-sm">{activity.kind}</Badge>
                    <p className="min-w-0 flex-1 truncate text-base font-medium">{activity.title}</p>
                    <time className="hidden shrink-0 text-sm text-muted-foreground sm:block">
                      {new Date(activity.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </time>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
                <BookOpen className="h-9 w-9 text-muted-foreground" />
                <p className="mt-3 text-lg font-semibold">No activity yet</p>
                <p className="mt-1 text-base text-muted-foreground">New reviews and articles will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AdminDashboard;
