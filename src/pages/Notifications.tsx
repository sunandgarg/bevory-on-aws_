import { Bell, Check, Trash2, CheckCheck, BookOpen, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import MobileLayout from "@/components/layout/MobileLayout";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "@/hooks/useLocation";
import { citySlugFromName } from "@/lib/locations";

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification, unreadCount } =
    useNotifications();
  const { selectedCity } = useLocation();
  const citySlug = citySlugFromName(selectedCity?.name) || "gurgaon";

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "article":
        return <BookOpen className="w-5 h-5 text-accent" />;
      case "announcement":
        return <Megaphone className="w-5 h-5 text-accent" />;
      default:
        return <Bell className="w-5 h-5 text-accent" />;
    }
  };

  const getNotificationLink = (n: { related_type: string | null; related_id: string | null }) => {
    if (!n.related_id) return null;
    switch (n.related_type) {
      case "blog_post":
        return `/guide/${n.related_id}`;
      case "product":
        return `/${citySlug}/product/${n.related_id}`;
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <MobileLayout title="Notifications" showBack>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout title="Notifications" showBack>
        <div className="p-4 text-center py-12">
          <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-serif font-bold mb-2">Sign in Required</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to view your notifications
          </p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Notifications" showBack>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-accent" />
            <h1 className="text-xl font-serif font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const link = getNotificationLink(n);
              const content = (
                <div
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border transition-colors",
                    n.is_read
                      ? "bg-card border-border"
                      : "bg-accent/5 border-accent/20"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={cn("font-semibold", !n.is_read && "text-accent")}>
                        {n.title}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(n.created_at), "MMM d")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {n.message}
                    </p>
                  </div>
                </div>
              );

              return (
                <div key={n.id} className="relative">
                  {link ? (
                    <Link to={link} onClick={() => !n.is_read && markAsRead(n.id)}>
                      {content}
                    </Link>
                  ) : (
                    <div onClick={() => !n.is_read && markAsRead(n.id)}>{content}</div>
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {!n.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markAsRead(n.id);
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Notifications;
