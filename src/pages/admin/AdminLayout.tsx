import { useEffect, useState } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Package, MapPin, Tag, PartyPopper, Users, LayoutDashboard,
  ArrowLeft, Sparkles, Wine, BookOpen, CircleDot, Megaphone,
  HelpCircle, Palette, Star, Flag, FileText, Settings, PlayCircle, Layers, DollarSign, Upload,
  Database, Brain, Activity, ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navGroups = [
  {
    label: "Overview",
    items: [{ icon: LayoutDashboard, label: "Dashboard", path: "/admin" }],
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
    ],
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
    ],
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
    ],
  },
];

const AdminSidebar = () => {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      init[g.label] = g.items.some((i) => pathname === i.path) || g.label === "Overview";
    });
    return init;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {navGroups.map((group) => {
          const hasActive = group.items.some((i) => pathname === i.path);
          const isOpen = collapsed ? true : (openGroups[group.label] ?? hasActive);
          return (
            <SidebarGroup key={group.label}>
              {!collapsed ? (
                <Collapsible
                  open={isOpen}
                  onOpenChange={(o) => setOpenGroups((p) => ({ ...p, [group.label]: o }))}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-foreground">
                      <span>{group.label}</span>
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton asChild isActive={pathname === item.path}>
                              <NavLink to={item.path} end={item.path === "/admin"}>
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild isActive={pathname === item.path} tooltip={item.label}>
                          <NavLink to={item.path} end={item.path === "/admin"}>
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
};

const AdminLayout = () => {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [isAdmin, loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 bg-background border-b border-border">
            <div className="flex items-center justify-between h-12 px-3">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Link to="/" className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="w-px h-5 bg-border" />
                <h1 className="text-sm font-semibold">Admin</h1>
              </div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </header>
          <main className="p-4 max-w-[1400px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
