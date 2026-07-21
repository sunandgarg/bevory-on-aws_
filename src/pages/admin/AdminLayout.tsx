import { useEffect, type CSSProperties } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Brain,
  CircleDot,
  Database,
  DollarSign,
  FileText,
  Flag,
  HelpCircle,
  Layers,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Package,
  Palette,
  PartyPopper,
  PlayCircle,
  Settings,
  Sparkles,
  Star,
  Tag,
  Upload,
  Users,
  Wine,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navGroups = [
  {
    label: "Overview",
    items: [{ icon: LayoutDashboard, label: "Dashboard", path: "/admin" }],
  },
  {
    label: "Catalog",
    items: [
      { icon: Package, label: "Products", path: "/admin/products" },
      { icon: DollarSign, label: "Product prices", path: "/admin/prices" },
      { icon: Tag, label: "Categories", path: "/admin/categories" },
      { icon: Layers, label: "Sub-categories", path: "/admin/sub-categories" },
      { icon: Sparkles, label: "Brands", path: "/admin/brands" },
      { icon: Upload, label: "Import data", path: "/admin/bulk-upload" },
    ],
  },
  {
    label: "Content",
    items: [
      { icon: Wine, label: "Cocktails", path: "/admin/cocktails" },
      { icon: BookOpen, label: "Articles", path: "/admin/blog" },
      { icon: CircleDot, label: "Cheers guide", path: "/admin/cheers-guide" },
      { icon: Star, label: "Reviews", path: "/admin/reviews" },
      { icon: PlayCircle, label: "Videos", path: "/admin/video-reviews" },
      { icon: Users, label: "Creators", path: "/admin/video-creators" },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: Users, label: "Users & access", path: "/admin/users" },
      { icon: MapPin, label: "Locations", path: "/admin/locations" },
      { icon: PartyPopper, label: "Party planner", path: "/admin/party" },
      { icon: Megaphone, label: "Announcements", path: "/admin/announcements" },
      { icon: Flag, label: "Reports", path: "/admin/reports" },
    ],
  },
  {
    label: "Settings",
    items: [
      { icon: Settings, label: "General settings", path: "/admin/settings" },
      { icon: Palette, label: "Brand appearance", path: "/admin/branding" },
      { icon: Brain, label: "AI settings", path: "/admin/ai-settings" },
      { icon: FileText, label: "SEO & sitemap", path: "/admin/sitemap" },
      { icon: Database, label: "Database tools", path: "/admin/database" },
      { icon: Activity, label: "Performance", path: "/admin/performance-report" },
      { icon: HelpCircle, label: "Help & support", path: "/admin/help-support" },
    ],
  },
] as const;

const allNavItems = navGroups.flatMap((group) => group.items);

const AdminSidebar = ({ email }: { email?: string }) => {
  const { pathname } = useLocation();
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const initials = email ? email.slice(0, 2).toUpperCase() : "AD";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-background">
      <SidebarHeader className="px-2 py-3">
        <Link
          to="/admin"
          className="flex min-h-10 items-center gap-2.5 rounded-lg px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/20">
            <div className="h-3.5 w-3.5 rounded-sm border-2 border-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-foreground">Bevory</span>
              <span className="text-xs font-medium text-muted-foreground">Admin</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar px-2 pb-4">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1.5">
            {!collapsed && (
              <SidebarGroupLabel className="mb-1 h-6 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.path}
                      tooltip={item.label}
                      className="h-10 rounded-lg px-2.5 text-sm data-[active=true]:bg-primary/10 data-[active=true]:font-semibold data-[active=true]:text-primary"
                    >
                      <NavLink
                        to={item.path}
                        end={item.path === "/admin"}
                        onClick={() => isMobile && setOpenMobile(false)}
                      >
                        <item.icon className="h-[18px] w-[18px]" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="border-t border-border p-3">
          <div className="flex min-h-12 items-center gap-2.5 rounded-lg bg-muted/60 px-2.5 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold">Administrator</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
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
  const { pathname } = useLocation();
  const currentPage = allNavItems.find((item) => item.path === pathname)?.label ?? "Admin";

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [isAdmin, loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <SidebarProvider style={{ "--sidebar-width": "15rem" } as CSSProperties}>
      <div className="admin-shell flex min-h-screen w-full bg-[#f7f8fa]">
        <AdminSidebar email={user?.email} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur-md">
            <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-5 lg:px-6">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <SidebarTrigger
                  className="h-10 w-10 shrink-0 rounded-lg hover:bg-secondary"
                  aria-label="Open admin navigation"
                />
                <div className="hidden h-7 w-px bg-border sm:block" />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{currentPage}</p>
                  <p className="hidden text-xs text-muted-foreground sm:block">Bevory administration</p>
                </div>
              </div>

              <Link
                to="/"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-secondary"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">View website</span>
              </Link>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1440px] p-4 sm:p-5 lg:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
