import { useState, useEffect } from "react";
import { useBranding, BrandingSettings } from "@/hooks/useBranding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image as ImageIcon, Type, Save, Monitor, LayoutGrid, Sun, Moon } from "lucide-react";

interface BrandingItem {
  type: "image" | "text";
  imageUrl?: string;
  lightImageUrl?: string;
  darkImageUrl?: string;
  text?: string;
  bgColor?: string;
  textColor?: string;
}

interface BrandingSectionProps {
  title: string;
  description: string;
  favicon: BrandingItem;
  logo: BrandingItem;
  onFaviconChange: (favicon: BrandingItem) => void;
  onLogoChange: (logo: BrandingItem) => void;
}

const BrandingSection = ({ title, description, favicon, logo, onFaviconChange, onLogoChange }: BrandingSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Light Mode Preview */}
            <div className="p-4 bg-white rounded-lg border">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Sun className="w-3 h-3" /> Light Mode
              </p>
              <div className="flex items-center gap-3">
                {favicon.type === "image" && (favicon.lightImageUrl || favicon.imageUrl) ? (
                  <img 
                    src={favicon.lightImageUrl || favicon.imageUrl} 
                    alt="Favicon" 
                    className="w-10 h-10 rounded-xl object-contain"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: favicon.bgColor || "#D4AF37",
                      color: favicon.textColor || "#1a1a2e"
                    }}
                  >
                    <span className="text-xl font-bold">{favicon.text || "B"}</span>
                  </div>
                )}
                {logo.type === "image" && (logo.lightImageUrl || logo.imageUrl) ? (
                  <img 
                    src={logo.lightImageUrl || logo.imageUrl} 
                    alt="Logo" 
                    className="h-6 object-contain"
                  />
                ) : (
                  <span className="text-xl font-serif font-bold text-gray-900">
                    {logo.text || "Bevory"}
                  </span>
                )}
              </div>
            </div>
            
            {/* Dark Mode Preview */}
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <Moon className="w-3 h-3" /> Dark Mode
              </p>
              <div className="flex items-center gap-3">
                {favicon.type === "image" && (favicon.darkImageUrl || favicon.imageUrl) ? (
                  <img 
                    src={favicon.darkImageUrl || favicon.imageUrl} 
                    alt="Favicon" 
                    className="w-10 h-10 rounded-xl object-contain"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: favicon.bgColor || "#D4AF37",
                      color: favicon.textColor || "#1a1a2e"
                    }}
                  >
                    <span className="text-xl font-bold">{favicon.text || "B"}</span>
                  </div>
                )}
                {logo.type === "image" && (logo.darkImageUrl || logo.imageUrl) ? (
                  <img 
                    src={logo.darkImageUrl || logo.imageUrl} 
                    alt="Logo" 
                    className="h-6 object-contain"
                  />
                ) : (
                  <span className="text-xl font-serif font-bold text-white">
                    {logo.text || "Bevory"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Favicon Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                <Type className="w-4 h-4 text-accent" />
              </div>
              Favicon / Icon
            </CardTitle>
            <CardDescription className="text-xs">
              The small square icon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={favicon.type}
              onValueChange={(value: "image" | "text") => 
                onFaviconChange({ ...favicon, type: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id={`${title}-favicon-text`} />
                <Label htmlFor={`${title}-favicon-text`}>Text with Background</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="image" id={`${title}-favicon-image`} />
                <Label htmlFor={`${title}-favicon-image`}>Image</Label>
              </div>
            </RadioGroup>

            {favicon.type === "text" ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Text (1-2 characters)</Label>
                  <Input
                    value={favicon.text || ""}
                    onChange={(e) => onFaviconChange({ ...favicon, text: e.target.value.slice(0, 2) })}
                    maxLength={2}
                    placeholder="B"
                  />
                </div>
                <div>
                  <Label className="text-xs">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={favicon.bgColor || "#D4AF37"}
                      onChange={(e) => onFaviconChange({ ...favicon, bgColor: e.target.value })}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      value={favicon.bgColor || "#D4AF37"}
                      onChange={(e) => onFaviconChange({ ...favicon, bgColor: e.target.value })}
                      placeholder="#D4AF37"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={favicon.textColor || "#1a1a2e"}
                      onChange={(e) => onFaviconChange({ ...favicon, textColor: e.target.value })}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      value={favicon.textColor || "#1a1a2e"}
                      onChange={(e) => onFaviconChange({ ...favicon, textColor: e.target.value })}
                      placeholder="#1a1a2e"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Sun className="w-3 h-3" /> Light Mode Image URL
                  </Label>
                  <Input
                    value={favicon.lightImageUrl || ""}
                    onChange={(e) => onFaviconChange({ ...favicon, lightImageUrl: e.target.value })}
                    placeholder="https://example.com/favicon-light.png"
                  />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Moon className="w-3 h-3" /> Dark Mode Image URL
                  </Label>
                  <Input
                    value={favicon.darkImageUrl || ""}
                    onChange={(e) => onFaviconChange({ ...favicon, darkImageUrl: e.target.value })}
                    placeholder="https://example.com/favicon-dark.png"
                  />
                </div>
                <div>
                  <Label className="text-xs">Default Image URL (fallback)</Label>
                  <Input
                    value={favicon.imageUrl || ""}
                    onChange={(e) => onFaviconChange({ ...favicon, imageUrl: e.target.value })}
                    placeholder="https://example.com/favicon.png"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used when theme-specific images aren't set
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logo Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-accent" />
              </div>
              Logo / Brand Name
            </CardTitle>
            <CardDescription className="text-xs">
              The main brand logo or text
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={logo.type}
              onValueChange={(value: "image" | "text") => 
                onLogoChange({ ...logo, type: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id={`${title}-logo-text`} />
                <Label htmlFor={`${title}-logo-text`}>Text</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="image" id={`${title}-logo-image`} />
                <Label htmlFor={`${title}-logo-image`}>Image</Label>
              </div>
            </RadioGroup>

            {logo.type === "text" ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Brand Name</Label>
                  <Input
                    value={logo.text || ""}
                    onChange={(e) => onLogoChange({ ...logo, text: e.target.value })}
                    placeholder="Bevory"
                  />
                </div>
                <div>
                  <Label className="text-xs">Text Color (optional)</Label>
                  <Input
                    value={logo.textColor || ""}
                    onChange={(e) => onLogoChange({ ...logo, textColor: e.target.value })}
                    placeholder="currentColor or #hex"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to inherit from theme
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Sun className="w-3 h-3" /> Light Mode Logo URL
                  </Label>
                  <Input
                    value={logo.lightImageUrl || ""}
                    onChange={(e) => onLogoChange({ ...logo, lightImageUrl: e.target.value })}
                    placeholder="https://example.com/logo-light.png"
                  />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Moon className="w-3 h-3" /> Dark Mode Logo URL
                  </Label>
                  <Input
                    value={logo.darkImageUrl || ""}
                    onChange={(e) => onLogoChange({ ...logo, darkImageUrl: e.target.value })}
                    placeholder="https://example.com/logo-dark.png"
                  />
                </div>
                <div>
                  <Label className="text-xs">Default Logo URL (fallback)</Label>
                  <Input
                    value={logo.imageUrl || ""}
                    onChange={(e) => onLogoChange({ ...logo, imageUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used when theme-specific logos aren't set
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AdminBranding = () => {
  const { branding, loading, updateBranding, DEFAULT_BRANDING } = useBranding();
  const [formData, setFormData] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      setFormData(branding);
    }
  }, [branding, loading]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateBranding(formData);
    setSaving(false);

    if (success) {
      toast({
        title: "Branding Updated",
        description: "Your branding settings have been saved successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update branding settings.",
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
        <h1 className="text-2xl font-bold">Branding Settings</h1>
        <p className="text-muted-foreground">
          Customize the header and footer branding with light/dark mode support.
        </p>
      </div>

      <Tabs defaultValue="header" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="header" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Header
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            Footer
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="header" className="mt-6">
          <BrandingSection
            title="Header Branding"
            description="Customize the branding shown in the site header"
            favicon={formData.header.favicon}
            logo={formData.header.logo}
            onFaviconChange={(favicon) => setFormData({
              ...formData,
              header: { ...formData.header, favicon }
            })}
            onLogoChange={(logo) => setFormData({
              ...formData,
              header: { ...formData.header, logo }
            })}
          />
        </TabsContent>
        
        <TabsContent value="footer" className="mt-6">
          <BrandingSection
            title="Footer Branding"
            description="Customize the branding shown in the site footer"
            favicon={formData.footer.favicon}
            logo={formData.footer.logo}
            onFaviconChange={(favicon) => setFormData({
              ...formData,
              footer: { ...formData.footer, favicon }
            })}
            onLogoChange={(logo) => setFormData({
              ...formData,
              footer: { ...formData.footer, logo }
            })}
          />
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setFormData(DEFAULT_BRANDING)}
        >
          Reset to Default
        </Button>
      </div>
    </div>
  );
};

export default AdminBranding;
