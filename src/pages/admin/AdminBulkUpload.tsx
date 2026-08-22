import { useState, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/integrations/api/client";
import { toast } from "sonner";

type UploadMode = "products" | "prices";

const SAMPLE_PRODUCTS_CSV = `name,brand,category_slug,volume,abv,origin,origin_flag,description,image_emoji,type_tag,taste_profile,tasting_notes,rating,slug
Johnnie Walker Black Label,Johnnie Walker,whisky,750ml,40,Scotland,🏴󠁧󠁢󠁳󠁣󠁴󠁿,A rich blend of whiskies aged 12 years,🥃,Blended,Complex & Smoky,Notes of vanilla smoke and dried fruit,4.3,johnnie-walker-black-label-750ml
Old Monk Rum 750ml,Old Monk,rum,750ml,42.8,India,🇮🇳,India's most iconic dark rum,🍹,Dark Rum,Rich & Sweet,Caramel vanilla and chocolate notes,4.5,old-monk-rum-750ml`;

const SAMPLE_PRICES_CSV = `product_slug,city_name,price,volume,mrp
johnnie-walker-black-label-750ml,Mumbai,4200,750ml,4500
johnnie-walker-black-label-750ml,Delhi,3800,750ml,4500
old-monk-rum-750ml,Mumbai,490,750ml,520
old-monk-rum-750ml,Goa,350,750ml,520`;

const AdminBulkUpload = () => {
  const [mode, setMode] = useState<UploadMode>("products");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = useCallback((text: string): Record<string, string>[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || "";
      });
      return row;
    });
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setFile(f);
      setResults(null);

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const rows = parseCSV(text);
        setParsedData(rows);
        toast.success(`Parsed ${rows.length} rows from CSV`);
      };
      reader.readAsText(f);
    },
    [parseCSV]
  );

  const handleUploadProducts = async (rows: Record<string, string>[]) => {
    // Fetch categories for mapping
    const { data: categories } = await apiClient
      .from("categories")
      .select("id, slug");
    const catMap = new Map(categories?.map((c) => [c.slug.toLowerCase(), c.id]) ?? []);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    const BATCH = 50;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH).map((row) => ({
        name: row.name,
        brand: row.brand,
        category_id: catMap.get(row.category_slug?.toLowerCase()) || null,
        volume: row.volume || "750ml",
        abv: row.abv ? parseFloat(row.abv) : null,
        origin: row.origin || null,
        origin_flag: row.origin_flag || null,
        description: row.description || null,
        image_emoji: row.image_emoji || "🥃",
        type_tag: row.type_tag || null,
        taste_profile: row.taste_profile || null,
        tasting_notes: row.tasting_notes || null,
        rating: row.rating ? parseFloat(row.rating) : null,
        slug: row.slug || null,
        meta_title: row.meta_title || null,
        meta_description: row.meta_description || null,
      }));

      const { error } = await apiClient.from("products").upsert(batch, { onConflict: "slug" });
      if (error) {
        failed += batch.length;
        errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${error.message}`);
      } else {
        success += batch.length;
      }
    }

    return { success, failed, errors };
  };

  const handleUploadPrices = async (rows: Record<string, string>[]) => {
    // Fetch products for slug → id mapping
    const { data: products } = await apiClient.from("products").select("id, slug");
    const prodMap = new Map(products?.map((p) => [p.slug?.toLowerCase(), p.id]) ?? []);

    // Fetch cities for name → id mapping
    const { data: cities } = await apiClient.from("cities").select("id, name");
    const cityMap = new Map(cities?.map((c) => [c.name.toLowerCase(), c.id]) ?? []);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    const BATCH = 100;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows
        .slice(i, i + BATCH)
        .map((row) => {
          const productId = prodMap.get(row.product_slug?.toLowerCase());
          const cityId = cityMap.get(row.city_name?.toLowerCase());
          if (!productId || !cityId) return null;
          return {
            product_id: productId,
            city_id: cityId,
            price: parseFloat(row.price),
            volume: row.volume || "750ml",
            mrp: row.mrp ? parseFloat(row.mrp) : null,
          };
        })
        .filter(Boolean);

      if (batch.length === 0) {
        failed += rows.slice(i, i + BATCH).length;
        errors.push(`Batch ${Math.floor(i / BATCH) + 1}: No valid product/city matches`);
        continue;
      }

      const { error } = await apiClient.from("product_prices").insert(batch as any[]);
      if (error) {
        failed += batch.length;
        errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${error.message}`);
      } else {
        success += batch.length;
      }
    }

    return { success, failed, errors };
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    setUploading(true);
    setResults(null);

    try {
      let result;
      if (mode === "products") {
        result = await handleUploadProducts(parsedData);
      } else {
        result = await handleUploadPrices(parsedData);
      }
      if (result) {
        setResults(result);
        if (result.success > 0) toast.success(`✅ ${result.success} rows uploaded`);
        if (result.failed > 0) toast.error(`❌ ${result.failed} rows failed`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadSample = (type: "products" | "prices") => {
    const csv = type === "products" ? SAMPLE_PRODUCTS_CSV : SAMPLE_PRICES_CSV;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sample-${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Bulk CSV Upload</h2>
        <p className="text-sm text-muted-foreground">
          Import products and prices from CSV files to quickly scale your catalog.
        </p>
      </div>

      {/* Mode selection */}
      <div className="flex gap-2">
        {(["products", "prices"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setParsedData([]); setFile(null); setResults(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              mode === m
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Sample downloads */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => downloadSample("products")}>
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Sample Products CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadSample("prices")}>
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Sample Prices CSV
        </Button>
      </div>

      {/* File upload */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">
          {file ? file.name : "Click to upload CSV file"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {parsedData.length > 0
            ? `${parsedData.length} rows parsed`
            : "Supports .csv files"}
        </p>
      </div>

      {/* Preview */}
      {parsedData.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <p className="text-xs font-medium">
              Preview (first 5 of {parsedData.length} rows)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  {Object.keys(parsedData[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="max-w-[200px] truncate text-xs">
                        {val as string}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload button */}
      {parsedData.length > 0 && (
        <Button onClick={handleUpload} disabled={uploading} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading {parsedData.length} rows...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload {parsedData.length} {mode}
            </>
          )}
        </Button>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-2">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="font-medium">{results.success}</span> success
            </div>
            {results.failed > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="font-medium">{results.failed}</span> failed
              </div>
            )}
          </div>
          {results.errors.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <p className="text-xs font-medium text-destructive mb-1">Errors:</p>
              {results.errors.map((err, i) => (
                <p key={i} className="text-xs text-muted-foreground">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminBulkUpload;
