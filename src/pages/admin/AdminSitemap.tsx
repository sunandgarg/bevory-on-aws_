import { useState, useEffect } from "react";
import { FileText, RefreshCw, Download, ExternalLink, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import FormField from "@/components/admin/FormField";

interface SitemapConfig {
  baseUrl: string;
  includeProducts: boolean;
  includeCategories: boolean;
  includeCocktails: boolean;
  includeBrands: boolean;
  includeBlog: boolean;
  includeMagazine: boolean;
}

const AdminSitemap = () => {
  const [loading, setLoading] = useState(false);
  const [sitemap, setSitemap] = useState<string>("");
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    cocktails: 0,
    brands: 0,
    blog: 0,
    magazine: 0,
  });
  const [config, setConfig] = useState<SitemapConfig>({
    baseUrl: "https://www.bevory.in",
    includeProducts: true,
    includeCategories: true,
    includeCocktails: true,
    includeBrands: true,
    includeBlog: true,
    includeMagazine: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [products, categories, cocktails, brands, blog, magazine] = await Promise.all([
      apiClient.from("products").select("id", { count: "exact", head: true }),
      apiClient.from("categories").select("id", { count: "exact", head: true }),
      apiClient.from("cocktails").select("id", { count: "exact", head: true }),
      apiClient.from("brand_spotlights").select("id", { count: "exact", head: true }).eq("is_active", true),
      apiClient.from("blog_posts").select("id", { count: "exact", head: true }).eq("is_published", true),
      apiClient.from("spiritz_magazine").select("id", { count: "exact", head: true }).eq("is_published", true),
    ]);

    setStats({
      products: products.count || 0,
      categories: categories.count || 0,
      cocktails: cocktails.count || 0,
      brands: brands.count || 0,
      blog: blog.count || 0,
      magazine: magazine.count || 0,
    });
  };

  const generateSitemap = async () => {
    setLoading(true);
    
    try {
      const baseUrl = config.baseUrl.replace(/\/$/, '');
      const today = new Date().toISOString().split('T')[0];
      
      const urls: { loc: string; changefreq: string; priority: string; lastmod?: string }[] = [
        { loc: `${baseUrl}/`, changefreq: "daily", priority: "1.0", lastmod: today },
        { loc: `${baseUrl}/categories`, changefreq: "weekly", priority: "0.9" },
        { loc: `${baseUrl}/cocktails`, changefreq: "weekly", priority: "0.8" },
        { loc: `${baseUrl}/guide`, changefreq: "weekly", priority: "0.8" },
      ];

      // Fetch all content
      if (config.includeCategories) {
        const { data: categories } = await apiClient.from("categories").select("slug, created_at");
        categories?.forEach(c => {
          urls.push({ loc: `${baseUrl}/category/${c.slug}`, changefreq: "weekly", priority: "0.8" });
        });
      }

      if (config.includeProducts) {
        let allProducts: any[] = [];
        let pFrom = 0;
        while (true) {
          const { data: batch } = await apiClient.from("products").select("slug, updated_at").range(pFrom, pFrom + 999);
          if (!batch || batch.length === 0) break;
          allProducts = allProducts.concat(batch);
          if (batch.length < 1000) break;
          pFrom += 1000;
        }
        allProducts.forEach(p => {
          urls.push({ 
            loc: `${baseUrl}/product/${p.slug}`, 
            changefreq: "weekly", 
            priority: "0.7",
            lastmod: p.updated_at?.split('T')[0]
          });
        });
      }

      if (config.includeCocktails) {
        const { data: cocktails } = await apiClient.from("cocktails").select("slug, updated_at");
        cocktails?.forEach(c => {
          if (c.slug) {
            urls.push({ 
              loc: `${baseUrl}/cocktails?slug=${c.slug}`, 
              changefreq: "monthly", 
              priority: "0.6",
              lastmod: c.updated_at?.split('T')[0]
            });
          }
        });
      }

      if (config.includeBrands) {
        const { data: brands } = await apiClient.from("brand_spotlights").select("slug, updated_at").eq("is_active", true);
        brands?.forEach(b => {
          if (b.slug) {
            urls.push({ 
              loc: `${baseUrl}/brand/${b.slug}`, 
              changefreq: "monthly", 
              priority: "0.7",
              lastmod: b.updated_at?.split('T')[0]
            });
          }
        });
      }

      if (config.includeBlog) {
        // Fetch all blog posts in batches to handle >1000 rows
        let allPosts: any[] = [];
        let from = 0;
        const batchSize = 1000;
        while (true) {
          const { data: batch } = await apiClient.from("blog_posts").select("slug, updated_at").eq("is_published", true).range(from, from + batchSize - 1);
          if (!batch || batch.length === 0) break;
          allPosts = allPosts.concat(batch);
          if (batch.length < batchSize) break;
          from += batchSize;
        }
        allPosts.forEach(p => {
          urls.push({ 
            loc: `${baseUrl}/guide/${p.slug}`, 
            changefreq: "monthly", 
            priority: "0.7",
            lastmod: p.updated_at?.split('T')[0]
          });
        });
      }

      if (config.includeMagazine) {
        const { data: articles } = await apiClient.from("spiritz_magazine").select("slug, updated_at").eq("is_published", true);
        articles?.forEach(a => {
          if (a.slug) {
            urls.push({ 
              loc: `${baseUrl}/magazine/${a.slug}`, 
              changefreq: "monthly", 
              priority: "0.6",
              lastmod: a.updated_at?.split('T')[0]
            });
          }
        });
      }

      // Generate XML
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${url.lastmod ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

      setSitemap(xml);
      toast({ title: "Sitemap Generated!", description: `${urls.length} URLs included` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate sitemap", variant: "destructive" });
    }
    
    setLoading(false);
  };

  const downloadSitemap = () => {
    const blob = new Blob([sitemap], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sitemap);
    toast({ title: "Copied to clipboard!" });
  };

  const totalUrls = (config.includeProducts ? stats.products : 0) +
    (config.includeCategories ? stats.categories : 0) +
    (config.includeCocktails ? stats.cocktails : 0) +
    (config.includeBrands ? stats.brands : 0) +
    (config.includeBlog ? stats.blog : 0) +
    (config.includeMagazine ? stats.magazine : 0) + 4; // +4 for static pages

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">🗺️ Sitemap Generator</h2>
        <Button onClick={generateSitemap} disabled={loading}>
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          Generate Sitemap
        </Button>
      </div>

      {/* SEO Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📚 SEO 2026 Sitemap Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>Submit to Search Engines:</strong> Add sitemap URL to Google Search Console and Bing Webmaster Tools</p>
          <p>• <strong>Update robots.txt:</strong> Add <code>Sitemap: {config.baseUrl}/sitemap.xml</code></p>
          <p>• <strong>Keep Updated:</strong> Regenerate after adding new products or content</p>
          <p>• <strong>Priority Values:</strong> Homepage (1.0), Categories (0.9), Products (0.7), Articles (0.6)</p>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> Configuration
          </CardTitle>
          <CardDescription>Choose what to include in your sitemap</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Base URL">
            <Input
              value={config.baseUrl}
              onChange={(e) => setConfig(c => ({ ...c, baseUrl: e.target.value }))}
              placeholder="https://yourdomain.com"
            />
          </FormField>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <p className="font-medium text-sm">Products</p>
                <p className="text-xs text-muted-foreground">{stats.products} items</p>
              </div>
              <Switch
                checked={config.includeProducts}
                onCheckedChange={(v) => setConfig(c => ({ ...c, includeProducts: v }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <p className="font-medium text-sm">Categories</p>
                <p className="text-xs text-muted-foreground">{stats.categories} items</p>
              </div>
              <Switch
                checked={config.includeCategories}
                onCheckedChange={(v) => setConfig(c => ({ ...c, includeCategories: v }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <p className="font-medium text-sm">Cocktails</p>
                <p className="text-xs text-muted-foreground">{stats.cocktails} items</p>
              </div>
              <Switch
                checked={config.includeCocktails}
                onCheckedChange={(v) => setConfig(c => ({ ...c, includeCocktails: v }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <p className="font-medium text-sm">Brands</p>
                <p className="text-xs text-muted-foreground">{stats.brands} items</p>
              </div>
              <Switch
                checked={config.includeBrands}
                onCheckedChange={(v) => setConfig(c => ({ ...c, includeBrands: v }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <p className="font-medium text-sm">Blog Posts</p>
                <p className="text-xs text-muted-foreground">{stats.blog} items</p>
              </div>
              <Switch
                checked={config.includeBlog}
                onCheckedChange={(v) => setConfig(c => ({ ...c, includeBlog: v }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <p className="font-medium text-sm">Magazine</p>
                <p className="text-xs text-muted-foreground">{stats.magazine} items</p>
              </div>
              <Switch
                checked={config.includeMagazine}
                onCheckedChange={(v) => setConfig(c => ({ ...c, includeMagazine: v }))}
              />
            </div>
          </div>
          
          <p className="text-sm text-center text-muted-foreground">
            Estimated URLs: <strong>{totalUrls}</strong>
          </p>
        </CardContent>
      </Card>

      {/* Generated Sitemap */}
      {sitemap && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Sitemap</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  Copy
                </Button>
                <Button size="sm" onClick={downloadSitemap}>
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-secondary/30 rounded-lg text-xs overflow-x-auto max-h-96">
              {sitemap}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📋 Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
            <span className="text-lg">1️⃣</span>
            <div>
              <p className="font-medium">Download & Upload</p>
              <p className="text-muted-foreground">Download sitemap.xml and upload to your website's root folder</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
            <span className="text-lg">2️⃣</span>
            <div>
              <p className="font-medium">Update robots.txt</p>
              <p className="text-muted-foreground">Add: <code className="bg-background px-1 rounded">Sitemap: {config.baseUrl}/sitemap.xml</code></p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
            <span className="text-lg">3️⃣</span>
            <div>
              <p className="font-medium">Submit to Search Engines</p>
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant="outline" asChild>
                  <a href="https://search.google.com/search-console" target="_blank" rel="noopener">
                    <ExternalLink className="w-3 h-3 mr-1" /> Google
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener">
                    <ExternalLink className="w-3 h-3 mr-1" /> Bing
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSitemap;
