import { useState, useEffect, useMemo, useCallback } from "react";
import { Download, Upload, Search, Save, Loader2, AlertTriangle, Percent, Check, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

/* ========== TYPES ========== */

interface ProductPrice {
  id: string;
  product_id: string;
  city_id: string;
  volume: string | null;
  price: number;
  mrp: number | null;
}

interface Product {
  id: string;
  name: string;
  brand: string;
}

interface City {
  id: string;
  name: string;
}

interface PriceRow {
  product_id: string;
  product_name: string;
  brand: string;
  volume: string;
  prices: Record<string, { id?: string; price: number }>;
}

type ValidationFlag = "missing" | "zero" | "high" | "low" | null;

/* ========== COMPONENT ========== */

const AdminProductPrices = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVolume, setSelectedVolume] = useState<string>("all");
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showScrapeDialog, setShowScrapeDialog] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeLog, setScrapeLog] = useState<string[]>([]);
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [bulkAction, setBulkAction] = useState<"increase" | "decrease" | "set">("increase");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkPreview, setBulkPreview] = useState<{ key: string; old: number; new: number }[]>([]);
  const { toast } = useToast();

  const volumeOptions = ["60ml", "90ml", "180ml", "330ml", "350ml", "375ml", "500ml", "650ml", "750ml", "1L", "1000ml", "2L"];

  /* ========== DATA FETCH ========== */

  const fetchData = async () => {
    setLoading(true);
    const [pricesRes, productsRes, citiesRes] = await Promise.all([
      supabase.from("product_prices").select("*"),
      supabase.from("products").select("id, name, brand").order("brand, name"),
      supabase.from("cities").select("id, name").eq("is_visible", true).order("name"),
    ]);
    if (pricesRes.data) setPrices(pricesRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    if (citiesRes.data) setCities(citiesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  /* ========== PRICE ROWS ========== */

  const priceRows = useMemo(() => {
    const productVolumeMap = new Map<string, PriceRow>();
    for (const price of prices) {
      const key = `${price.product_id}_${price.volume || "750ml"}`;
      const product = products.find(p => p.id === price.product_id);
      if (!product) continue;
      if (!productVolumeMap.has(key)) {
        productVolumeMap.set(key, {
          product_id: price.product_id,
          product_name: product.name,
          brand: product.brand,
          volume: price.volume || "750ml",
          prices: {},
        });
      }
      productVolumeMap.get(key)!.prices[price.city_id] = { id: price.id, price: price.price };
    }
    return Array.from(productVolumeMap.values());
  }, [prices, products]);

  /* ========== PRICE STATISTICS FOR VALIDATION ========== */

  const priceStats = useMemo(() => {
    const stats = new Map<string, { mean: number; std: number }>();
    // Group by volume
    const volumeGroups = new Map<string, number[]>();
    for (const row of priceRows) {
      const vals = Object.values(row.prices).map(p => p.price).filter(p => p > 0);
      if (!volumeGroups.has(row.volume)) volumeGroups.set(row.volume, []);
      volumeGroups.get(row.volume)!.push(...vals);
    }
    for (const [vol, vals] of volumeGroups) {
      if (vals.length === 0) continue;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
      stats.set(vol, { mean, std: Math.sqrt(variance) });
    }
    return stats;
  }, [priceRows]);

  const getValidationFlag = useCallback((price: number | undefined, volume: string): ValidationFlag => {
    if (price === undefined) return "missing";
    if (price === 0) return "zero";
    const stat = priceStats.get(volume);
    if (!stat || stat.std === 0) return null;
    const zScore = (price - stat.mean) / stat.std;
    if (zScore > 2.5) return "high";
    if (zScore < -2) return "low";
    return null;
  }, [priceStats]);

  const getValidationTooltip = (flag: ValidationFlag): string => {
    switch (flag) {
      case "missing": return "Price is missing";
      case "zero": return "Price is zero";
      case "high": return "Unusually high compared to similar products";
      case "low": return "Unusually low compared to similar products";
      default: return "";
    }
  };

  const getValidationColor = (flag: ValidationFlag): string => {
    switch (flag) {
      case "missing": return "bg-muted/50";
      case "zero": return "bg-destructive/10";
      case "high": return "bg-warning/10";
      case "low": return "bg-warning/10";
      default: return "";
    }
  };

  /* ========== FILTERING ========== */

  const filteredRows = useMemo(() => {
    let result = priceRows;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(row =>
        row.product_name.toLowerCase().includes(q) || row.brand.toLowerCase().includes(q)
      );
    }
    if (selectedVolume !== "all") {
      result = result.filter(row => row.volume === selectedVolume);
    }
    return result.sort((a, b) => {
      const bc = a.brand.localeCompare(b.brand);
      if (bc !== 0) return bc;
      const nc = a.product_name.localeCompare(b.product_name);
      if (nc !== 0) return nc;
      return volumeOptions.indexOf(a.volume) - volumeOptions.indexOf(b.volume);
    });
  }, [priceRows, searchQuery, selectedVolume]);

  /* ========== EDITING ========== */

  const handlePriceChange = (rowKey: string, cityId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedPrices(prev => ({ ...prev, [`${rowKey}_${cityId}`]: numValue }));
  };

  const getDisplayPrice = (row: PriceRow, cityId: string): string => {
    const editKey = `${row.product_id}_${row.volume}_${cityId}`;
    if (editedPrices[editKey] !== undefined) return editedPrices[editKey].toString();
    return row.prices[cityId]?.price?.toString() || "";
  };

  const getCurrentPrice = (row: PriceRow, cityId: string): number | undefined => {
    const editKey = `${row.product_id}_${row.volume}_${cityId}`;
    if (editedPrices[editKey] !== undefined) return editedPrices[editKey];
    return row.prices[cityId]?.price;
  };

  /* ========== SAVE ========== */

  const saveAllChanges = async () => {
    if (Object.keys(editedPrices).length === 0) {
      toast({ title: "No changes", description: "No prices were modified" });
      return;
    }
    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const [key, newPrice] of Object.entries(editedPrices)) {
      const parts = key.split("_");
      const cityId = parts.pop()!;
      const volume = parts.pop()!;
      const productId = parts.join("_");
      try {
        const existingRow = priceRows.find(r => r.product_id === productId && r.volume === volume);
        const existingPrice = existingRow?.prices[cityId];
        if (existingPrice?.id) {
          const { error } = await supabase.from("product_prices").update({ price: newPrice }).eq("id", existingPrice.id);
          if (error) throw error;
        } else if (newPrice > 0) {
          const { error } = await supabase.from("product_prices").insert({
            product_id: productId, city_id: cityId, volume, price: newPrice, in_stock: true,
          });
          if (error) throw error;
        }
        successCount++;
      } catch {
        errorCount++;
      }
    }
    setSaving(false);
    setEditedPrices({});
    toast({
      title: "Saved",
      description: `${successCount} prices updated${errorCount > 0 ? `, ${errorCount} errors` : ""}`,
      variant: errorCount > 0 ? "destructive" : "default",
    });
    fetchData();
  };

  /* ========== BULK UPDATE ========== */

  const rowKey = (row: PriceRow) => `${row.product_id}_${row.volume}`;
  const isRowSelected = (row: PriceRow) => selectedRows.has(rowKey(row));
  const allSelected = filteredRows.length > 0 && filteredRows.every(r => selectedRows.has(rowKey(r)));

  const toggleRow = (row: PriceRow) => {
    const key = rowKey(row);
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredRows.map(rowKey)));
    }
  };

  const prepareBulkUpdate = () => {
    const val = parseFloat(bulkValue);
    if (isNaN(val) || val === 0) return;

    const preview: typeof bulkPreview = [];
    const selectedRowsList = filteredRows.filter(r => selectedRows.has(rowKey(r)));

    for (const row of selectedRowsList) {
      for (const city of cities) {
        const currentP = row.prices[city.id]?.price;
        if (!currentP || currentP <= 0) continue;

        let newP: number;
        if (bulkAction === "increase") newP = Math.round(currentP * (1 + val / 100));
        else if (bulkAction === "decrease") newP = Math.round(currentP * (1 - val / 100));
        else newP = val;

        if (newP !== currentP) {
          preview.push({ key: `${row.product_id}_${row.volume}_${city.id}`, old: currentP, new: newP });
        }
      }
    }
    setBulkPreview(preview);
  };

  const applyBulkUpdate = () => {
    const updates: Record<string, number> = {};
    for (const item of bulkPreview) {
      updates[item.key] = item.new;
    }
    setEditedPrices(prev => ({ ...prev, ...updates }));
    setShowBulkDialog(false);
    setBulkPreview([]);
    setBulkValue("");
    setSelectedRows(new Set());
    toast({ title: "Bulk update applied", description: `${bulkPreview.length} prices updated. Click Save to persist.` });
  };

  /* ========== EXPORT/IMPORT ========== */

  const exportPrices = () => {
    const headers = ["Brand", "Product", "Volume", ...cities.map(c => c.name)];
    const rows = filteredRows.map(row => [
      `"${row.brand}"`, `"${row.product_name}"`, row.volume,
      ...cities.map(city => row.prices[city.id]?.price || ""),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "product_prices_matrix.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${filteredRows.length} rows exported` });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      if (lines.length < 2) {
        toast({ title: "Error", description: "CSV file is empty", variant: "destructive" });
        return;
      }
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ''));
      const cityColumns = headers.slice(3);
      const cityNameToId: Record<string, string> = {};
      for (const city of cities) cityNameToId[city.name.toLowerCase()] = city.id;

      let successCount = 0;
      let errorCount = 0;
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i]);
          const brand = values[0]?.replace(/"/g, '').trim();
          const productName = values[1]?.replace(/"/g, '').trim();
          const volume = values[2]?.trim();
          const product = products.find(
            p => p.brand.toLowerCase() === brand.toLowerCase() && p.name.toLowerCase() === productName.toLowerCase()
          );
          if (!product) { errorCount++; continue; }

          for (let j = 0; j < cityColumns.length; j++) {
            const cityId = cityNameToId[cityColumns[j].toLowerCase()];
            const priceValue = parseFloat(values[3 + j]) || 0;
            if (!cityId || priceValue <= 0) continue;
            const { data: existing } = await supabase.from("product_prices").select("id")
              .eq("product_id", product.id).eq("city_id", cityId).eq("volume", volume).maybeSingle();
            if (existing) {
              await supabase.from("product_prices").update({ price: priceValue }).eq("id", existing.id);
            } else {
              await supabase.from("product_prices").insert({
                product_id: product.id, city_id: cityId, volume, price: priceValue, in_stock: true,
              });
            }
          }
          successCount++;
        } catch { errorCount++; }
      }
      toast({
        title: "Import Complete",
        description: `${successCount} rows processed, ${errorCount} errors`,
        variant: errorCount > successCount ? "destructive" : "default",
      });
      fetchData();
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "", inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { result.push(current); current = ""; }
      else current += char;
    }
    result.push(current);
    return result;
  };

  const SCRAPE_CITIES = [
    'Bangalore', 'Bhopal', 'Gurgaon', 'Hyderabad', 'Indore', 'Jaipur',
    'Kolkata', 'Lucknow', 'Mumbai', 'Mysore', 'Nagpur', 'New Delhi',
    'Noida', 'Panaji', 'Pune',
  ];

  const startScrape = async () => {
    setScraping(true);
    setScrapeLog([]);
    setScrapeProgress(0);

    const scrapeCities = cities.filter(c => SCRAPE_CITIES.includes(c.name));
    let completed = 0;

    for (const city of scrapeCities) {
      setScrapeLog(prev => [...prev, `⏳ Scraping ${city.name}...`]);
      try {
        const { data, error } = await supabase.functions.invoke('scrape-prices', {
          body: { city_name: city.name, city_id: city.id },
        });

        if (error) {
          setScrapeLog(prev => [...prev, `❌ ${city.name}: ${error.message}`]);
        } else if (data?.success) {
          setScrapeLog(prev => [...prev, 
            `✅ ${city.name}: scraped ${data.total_scraped}, matched ${data.matched}, saved ${data.upserted}` +
            (data.unmatched_count > 0 ? ` (${data.unmatched_count} unmatched)` : '')
          ]);
        } else {
          setScrapeLog(prev => [...prev, `⚠️ ${city.name}: ${data?.error || 'No products found'}`]);
        }
      } catch (err) {
        setScrapeLog(prev => [...prev, `❌ ${city.name}: ${err instanceof Error ? err.message : 'Failed'}`]);
      }

      completed++;
      setScrapeProgress(Math.round((completed / scrapeCities.length) * 100));
    }

    setScrapeLog(prev => [...prev, `\n🎉 Done! Scraping complete for ${scrapeCities.length} cities.`]);
    setScraping(false);
    toast({ title: "Scraping Complete", description: `Processed ${scrapeCities.length} cities` });
    fetchData(); // Refresh prices
  };

  const hasChanges = Object.keys(editedPrices).length > 0;
  const hasSelection = selectedRows.size > 0;

  /* ========== RENDER ========== */

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Product Prices</h2>
            <p className="text-xs text-muted-foreground">
              {filteredRows.length} rows · {cities.length} cities · {selectedRows.size > 0 ? `${selectedRows.size} selected` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-8 h-8 w-[160px] text-xs"
              />
            </div>

            <Select value={selectedVolume} onValueChange={setSelectedVolume}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue placeholder="Volume" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Volumes</SelectItem>
                {volumeOptions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>

            {hasSelection && (
              <Button size="sm" variant="outline" onClick={() => setShowBulkDialog(true)} className="h-8 text-xs">
                <Percent className="w-3 h-3 mr-1" />
                Bulk Update ({selectedRows.size})
              </Button>
            )}

            {hasChanges && (
              <Button size="sm" onClick={saveAllChanges} disabled={saving} className="h-8 text-xs">
                {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                Save ({Object.keys(editedPrices).length})
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={exportPrices} className="h-8 text-xs">
              <Download className="w-3 h-3 mr-1" /> Export
            </Button>

            <div className="relative">
              <input type="file" accept=".csv" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Upload className="w-3 h-3 mr-1" /> Import
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowScrapeDialog(true)} className="h-8 text-xs">
              <Globe className="w-3 h-3 mr-1" /> Scrape Prices
            </Button>
          </div>
        </div>

        {/* Scrape Dialog */}
        <Dialog open={showScrapeDialog} onOpenChange={setShowScrapeDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Scrape Prices from Livcheers</DialogTitle>
              <DialogDescription>
                Scrape authentic prices from livcheers.com for {SCRAPE_CITIES.length} cities. This will match products by name/slug and update existing prices.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                <strong>Cities:</strong> {SCRAPE_CITIES.join(', ')}
              </div>
              {scraping && (
                <div className="space-y-2">
                  <Progress value={scrapeProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{scrapeProgress}% complete</p>
                </div>
              )}
              {scrapeLog.length > 0 && (
                <ScrollArea className="h-[200px] border rounded-lg p-3 bg-muted/30">
                  <div className="space-y-1">
                    {scrapeLog.map((log, i) => (
                      <p key={i} className="text-xs font-mono">{log}</p>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowScrapeDialog(false)} disabled={scraping}>
                Close
              </Button>
              <Button onClick={startScrape} disabled={scraping}>
                {scraping ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Scraping...</> : <><Globe className="w-3 h-3 mr-1" /> Start Scraping</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <ScrollArea className="w-full">
              <div className="min-w-max">
                {/* Header */}
                <div className="flex bg-muted/50 border-b border-border sticky top-0 z-10">
                  <div className="w-10 min-w-[40px] px-2 py-2 flex items-center justify-center sticky left-0 bg-muted/50 z-20 border-r border-border/50">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                  </div>
                  <div className="w-[120px] min-w-[120px] px-2 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border/50 sticky left-10 bg-muted/50 z-20">
                    Brand
                  </div>
                  <div className="w-[160px] min-w-[160px] px-2 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border/50 sticky left-[168px] bg-muted/50 z-20">
                    Product
                  </div>
                  <div className="w-[64px] min-w-[64px] px-2 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border/50 sticky left-[328px] bg-muted/50 z-20">
                    Vol
                  </div>
                  {cities.map(city => (
                    <div key={city.id} className="w-[80px] min-w-[80px] px-1 py-2 text-[10px] font-medium text-muted-foreground text-center border-r border-border/50 truncate">
                      {city.name}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                <ScrollArea className="h-[calc(100vh-260px)]">
                  {filteredRows.length === 0 ? (
                    <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                      No products found
                    </div>
                  ) : (
                    filteredRows.map((row, idx) => {
                      const selected = isRowSelected(row);
                      return (
                        <div
                          key={`${row.product_id}_${row.volume}`}
                          className={`flex border-b border-border/50 transition-colors duration-100 ${
                            selected ? "bg-accent/5" : idx % 2 === 0 ? "bg-card" : "bg-muted/20"
                          } hover:bg-muted/30`}
                        >
                          <div className="w-10 min-w-[40px] px-2 py-1 flex items-center justify-center sticky left-0 bg-inherit z-10 border-r border-border/30">
                            <Checkbox checked={selected} onCheckedChange={() => toggleRow(row)} aria-label={`Select ${row.product_name}`} />
                          </div>
                          <div className="w-[120px] min-w-[120px] px-2 py-1.5 text-xs border-r border-border/30 truncate sticky left-10 bg-inherit z-10 flex items-center">
                            {row.brand}
                          </div>
                          <div className="w-[160px] min-w-[160px] px-2 py-1.5 text-xs font-medium border-r border-border/30 truncate sticky left-[168px] bg-inherit z-10 flex items-center">
                            {row.product_name}
                          </div>
                          <div className="w-[64px] min-w-[64px] px-2 py-1.5 text-[10px] text-muted-foreground border-r border-border/30 sticky left-[328px] bg-inherit z-10 flex items-center">
                            {row.volume}
                          </div>
                          {cities.map(city => {
                            const price = getCurrentPrice(row, city.id);
                            const flag = getValidationFlag(price, row.volume);
                            return (
                              <div key={city.id} className={`w-[80px] min-w-[80px] px-0.5 py-0.5 border-r border-border/30 ${getValidationColor(flag)}`}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        value={getDisplayPrice(row, city.id)}
                                        onChange={(e) => handlePriceChange(
                                          `${row.product_id}_${row.volume}`,
                                          city.id,
                                          e.target.value
                                        )}
                                        placeholder="—"
                                        className={`h-7 text-[11px] text-center px-1 border-0 bg-transparent focus:bg-card focus:ring-1 focus:ring-ring rounded ${
                                          flag === "high" || flag === "low" ? "text-warning" : ""
                                        } ${flag === "zero" ? "text-destructive" : ""}`}
                                      />
                                      {flag && flag !== "missing" && (
                                        <AlertTriangle className={`absolute right-0.5 top-0.5 w-2.5 h-2.5 ${
                                          flag === "zero" ? "text-destructive" : "text-warning"
                                        }`} />
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  {flag && (
                                    <TooltipContent side="top" className="text-xs">
                                      {getValidationTooltip(flag)}
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </ScrollArea>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Bulk Update Dialog */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Bulk Price Update</DialogTitle>
              <DialogDescription className="text-xs">
                Apply changes to {selectedRows.size} selected rows across all cities.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-2">
                {(["increase", "decrease", "set"] as const).map(action => (
                  <button
                    key={action}
                    onClick={() => setBulkAction(action)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      bulkAction === action
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {action === "increase" ? "↑ Increase %" : action === "decrease" ? "↓ Decrease %" : "= Set Price"}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {bulkAction === "set" ? "Fixed Price (₹)" : "Percentage (%)"}
                </label>
                <Input
                  type="number"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  placeholder={bulkAction === "set" ? "e.g. 1500" : "e.g. 10"}
                  className="h-9 text-sm"
                />
              </div>

              <Button size="sm" variant="outline" onClick={prepareBulkUpdate} className="w-full text-xs">
                Preview Changes
              </Button>

              {bulkPreview.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
                    {bulkPreview.length} price changes
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {bulkPreview.slice(0, 20).map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs border-b border-border/30">
                        <span className="text-muted-foreground truncate flex-1">{item.key.split('_').slice(0, -1).join('_')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through">₹{item.old}</span>
                          <span className="font-medium">₹{item.new}</span>
                        </div>
                      </div>
                    ))}
                    {bulkPreview.length > 20 && (
                      <div className="px-3 py-1.5 text-xs text-muted-foreground">
                        +{bulkPreview.length - 20} more...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowBulkDialog(false)} className="text-xs">
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={applyBulkUpdate} disabled={bulkPreview.length === 0} className="text-xs">
                <Check className="w-3 h-3 mr-1" /> Apply {bulkPreview.length} Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default AdminProductPrices;
