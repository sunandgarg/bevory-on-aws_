import { useState, useEffect } from "react";
import { Save, Loader2, Brain, Key, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface AISettings {
  default_provider: string;
  openai_api_key: string;
  openai_model: string;
  claude_api_key: string;
  claude_model: string;
  perplexity_api_key: string;
  perplexity_model: string;
}

const DEFAULT_SETTINGS: AISettings = {
  default_provider: 'lovable',
  openai_api_key: '',
  openai_model: 'gpt-4o-mini',
  claude_api_key: '',
  claude_model: 'claude-3-haiku-20240307',
  perplexity_api_key: '',
  perplexity_model: 'llama-3.1-sonar-small-128k-online',
};

const PROVIDERS = [
  { value: 'lovable', label: 'Lovable AI (Free)', description: 'Built-in, no API key needed', badge: 'Free' },
  { value: 'openai', label: 'OpenAI (GPT)', description: 'GPT-4o-mini is cheapest' },
  { value: 'claude', label: 'Anthropic (Claude)', description: 'Claude Haiku is cheapest' },
  { value: 'perplexity', label: 'Perplexity', description: 'Search-augmented AI' },
];

const AdminAISettings = () => {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "ai_recommendation_settings")
        .maybeSingle();

      if (data?.value) {
        const val = data.value as unknown as AISettings;
        setSettings({ ...DEFAULT_SETTINGS, ...val });
      }
    } catch (err) {
      console.error("Error fetching AI settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const jsonValue = JSON.parse(JSON.stringify(settings)) as Json;

      const { data: existing } = await supabase
        .from("app_settings")
        .select("id")
        .eq("key", "ai_recommendation_settings")
        .maybeSingle();

      if (existing) {
        await supabase.from("app_settings").update({ value: jsonValue }).eq("key", "ai_recommendation_settings");
      } else {
        await supabase.from("app_settings").insert([{
          key: "ai_recommendation_settings",
          value: jsonValue,
          description: "AI recommendation provider settings",
        }]);
      }

      toast({ title: "Saved", description: "AI settings updated successfully." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-recommend', {
        body: {
          prompt: 'Recommend a good whisky under ₹2000 for a beginner.',
          provider: settings.default_provider,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Test failed');

      setTestResult(data.content);
      toast({ title: "Test Passed ✓", description: `Response from ${data.provider} (${data.model})` });
    } catch (err: any) {
      setTestResult(`Error: ${err.message}`);
      toast({ title: "Test Failed", description: err.message, variant: "destructive" });
    } finally {
      setTesting(false);
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6" />
          AI Recommendation Settings
        </h1>
        <p className="text-muted-foreground">
          Configure AI providers for product recommendations. Lovable AI is free and works out of the box.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default Provider</CardTitle>
          <CardDescription>Choose which AI provider to use for recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.default_provider}
            onValueChange={(v) => setSettings(s => ({ ...s, default_provider: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  <span className="flex items-center gap-2">
                    {p.label}
                    {p.badge && <Badge variant="secondary" className="text-xs">{p.badge}</Badge>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Add API keys only for providers you want to use. Keys are stored securely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OpenAI */}
          <div className="space-y-3 p-4 rounded-lg bg-secondary/30">
            <Label className="text-base font-medium">OpenAI</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">API Key</Label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={settings.openai_api_key}
                  onChange={(e) => setSettings(s => ({ ...s, openai_api_key: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Model</Label>
                <Select
                  value={settings.openai_model}
                  onValueChange={(v) => setSettings(s => ({ ...s, openai_model: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Cheapest)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Claude */}
          <div className="space-y-3 p-4 rounded-lg bg-secondary/30">
            <Label className="text-base font-medium">Anthropic (Claude)</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">API Key</Label>
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  value={settings.claude_api_key}
                  onChange={(e) => setSettings(s => ({ ...s, claude_api_key: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Model</Label>
                <Select
                  value={settings.claude_model}
                  onValueChange={(v) => setSettings(s => ({ ...s, claude_model: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku (Cheapest)</SelectItem>
                    <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Perplexity */}
          <div className="space-y-3 p-4 rounded-lg bg-secondary/30">
            <Label className="text-base font-medium">Perplexity</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">API Key</Label>
                <Input
                  type="password"
                  placeholder="pplx-..."
                  value={settings.perplexity_api_key}
                  onChange={(e) => setSettings(s => ({ ...s, perplexity_api_key: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Model</Label>
                <Select
                  value={settings.perplexity_model}
                  onValueChange={(v) => setSettings(s => ({ ...s, perplexity_model: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llama-3.1-sonar-small-128k-online">Sonar Small (Cheapest)</SelectItem>
                    <SelectItem value="llama-3.1-sonar-large-128k-online">Sonar Large</SelectItem>
                    <SelectItem value="llama-3.1-sonar-huge-128k-online">Sonar Huge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={testing}>
          {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
          Test AI
        </Button>
      </div>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={testResult} readOnly rows={6} className="text-sm" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminAISettings;
