import { useState, useEffect } from "react";
import { Save, Loader2, Image, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useImageOptimization, ImageOptimizationSettings as Settings } from "@/hooks/useImageOptimization";

const ImageOptimizationSettings = () => {
  const { settings, loading, updateSettings, DEFAULT_SETTINGS } = useImageOptimization();
  const [formData, setFormData] = useState<Settings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      setFormData(settings);
    }
  }, [settings, loading]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateSettings(formData);
    setSaving(false);

    if (success) {
      toast({
        title: "Settings Saved",
        description: "Image optimization settings have been updated. Changes will apply to new page loads.",
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
          <Zap className="w-5 h-5 text-accent" />
          Image Optimization & WebP Conversion
        </CardTitle>
        <CardDescription>
          Automatically convert and optimize images for faster loading. Images are converted to WebP format on-the-fly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Switch */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <Label className="text-base font-medium">Enable Image Optimization</Label>
            <p className="text-sm text-muted-foreground">
              Convert images to WebP/AVIF and optimize for faster loading
            </p>
          </div>
          <Switch
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
          />
        </div>

        {formData.enabled && (
          <>
            {/* Output Format */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Output Format
              </Label>
              <Select
                value={formData.format}
                onValueChange={(value: 'webp' | 'avif' | 'auto') => 
                  setFormData({ ...formData, format: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webp">WebP (Best Compatibility)</SelectItem>
                  <SelectItem value="avif">AVIF (Smallest Size)</SelectItem>
                  <SelectItem value="auto">Auto (Browser Decides)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                WebP is supported by all modern browsers. AVIF offers better compression but less support.
              </p>
            </div>

            {/* Quality Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Image Quality</Label>
                <span className="text-sm font-medium text-accent">{formData.quality}%</span>
              </div>
              <Slider
                value={[formData.quality]}
                onValueChange={(value) => setFormData({ ...formData, quality: value[0] })}
                min={40}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher quality = larger file size. 80% is recommended for best balance.
              </p>
            </div>

            {/* Max Dimensions */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Max Width (px)</Label>
                <Select
                  value={String(formData.maxWidth)}
                  onValueChange={(value) => 
                    setFormData({ ...formData, maxWidth: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1280">1280px</SelectItem>
                    <SelectItem value="1920">1920px (Full HD)</SelectItem>
                    <SelectItem value="2560">2560px (2K)</SelectItem>
                    <SelectItem value="3840">3840px (4K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Height (px)</Label>
                <Select
                  value={String(formData.maxHeight)}
                  onValueChange={(value) => 
                    setFormData({ ...formData, maxHeight: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720">720px</SelectItem>
                    <SelectItem value="1080">1080px (Full HD)</SelectItem>
                    <SelectItem value="1440">1440px (2K)</SelectItem>
                    <SelectItem value="2160">2160px (4K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Performance Info */}
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                Performance Benefits
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• WebP images are ~30% smaller than JPEG/PNG</li>
                <li>• Lazy loading defers off-screen images</li>
                <li>• Responsive srcset serves optimal sizes</li>
                <li>• Automatic CDN caching for faster delivery</li>
              </ul>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex gap-3 pt-2">
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
            onClick={() => setFormData(DEFAULT_SETTINGS)}
          >
            Reset to Default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageOptimizationSettings;
