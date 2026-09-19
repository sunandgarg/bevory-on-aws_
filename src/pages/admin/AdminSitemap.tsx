import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type SitemapStats = {
  urls: number;
  images: number;
  cityProducts: number;
  cityVariants: number;
  cityBrands: number;
  guides: number;
  cocktails: number;
};

const emptyStats: SitemapStats = {
  urls: 0,
  images: 0,
  cityProducts: 0,
  cityVariants: 0,
  cityBrands: 0,
  guides: 0,
  cocktails: 0,
};

const AdminSitemap = () => {
  const [loading, setLoading] = useState(true);
  const [sitemap, setSitemap] = useState("");
  const [stats, setStats] = useState<SitemapStats>(emptyStats);
  const { toast } = useToast();

  const loadSitemap = useCallback(async (announce = false) => {
    setLoading(true);
    try {
      const response = await fetch(`/sitemap.xml?updated=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xml = await response.text();
      const document = new DOMParser().parseFromString(xml, "application/xml");
      if (document.querySelector("parsererror")) throw new Error("Invalid XML");

      const locations = Array.from(document.querySelectorAll("url > loc"), (node) => node.textContent || "");
      const paths = locations.map((location) => {
        try {
          return new URL(location).pathname;
        } catch {
          return "";
        }
      });
      setSitemap(xml);
      setStats({
        urls: locations.length,
        images: document.getElementsByTagNameNS("http://www.google.com/schemas/sitemap-image/1.1", "image").length,
        cityProducts: paths.filter((path) => /^\/[a-z-]+\/product\/[^/]+$/.test(path)).length,
        cityVariants: paths.filter((path) => /^\/[a-z-]+\/product\/[^/]+\/[^/]+$/.test(path)).length,
        cityBrands: paths.filter((path) => /^\/[a-z-]+\/brand\/[^/]+$/.test(path)).length,
        guides: paths.filter((path) => path.startsWith("/guide/")).length,
        cocktails: paths.filter((path) => path.startsWith("/cocktail/")).length,
      });
      if (announce) toast({ title: "Sitemap refreshed", description: `${locations.length.toLocaleString()} canonical URLs found.` });
    } catch {
      setSitemap("");
      setStats(emptyStats);
      toast({ title: "Sitemap unavailable", description: "The deployed sitemap could not be loaded.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSitemap();
  }, [loadSitemap]);

  const lines = useMemo(() => sitemap.split("\n"), [sitemap]);
  const preview = useMemo(() => lines.slice(0, 120).join("\n"), [lines]);

  const downloadSitemap = () => {
    const blob = new Blob([sitemap], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sitemap.xml";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const statItems = [
    ["Canonical URLs", stats.urls],
    ["Image entries", stats.images],
    ["City products", stats.cityProducts],
    ["City variants", stats.cityVariants],
    ["City brands", stats.cityBrands],
    ["Guides", stats.guides],
    ["Cocktails", stats.cocktails],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Production Sitemap</h2>
          <p className="text-sm text-muted-foreground">Canonical, reviewed pages currently published at bevory.in.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadSitemap(true)} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={downloadSitemap} disabled={!sitemap}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {statItems.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" /> Sitemap Source
          </CardTitle>
          <CardDescription>
            This view reads the deployed sitemap. Product and size URLs are included only when that city has a reviewed positive price.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded bg-secondary/30 p-4 text-xs">
            {loading ? "Loading sitemap..." : preview || "No sitemap data available."}
            {lines.length > 120 ? "\n..." : ""}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Engine Tools</CardTitle>
          <CardDescription>The canonical sitemap URL is https://bevory.in/sitemap.xml.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href="https://search.google.com/search-console/sitemaps?resource_id=sc-domain%3Abevory.in" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Google Search Console
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Bing Webmaster Tools
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSitemap;
