import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Moon,
  Sun,
  Monitor,
  User,
  Mail,
  Lock,
  Trash2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";

type Theme = "light" | "dark" | "system";

interface UserPreferences {
  theme: Theme;
  notifications: {
    announcements: boolean;
    priceAlerts: boolean;
    newProducts: boolean;
    email: boolean;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  notifications: {
    announcements: true,
    priceAlerts: true,
    newProducts: false,
    email: false,
  },
};

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch user preferences from dedicated table
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await apiClient
          .from("user_preferences")
          .select("preferences")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.preferences) {
          const savedPrefs = data.preferences as unknown as UserPreferences;
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...savedPrefs,
            notifications: { ...DEFAULT_PREFERENCES.notifications, ...savedPrefs.notifications },
          });
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  // Apply theme
  useEffect(() => {
    const applyTheme = (theme: Theme) => {
      const root = document.documentElement;
      
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.toggle("dark", systemTheme === "dark");
      } else {
        root.classList.toggle("dark", theme === "dark");
      }
    };

    applyTheme(preferences.theme);
  }, [preferences.theme]);

  const savePreferences = async (newPreferences: UserPreferences) => {
    if (!user) return;

    setSaving(true);
    try {
      const { data: existing } = await apiClient
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const preferences = JSON.parse(JSON.stringify(newPreferences));

      if (existing) {
        await apiClient
          .from("user_preferences")
          .update({ preferences, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      } else {
        await apiClient
          .from("user_preferences")
          .insert([{ user_id: user.id, preferences }]);
      }

      toast({ title: "Settings saved" });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const updateNotifications = (key: keyof UserPreferences["notifications"], value: boolean) => {
    const newPreferences = {
      ...preferences,
      notifications: { ...preferences.notifications, [key]: value },
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  if (authLoading || loading) {
    return (
      <MobileLayout title="Settings" showLocation={false}>
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout title="Settings" showLocation={false}>
        <div className="p-4 text-center py-12">
          <p className="text-muted-foreground mb-4">Please sign in to access settings</p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Settings" showLocation={false}>
      <div className="p-4 space-y-6">
        {/* Back to Profile */}
        <Link to="/profile" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Profile</span>
        </Link>

        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sun className="w-5 h-5 text-accent" />
                Appearance
              </CardTitle>
              <CardDescription>
                Choose your preferred theme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={preferences.theme}
                onValueChange={(value: Theme) => updatePreferences({ theme: value })}
                className="space-y-3"
              >
                <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor="theme-light" className="cursor-pointer">Light</Label>
                  </div>
                  <RadioGroupItem value="light" id="theme-light" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor="theme-dark" className="cursor-pointer">Dark</Label>
                  </div>
                  <RadioGroupItem value="dark" id="theme-dark" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor="theme-system" className="cursor-pointer">System</Label>
                  </div>
                  <RadioGroupItem value="system" id="theme-system" />
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5 text-accent" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage what notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Announcements</p>
                  <p className="text-xs text-muted-foreground">News and updates from Bevory</p>
                </div>
                <Switch
                  checked={preferences.notifications.announcements}
                  onCheckedChange={(v) => updateNotifications("announcements", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Price Alerts</p>
                  <p className="text-xs text-muted-foreground">Get notified when prices drop</p>
                </div>
                <Switch
                  checked={preferences.notifications.priceAlerts}
                  onCheckedChange={(v) => updateNotifications("priceAlerts", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">New Products</p>
                  <p className="text-xs text-muted-foreground">Be first to know about new arrivals</p>
                </div>
                <Switch
                  checked={preferences.notifications.newProducts}
                  onCheckedChange={(v) => updateNotifications("newProducts", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={preferences.notifications.email}
                  onCheckedChange={(v) => updateNotifications("email", v)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-accent" />
                Account
              </CardTitle>
              <CardDescription>
                Manage your account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Email</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Password</p>
                    <p className="text-xs text-muted-foreground">Change your password</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full" disabled>
                Delete Account
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Contact support to delete your account
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {saving && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-background border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Settings;
