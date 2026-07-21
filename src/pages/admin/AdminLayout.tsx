import { useEffect } from "react";
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
      <SidebarHeader className="px-3 py-4">
        <Link
          to="/admin"
          className="flex min-h-12 items-center gap-3 rounded-xl px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20">
            <div className="h-4 w-4 rounded-sm border-2 border-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight text-foreground">Bevory</span>
              <span className="text-sm font-medium text-muted-foreground">Admin workspace</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar px-2 pb-4">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            {!collapsed && (
              <SidebarGroupLabel className="mb-1 h-8 px-3 text-sm font-semibold text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.path}
                      tooltip={item.label}
                      className="min-h-11 rounded-xl px-3 text-base data-[active=true]:bg-primary/10 data-[active=true]:font-semibold data-[active=true]:text-primary"
                    >
                      <NavLink
                        to={item.path}
                        end={item.path === "/admin"}
                        onClick={() => isMobile && setOpenMobile(false)}
                      >
                        <item.icon className="h-5 w-5" />
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
          <div className="flex min-h-14 items-center gap-3 rounded-xl bg-muted/60 px-3 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-base font-semibold">Administrator</p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
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
    <SidebarProvider>
      <div className="admin-shell flex min-h-screen w-full bg-[#f7f8fa]">
        <AdminSidebar email={user?.email} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 h-[72px] border-b border-border bg-background/95 backdrop-blur-md">
            <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <SidebarTrigger
                  className="h-11 w-11 shrink-0 rounded-xl hover:bg-secondary"
                  aria-label="Open admin navigation"
                />
                <div className="hidden h-7 w-px bg-border sm:block" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-foreground">{currentPage}</p>
                  <p className="hidden text-sm text-muted-foreground sm:block">Bevory administration</p>
                </div>
              </div>

              <Link
                to="/"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 text-base font-medium text-foreground shadow-sm hover:bg-secondary sm:px-4"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">View website</span>
              </Link>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
