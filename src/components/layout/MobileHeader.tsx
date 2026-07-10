import { memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronLeft, Settings } from "lucide-react";
import LocationSelectorNew from "@/components/LocationSelectorNew";
import BrandingDisplay from "@/components/layout/BrandingDisplay";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

interface MobileHeaderProps {
  title?: string;
  showLocation?: boolean;
  showBack?: boolean;
}

const MobileHeader = memo(({ title, showLocation = true, showBack = false }: MobileHeaderProps) => {
  const { isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left */}
        <div className="flex items-center gap-2">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <BrandingDisplay variant="header" />
          )}
          {title && <h1 className="text-base font-semibold truncate">{title}</h1>}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          {showLocation && <LocationSelectorNew />}
          
          {isAdmin && (
            <Link
              to="/admin"
              className="p-2 rounded-lg hover:bg-secondary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Admin panel"
            >
              <Settings className="w-[18px] h-[18px] text-muted-foreground" />
            </Link>
          )}
          
          <Link 
            to="/notifications" 
            className="p-2 rounded-lg hover:bg-secondary transition-colors relative min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px] text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
});

MobileHeader.displayName = "MobileHeader";
export default MobileHeader;
