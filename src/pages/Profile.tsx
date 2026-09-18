import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Settings,
  Heart,
  Clock,
  MapPin,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";
import BrandingDisplay from "@/components/layout/BrandingDisplay";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, isAdmin, signOut, loading } = useAuth();
  const { selectedCity } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "See you next time!",
    });
    navigate("/");
  };

  const menuItems = [
    { icon: Settings, label: "Settings", path: "/settings", badge: null },
    { icon: Heart, label: "Favorites", path: "/favorites", badge: null },
    { icon: Clock, label: "Recent Searches", path: "/recent", badge: null },
    { icon: MapPin, label: "Saved Locations", path: "/locations", badge: selectedCity?.name },
    { icon: Bell, label: "Notifications", path: "/notifications", badge: null },
    { icon: HelpCircle, label: "Help & Support", path: "/help", badge: null },
  ];

  if (loading) {
    return (
      <MobileLayout title="Profile" showLocation={false}>
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Profile" showLocation={false}>
      <div className="p-4 space-y-6">
        {user ? (
          <>
            {/* User Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border"
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="w-8 h-8 text-accent" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-foreground">
                  {user.user_metadata?.full_name || "Bevory User"}
                </h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
            </motion.div>

            {/* Admin Panel Link */}
            {isAdmin && (
              <Link to="/admin">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-accent/10 border border-accent/20"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <Shield className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Admin Panel</h3>
                    <p className="text-sm text-muted-foreground">Manage products, prices & more</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </Link>
            )}

            {/* Menu Items */}
            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  <Link to={item.path}>
                    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary transition-colors">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Sign Out */}
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-xl font-serif font-bold mb-2">Join Bevory</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to save favorites, track prices, and get personalized recommendations
            </p>
            <Link to="/auth">
              <Button size="lg" className="w-full bg-accent text-accent-foreground">
                Sign In or Create Account
              </Button>
            </Link>
          </motion.div>
        )}

        {/* App Info */}
        <div className="text-center pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BrandingDisplay variant="header" />
          </div>
          <p className="text-xs text-muted-foreground">Version 1.0.0</p>
          <p className="text-xs text-muted-foreground mt-2">
            Know Before You Drink • 25+ Only
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Profile;
