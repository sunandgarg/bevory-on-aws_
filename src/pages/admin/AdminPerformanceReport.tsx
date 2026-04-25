import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, AlertTriangle, XCircle, Loader2, Download, FileText } from "lucide-react";

type Severity = "good" | "warn" | "bad";
interface Finding {
  category: string;
  title: string;
  detail: string;
  fix: string;
  severity: Severity;
}

const sev: Record<Severity, { color: string; icon: typeof CheckCircle2 }> = {
  good: { color: "text-green-600", icon: CheckCircle2 },
  warn: { color: "text-amber-600", icon: AlertTriangle },
  bad: { color: "text-destructive", icon: XCircle },
};

export default function AdminPerformanceReport() {
  const [running, setRunning] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [score, setScore] = useState<number | null>(null);

  const runAudit = async () => {
    setRunning(true);
    setFindings([]);
    const results: Finding[] = [];

    // 1. Images
    const imgs = Array.from(document.images);
    const oversize = imgs.filter(i => i.naturalWidth > 1.5 * i.clientWidth && i.clientWidth > 0);
    const noLazy = imgs.filter(i => !i.loading || i.loading === "eager").slice(0, -1);
    const nonWebp = imgs.filter(i => i.currentSrc && !/\.webp|wsrv\.nl/i.test(i.currentSrc));
    results.push({
      category: "Images",
      title: `${imgs.length} images on page`,
      detail: `${oversize.length} oversized, ${noLazy.length} eager-loaded, ${nonWebp.length} non-WebP`,
      fix: "Use <ProductImage> / OptimizedImage so wsrv.nl serves WebP at the right size; keep priority only on hero images.",
      severity: oversize.length > 3 || nonWebp.length > 5 ? "bad" : oversize.length || nonWebp.length ? "warn" : "good",
    });

    // 2. Fonts
    const fontLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"][href*="fonts."]'));
    const preconnects = Array.from(document.querySelectorAll('link[rel="preconnect"][href*="fonts."]'));
    results.push({
      category: "Fonts",
      title: `${fontLinks.length} font stylesheet(s)`,
      detail: `${preconnects.length} preconnect hint(s) found`,
      fix: preconnects.length === 0 ? "Add <link rel=preconnect href=https://fonts.gstatic.com crossorigin> in index.html for faster FCP." : "OK — consider self-hosting WOFF2 for max speed.",
      severity: preconnects.length === 0 ? "warn" : "good",
    });

    // 3. Caching headers (sample one resource)
    let cacheVerdict: Severity = "good";
    let cacheDetail = "";
    try {
      const sample = imgs[0]?.currentSrc || "/favicon.ico";
      const res = await fetch(sample, { method: "HEAD" });
      const cc = res.headers.get("cache-control") || "";
      cacheDetail = `Cache-Control: ${cc || "missing"}`;
      if (!cc) cacheVerdict = "bad";
      else if (!/max-age=\d{5,}/.test(cc) && !/immutable/.test(cc)) cacheVerdict = "warn";
    } catch (e) {
      cacheDetail = "Could not probe headers (CORS).";
      cacheVerdict = "warn";
    }
    results.push({
      category: "Caching",
      title: "HTTP cache headers",
      detail: cacheDetail,
      fix: "Configure CDN / hosting to send Cache-Control: public, max-age=31536000, immutable for hashed assets.",
      severity: cacheVerdict,
    });

    // 4. Bundle splits
    const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'));
    const chunks = scripts.filter(s => /assets\/.+-[a-z0-9]{6,}\.js$/i.test(s.src));
    results.push({
      category: "Bundle",
      title: `${chunks.length} JS chunks loaded`,
      detail: chunks.length < 4 ? "Few chunks — code-splitting may be limited." : "Code-splitting active.",
      fix: "Routes are already lazy()-imported. Consider splitting heavy admin libs further if any chunk > 200 KB gz.",
      severity: chunks.length < 3 ? "warn" : "good",
    });

    // 5. Web Vitals
    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const tti = navEntries[0] ? Math.round(navEntries[0].domInteractive) : 0;
    results.push({
      category: "Web Vitals",
      title: `DOM Interactive: ${tti} ms`,
      detail: `${performance.getEntriesByType("resource").length} total resources fetched`,
      fix: tti > 3500 ? "Reduce blocking scripts and prefetch critical routes." : "Good — keep below 3.5s on 4G.",
      severity: tti > 5000 ? "bad" : tti > 3500 ? "warn" : "good",
    });

    // 6. Service worker
    const swReg = await navigator.serviceWorker?.getRegistration();
    results.push({
      category: "Offline / SW",
      title: swReg ? "Service worker active" : "No service worker",
      detail: swReg ? `Scope: ${swReg.scope}` : "Repeat-visit performance can improve with caching SW.",
      fix: swReg ? "Verify SW caches static assets with stale-while-revalidate." : "Register /sw.js for offline + repeat-visit gains.",
      severity: swReg ? "good" : "warn",
    });

    // Score
    const weights = { good: 100, warn: 70, bad: 30 } as const;
    const avg = Math.round(results.reduce((s, r) => s + weights[r.severity], 0) / results.length);
    setScore(avg);
    setFindings(results);
    setRunning(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" /> Performance Report
          </h1>
          <p className="text-sm text-muted-foreground">
            Lighthouse-style in-browser audit for the current environment.
          </p>
        </div>
        <Button onClick={runAudit} disabled={running}>
          {running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running…</> : "Run Audit"}
        </Button>
      </div>

      {score !== null && (
        <Card className="p-6 mb-6 text-center">
          <div className={`text-6xl font-bold ${score >= 90 ? "text-green-600" : score >= 70 ? "text-amber-600" : "text-destructive"}`}>
            {score}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Overall environment score (0–100)</p>
        </Card>
      )}

      <div className="space-y-3">
        {findings.map((f, i) => {
          const Icon = sev[f.severity].icon;
          return (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${sev[f.severity].color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{f.category}</Badge>
                    <span className="font-medium">{f.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{f.detail}</p>
                  <p className="text-sm mt-2"><strong>Fix:</strong> {f.fix}</p>
                </div>
              </div>
            </Card>
          );
        })}
        {!running && findings.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Click <strong>Run Audit</strong> to scan this environment.</p>
        )}
      </div>
    </div>
  );
}
