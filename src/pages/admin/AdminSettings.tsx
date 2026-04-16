import { useState, useEffect } from "react";
import { Save, Loader2, ShieldCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings, AgeVerificationSettings } from "@/hooks/useAppSettings";
import { POPULAR_CITIES, CITIES_BY_STATE } from "@/hooks/useLocation";
import GoogleAnalyticsSettings from "@/components/admin/GoogleAnalyticsSettings";
import ImageOptimizationSettings from "@/components/admin/ImageOptimizationSettings";
import PerformanceDashboard from "@/components/admin/PerformanceDashboard";
import SubCategoryDisplaySettings from "@/components/admin/SubCategoryDisplaySettings";

const AdminSettings = () => {
  const { ageSettings, loading, updateAgeSettings, DEFAULT_AGE_SETTINGS } = useAppSettings();
  const [formData, setFormData] = useState<AgeVerificationSettings>(DEFAULT_AGE_SETTINGS);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Get all cities for the dropdown
  const allCities = [
    ...POPULAR_CITIES,
    ...Object.values(CITIES_BY_STATE).flat()
  ].filter((city, index, self) => self.indexOf(city) === index).sort();

  useEffect(() => {
    if (!loading) {
      setFormData(ageSettings);
    }
  }, [ageSettings, loading]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateAgeSettings(formData);
    setSaving(false);

    if (success) {
      toast({
        title: "Settings Saved",
        description: "Age verification settings have been updated.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">App Settings</h1>
        <p className="text-muted-foreground">
          Configure general application settings.
        </p>
      </div>

      {/* Age Verification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            21+ Age Verification Popup
          </CardTitle>
          <CardDescription>
            Control the age verification popup that appears when users first visit the site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Switch */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <Label className="text-base font-medium">Enable Age Verification</Label>
              <p className="text-sm text-muted-foreground">
                Show the 21+ popup when users first visit the website
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
          </div>

          {/* Default City */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Default City
            </Label>
            <Select
              value={formData.defaultCity}
              onValueChange={(value) => setFormData({ ...formData, defaultCity: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default city" />
              </SelectTrigger>
              <SelectContent>
                {allCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This city will be pre-selected in the age verification popup
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Popup Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Are you of legal drinking age?"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description Text</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="You must be of legal drinking age..."
              rows={2}
            />
          </div>

          {/* Button Texts */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Confirm Button Text</Label>
              <Input
                value={formData.confirmButtonText}
                onChange={(e) => setFormData({ ...formData, confirmButtonText: e.target.value })}
                placeholder="Yes, I am 21+"
              />
            </div>
            <div className="space-y-2">
              <Label>Decline Button Text</Label>
              <Input
                value={formData.declineButtonText}
                onChange={(e) => setFormData({ ...formData, declineButtonText: e.target.value })}
                placeholder="No, I am not"
              />
            </div>
          </div>

          {/* Terms Text */}
          <div className="space-y-2">
            <Label>Terms & Conditions Text</Label>
            <Textarea
              value={formData.termsText}
              onChange={(e) => setFormData({ ...formData, termsText: e.target.value })}
              placeholder="By entering this website, you agree to..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3">
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
          onClick={() => setFormData(DEFAULT_AGE_SETTINGS)}
        >
          Reset to Default
        </Button>
      </div>

      {/* Sub-Category Display Settings */}
      <SubCategoryDisplaySettings />

      {/* Performance Dashboard */}
      <PerformanceDashboard />

      {/* Image Optimization Settings */}
      <ImageOptimizationSettings />

      {/* Google Analytics Settings */}
      <GoogleAnalyticsSettings />
    </div>
  );
};

export default AdminSettings;
