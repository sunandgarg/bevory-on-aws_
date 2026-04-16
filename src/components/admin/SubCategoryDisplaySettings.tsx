import { useState, useEffect } from "react";
import { Save, Loader2, Tag, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export interface SubCategoryDisplaySettings {
  enabled: boolean;
  showOnProductCards: boolean;
  showOnProductDetail: boolean;
  showOnSearch: boolean;
  showEmoji: boolean;
  badgeStyle: "filled" | "outline" | "ghost";
  colorScheme: "accent" | "secondary" | "primary" | "muted";
}

const DEFAULT_SETTINGS: SubCategoryDisplaySettings = {
  enabled: true,
  showOnProductCards: true,
  showOnProductDetail: true,
  showOnSearch: true,
  showEmoji: true,
  badgeStyle: "filled",
  colorScheme: "accent",
};

const SubCategoryDisplaySettingsComponent = () => {
  const [settings, setSettings] = useState<SubCategoryDisplaySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "sub_category_display")
      .maybeSingle();

    if (data?.value) {
      setSettings({ ...DEFAULT_SETTINGS, ...(data.value as unknown as SubCategoryDisplaySettings) });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Check if settings exist first
    const { data: existing } = await supabase
      .from("app_settings")
      .select("id")
      .eq("key", "sub_category_display")
      .maybeSingle();

    const settingsJson = JSON.parse(JSON.stringify(settings));
    
    let error;
    if (existing) {
      const result = await supabase
        .from("app_settings")
        .update({ value: settingsJson })
        .eq("key", "sub_category_display");
      error = result.error;
    } else {
      const result = await supabase
        .from("app_settings")
        .insert([{
          key: "sub_category_display",
          value: settingsJson,
          description: "Sub-category badge display settings for product cards and pages",
        }]);
      error = result.error;
    }

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Settings Saved",
        description: "Sub-category display settings have been updated.",
      });
    }
  };

  const getBadgeClassName = () => {
    const styles: Record<string, Record<string, string>> = {
      filled: {
        accent: "bg-accent text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        primary: "bg-primary text-primary-foreground",
        muted: "bg-muted text-muted-foreground",
      },
      outline: {
        accent: "border-accent text-accent bg-transparent",
        secondary: "border-secondary text-secondary-foreground bg-transparent",
        primary: "border-primary text-primary bg-transparent",
        muted: "border-muted-foreground text-muted-foreground bg-transparent",
      },
      ghost: {
        accent: "bg-accent/10 text-accent border-0",
        secondary: "bg-secondary/50 text-secondary-foreground border-0",
        primary: "bg-primary/10 text-primary border-0",
        muted: "bg-muted/50 text-muted-foreground border-0",
      },
    };
    return styles[settings.badgeStyle]?.[settings.colorScheme] || styles.filled.accent;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-accent" />
          Sub-Category Badge Settings
        </CardTitle>
        <CardDescription>
          Customize how sub-category badges appear on product cards and pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <Label className="text-base font-medium">Enable Sub-Category Badges</Label>
            <p className="text-sm text-muted-foreground">
              Show sub-category badges across the site
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Display Locations */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Display Locations</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Product Cards (Trending, Home)</span>
                  <Switch
                    checked={settings.showOnProductCards}
                    onCheckedChange={(checked) => setSettings({ ...settings, showOnProductCards: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Product Detail Page</span>
                  <Switch
                    checked={settings.showOnProductDetail}
                    onCheckedChange={(checked) => setSettings({ ...settings, showOnProductDetail: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Search Results</span>
                  <Switch
                    checked={settings.showOnSearch}
                    onCheckedChange={(checked) => setSettings({ ...settings, showOnSearch: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Emoji in Badge</span>
                  <Switch
                    checked={settings.showEmoji}
                    onCheckedChange={(checked) => setSettings({ ...settings, showEmoji: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Style Options */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Badge Style
                </Label>
                <Select
                  value={settings.badgeStyle}
                  onValueChange={(value) => setSettings({ ...settings, badgeStyle: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filled">Filled</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="ghost">Ghost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color Scheme</Label>
                <Select
                  value={settings.colorScheme}
                  onValueChange={(value) => setSettings({ ...settings, colorScheme: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accent">Accent (Gold)</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="muted">Muted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Preview</Label>
              <div className="p-4 rounded-lg border border-border bg-card flex items-center gap-3">
                <Badge 
                  variant={settings.badgeStyle === "outline" ? "outline" : "default"}
                  className={getBadgeClassName() + " text-xs"}
                >
                  {settings.showEmoji && "🥃 "}Made in India
                </Badge>
                <Badge 
                  variant={settings.badgeStyle === "outline" ? "outline" : "default"}
                  className={getBadgeClassName() + " text-xs"}
                >
                  {settings.showEmoji && "🏴󠁧󠁢󠁳󠁣󠁴󠁿 "}Scotch Whisky
                </Badge>
                <Badge 
                  variant={settings.badgeStyle === "outline" ? "outline" : "default"}
                  className={getBadgeClassName() + " text-xs"}
                >
                  {settings.showEmoji && "🍷 "}Blended
                </Badge>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setSettings(DEFAULT_SETTINGS)}
          >
            Reset to Default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubCategoryDisplaySettingsComponent;
