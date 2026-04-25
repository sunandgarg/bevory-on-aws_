import { useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Package, MapPin, Tag, PartyPopper, Users, LayoutDashboard, 
  ArrowLeft, Sparkles, Wine, BookOpen, CircleDot, Megaphone, 
  HelpCircle, Palette, Star, Flag, FileText, Settings, PlayCircle, Type, Layers, DollarSign, Upload,
  Database, Brain, Activity
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const AdminLayout = () => {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth");
    }
  }, [isAdmin, loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const navGroups = [
    {
      label: "Overview",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
      ]
    },
    {
      label: "Catalog",
      items: [
        { icon: Package, label: "Products", path: "/admin/products" },
        { icon: DollarSign, label: "Prices", path: "/admin/prices" },
        { icon: Tag, label: "Categories", path: "/admin/categories" },
        { icon: Layers, label: "Sub-Categories", path: "/admin/sub-categories" },
        { icon: Sparkles, label: "Brands", path: "/admin/brands" },
        { icon: Upload, label: "Bulk Upload", path: "/admin/bulk-upload" },
      ]
    },
    {
      label: "Content",
      items: [
        { icon: Wine, label: "Cocktails", path: "/admin/cocktails" },
        { icon: BookOpen, label: "Guide", path: "/admin/blog" },
        { icon: CircleDot, label: "Cheers Guide", path: "/admin/cheers-guide" },
        { icon: Star, label: "Reviews", path: "/admin/reviews" },
        { icon: PlayCircle, label: "Videos", path: "/admin/video-reviews" },
        { icon: Users, label: "Creators", path: "/admin/video-creators" },
      ]
    },
    {
      label: "System",
      items: [
        { icon: PartyPopper, label: "Party", path: "/admin/party" },
        { icon: MapPin, label: "Locations", path: "/admin/locations" },
        { icon: Megaphone, label: "Announce", path: "/admin/announcements" },
        { icon: Flag, label: "Reports", path: "/admin/reports" },
        { icon: Users, label: "Users", path: "/admin/users" },
        { icon: Palette, label: "Branding", path: "/admin/branding" },
        { icon: Settings, label: "Settings", path: "/admin/settings" },
        { icon: FileText, label: "SEO", path: "/admin/sitemap" },
        { icon: HelpCircle, label: "Help", path: "/admin/help-support" },
        { icon: Database, label: "Database", path: "/admin/database" },
        { icon: Brain, label: "AI", path: "/admin/ai-settings" },
        { icon: Activity, label: "Performance", path: "/admin/performance-report" },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="p-1.5 -ml-1.5 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-px h-5 bg-border" />
            <h1 className="text-sm font-semibold">Admin</h1>
          </div>
          <div className="text-xs text-muted-foreground">
            {user?.email}
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="sticky top-12 z-30 bg-background border-b border-border">
        <div className="flex overflow-x-auto scrollbar-hide px-2">
          {navGroups.map((group) => (
            group.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors",
                  location.pathname === item.path
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            ))
          ))}
        </div>
      </nav>

      <main className="p-4 max-w-[1400px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
