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
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter, useSidebar,
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

const AdminSidebar = ({ email }: { email?: string }) => {
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

  const initials = email ? email.slice(0, 2).toUpperCase() : "AD";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-background">
      <SidebarHeader className="px-4 py-5">
        <Link to="/admin" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20 shrink-0">
            <div className="w-4 h-4 border-2 border-primary-foreground rounded-sm" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-base tracking-tight text-foreground">Admin</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Bevory</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navGroups.map((group) => {
          const hasActive = group.items.some((i) => pathname === i.path);
          const isOpen = collapsed ? true : (openGroups[group.label] ?? hasActive);
          return (
            <SidebarGroup key={group.label} className="py-2">
              {!collapsed ? (
                <Collapsible
                  open={isOpen}
                  onOpenChange={(o) => setOpenGroups((p) => ({ ...p, [group.label]: o }))}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="flex items-center justify-between cursor-pointer text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground px-3 mb-1">
                      <span>{group.label}</span>
                      <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton
                              asChild
                              isActive={pathname === item.path}
                              className="h-9 rounded-lg data-[active=true]:bg-primary/8 data-[active=true]:text-primary data-[active=true]:font-medium"
                            >
                              <NavLink to={item.path} end={item.path === "/admin"}>
                                <item.icon className="w-4 h-4" />
                                <span className="text-sm">{item.label}</span>
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
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.path}
                          tooltip={item.label}
                          className="h-9 rounded-lg data-[active=true]:bg-primary/8 data-[active=true]:text-primary"
                        >
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

      {!collapsed && (
        <SidebarFooter className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-full bg-secondary text-foreground/70 flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-semibold truncate">Admin User</span>
              <span className="text-[10px] text-muted-foreground truncate">{email}</span>
            </div>
          </div>
        </SidebarFooter>
      )}
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
      <div className="min-h-screen flex w-full bg-[hsl(var(--background))]" style={{ background: "#fafbfc" }}>
        <AdminSidebar email={user?.email} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 h-16 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between h-full px-6 lg:px-10">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-secondary rounded-full" />
                <Link
                  to="/"
                  className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground"
                  title="Back to site"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="w-px h-6 bg-border" />
                <h1 className="text-base font-semibold tracking-tight">Admin Console</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end leading-tight">
                  <span className="text-xs font-medium text-foreground">Admin User</span>
                  <span className="text-[11px] text-muted-foreground">{user?.email}</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-secondary text-foreground/70 flex items-center justify-center text-xs font-bold">
                  {user?.email?.slice(0, 2).toUpperCase() ?? "AD"}
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 w-full">
            <div className="p-6 lg:p-10 max-w-[1600px] w-full mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
