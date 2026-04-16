import { useState, useEffect } from "react";
import { Save, Loader2, BarChart3, ExternalLink, CheckCircle2, AlertCircle, Info, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAnalytics, GASettings } from "@/hooks/useGoogleAnalytics";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const GoogleAnalyticsSettings = () => {
  const { settings, loading, saving, updateSettings, isConfigured } = useGoogleAnalytics();
  const [formData, setFormData] = useState<GASettings>({
    measurementId: '',
    propertyId: '',
    enabled: false,
    serviceAccountJson: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      setFormData(settings);
    }
  }, [settings, loading]);

  const handleSave = async () => {
    const success = await updateSettings(formData);

    if (success) {
      toast({
        title: "Settings Saved",
        description: "Google Analytics settings have been updated.",
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Google Analytics 4</CardTitle>
              <CardDescription>Connect your GA4 property for real analytics data</CardDescription>
            </div>
          </div>
          {isConfigured ? (
            <Badge className="gap-1 bg-green-500">
              <CheckCircle2 className="w-3 h-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Switch */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <Label className="text-base font-medium">Enable Google Analytics</Label>
            <p className="text-sm text-muted-foreground">
              Show real analytics data in the dashboard
            </p>
          </div>
          <Switch
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
          />
        </div>

        {/* Measurement ID */}
        <div className="space-y-2">
          <Label>Measurement ID</Label>
          <Input
            value={formData.measurementId}
            onChange={(e) => setFormData({ ...formData, measurementId: e.target.value })}
            placeholder="G-XXXXXXXXXX"
          />
          <p className="text-xs text-muted-foreground">
            Found in GA4 → Admin → Data Streams → Your Stream
          </p>
        </div>

        {/* Property ID */}
        <div className="space-y-2">
          <Label>Property ID</Label>
          <Input
            value={formData.propertyId}
            onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
            placeholder="123456789"
          />
          <p className="text-xs text-muted-foreground">
            Found in GA4 → Admin → Property Settings (numeric ID)
          </p>
        </div>

        {/* Service Account JSON */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Service Account JSON
          </Label>
          <Textarea
            value={formData.serviceAccountJson || ''}
            onChange={(e) => setFormData({ ...formData, serviceAccountJson: e.target.value })}
            placeholder='Paste your Google Service Account JSON here (starts with { "type": "service_account", ... })'
            className="font-mono text-xs min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground">
            Paste the entire contents of your service account JSON key file. This is stored securely and used to authenticate with Google Analytics.
          </p>
          {formData.serviceAccountJson && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="w-3 h-3" />
              Service account JSON provided
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="setup">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Setup Instructions
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <Alert>
                  <AlertTitle className="flex items-center gap-2">
                    Step 1: Create a Google Cloud Service Account
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-2">
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Go to Google Cloud Console</li>
                      <li>Create a new project or select existing</li>
                      <li>Navigate to IAM & Admin → Service Accounts</li>
                      <li>Create a new service account</li>
                      <li>Generate a JSON key and download it</li>
                    </ol>
                    <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                      <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noopener noreferrer">
                        Open Google Cloud Console <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTitle className="flex items-center gap-2">
                    Step 2: Enable GA4 Data API
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-2">
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>In Google Cloud Console, go to APIs & Services</li>
                      <li>Click "Enable APIs and Services"</li>
                      <li>Search for "Google Analytics Data API"</li>
                      <li>Enable the API for your project</li>
                    </ol>
                    <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                      <a href="https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com" target="_blank" rel="noopener noreferrer">
                        Enable GA4 Data API <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTitle className="flex items-center gap-2">
                    Step 3: Add Service Account to GA4
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-2">
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Copy the service account email from your JSON file</li>
                      <li>Go to GA4 → Admin → Property Access Management</li>
                      <li>Click "+" and add the service account email</li>
                      <li>Grant "Viewer" role</li>
                    </ol>
                    <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                      <a href="https://analytics.google.com/analytics/web/" target="_blank" rel="noopener noreferrer">
                        Open Google Analytics <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleAnalyticsSettings;
