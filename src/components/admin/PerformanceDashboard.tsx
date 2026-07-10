import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Zap, Image, Clock, Activity, TrendingDown, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { usePerformanceMetrics, formatBytes, getScoreColor, WEB_VITALS_THRESHOLDS } from "@/hooks/usePerformanceMetrics";
import { useImageOptimization } from "@/hooks/useImageOptimization";

const PerformanceDashboard = () => {
  const { metrics, loading, refresh } = usePerformanceMetrics();
  const { settings } = useImageOptimization();

  const getStatusIcon = (value: number | null, thresholds: { good: number; needsImprovement: number }) => {
    if (value === null) return <Activity className="w-4 h-4 text-muted-foreground" />;
    if (value <= thresholds.good) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (value <= thresholds.needsImprovement) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (value: number | null, thresholds: { good: number; needsImprovement: number }) => {
    if (value === null) return <Badge variant="outline">N/A</Badge>;
    if (value <= thresholds.good) return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Good</Badge>;
    if (value <= thresholds.needsImprovement) return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Needs Work</Badge>;
    return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Poor</Badge>;
  };

  const webVitals = [
    {
      name: "LCP",
      fullName: "Largest Contentful Paint",
      value: metrics.lcp,
      unit: "ms",
      thresholds: WEB_VITALS_THRESHOLDS.lcp,
      description: "Loading performance - time until largest content element is visible",
    },
    {
      name: "FID",
      fullName: "First Input Delay",
      value: metrics.fid,
      unit: "ms",
      thresholds: WEB_VITALS_THRESHOLDS.fid,
      description: "Interactivity - time from first interaction to browser response",
    },
    {
      name: "CLS",
      fullName: "Cumulative Layout Shift",
      value: metrics.cls,
      unit: "",
      thresholds: WEB_VITALS_THRESHOLDS.cls,
      description: "Visual stability - measures unexpected layout shifts",
    },
    {
      name: "FCP",
      fullName: "First Contentful Paint",
      value: metrics.fcp,
      unit: "ms",
      thresholds: WEB_VITALS_THRESHOLDS.fcp,
      description: "First paint - time until first content is rendered",
    },
    {
      name: "TTFB",
      fullName: "Time to First Byte",
      value: metrics.ttfb,
      unit: "ms",
      thresholds: WEB_VITALS_THRESHOLDS.ttfb,
      description: "Server response - time to receive first byte from server",
    },
    {
      name: "INP",
      fullName: "Interaction to Next Paint",
      value: metrics.inp,
      unit: "ms",
      thresholds: WEB_VITALS_THRESHOLDS.inp,
      description: "Responsiveness - latency of all interactions during page life",
    },
  ];

  // Calculate overall score
  const calculateOverallScore = () => {
    let score = 100;
    let counted = 0;

    webVitals.forEach(({ value, thresholds }) => {
      if (value !== null) {
        counted++;
        if (value > thresholds.needsImprovement) {
          score -= 20;
        } else if (value > thresholds.good) {
          score -= 10;
        }
      }
    });

    return counted > 0 ? Math.max(0, score) : null;
  };

  const overallScore = calculateOverallScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Performance Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Real-time Core Web Vitals and optimization metrics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Score & Image Optimization Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className={`text-4xl font-bold ${
                overallScore === null ? "text-muted-foreground" :
                overallScore >= 90 ? "text-green-500" :
                overallScore >= 50 ? "text-yellow-500" : "text-red-500"
              }`}>
                {overallScore !== null ? overallScore : "—"}
              </span>
              <span className="text-muted-foreground mb-1">/100</span>
            </div>
            {overallScore !== null && (
              <Progress 
                value={overallScore} 
                className="mt-2 h-2"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              Image Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={settings.enabled ? "default" : "secondary"}>
                {settings.enabled ? "Enabled" : "Disabled"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {settings.format.toUpperCase()} @ {settings.quality}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Max: {settings.maxWidth}×{settings.maxHeight}px
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-green-500" />
              Estimated Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-green-500">
                {formatBytes(metrics.estimatedSavings)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ~30% from WebP conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Core Web Vitals</CardTitle>
          <CardDescription>
            Google's metrics for measuring user experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {webVitals.map((vital) => (
              <div
                key={vital.name}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(vital.value, vital.thresholds)}
                    <span className="font-semibold">{vital.name}</span>
                  </div>
                  {getStatusBadge(vital.value, vital.thresholds)}
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(vital.value, vital.thresholds)}`}>
                  {vital.value !== null ? `${vital.value}${vital.unit}` : "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {vital.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Good: ≤{vital.thresholds.good}{vital.unit}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Page Load Times
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">DOM Content Loaded</span>
              <span className="font-mono text-sm">
                {metrics.domContentLoaded !== null ? `${metrics.domContentLoaded}ms` : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Page Load Complete</span>
              <span className="font-mono text-sm">
                {metrics.loadComplete !== null ? `${metrics.loadComplete}ms` : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Resources</span>
              <span className="font-mono text-sm">{metrics.totalResources}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Transfer Size</span>
              <span className="font-mono text-sm">{formatBytes(metrics.totalTransferSize)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="w-4 h-4" />
              Image Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Images Loaded</span>
              <span className="font-mono text-sm">{metrics.imageCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Image Transfer Size</span>
              <span className="font-mono text-sm">{formatBytes(metrics.imageTransferSize)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Avg per Image</span>
              <span className="font-mono text-sm">
                {metrics.imageCount > 0 
                  ? formatBytes(metrics.imageTransferSize / metrics.imageCount)
                  : "—"
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-500">Potential Savings</span>
              <span className="font-mono text-sm text-green-500">
                {formatBytes(metrics.estimatedSavings)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optimization Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Enable image optimization to automatically convert images to WebP format</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Use priority loading for above-the-fold hero images</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Lazy load images that are below the fold</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Keep LCP under 2.5s for optimal user experience</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Minimize CLS by specifying image dimensions</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;
