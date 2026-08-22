import { useState, useRef } from "react";
import { Download, Upload, Loader2, Database, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";

const AdminDatabaseTools = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastExport, setLastExport] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    setProgress(10);

    try {
      const { data, error } = await apiClient.functions.invoke('export-database', {
        body: { action: 'export' },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Export failed');

      setProgress(80);

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bevory-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setProgress(100);
      setLastExport(new Date().toISOString());

      const totalRows = Object.values(data.summary as Record<string, number>).reduce((a, b) => a + b, 0);
      toast({
        title: "Export Complete",
        description: `Downloaded ${totalRows.toLocaleString()} records across ${Object.keys(data.summary).length} tables.`,
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export database",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({ title: "Invalid file", description: "Please select a JSON backup file", variant: "destructive" });
      return;
    }

    const confirmed = window.confirm(
      "⚠️ This will merge data into your database. Existing records with the same IDs will be updated. Are you sure?"
    );
    if (!confirmed) return;

    setImporting(true);
    setProgress(10);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.data) {
        throw new Error('Invalid backup file format. Expected "data" field.');
      }

      setProgress(30);

      const { data, error } = await apiClient.functions.invoke('export-database', {
        body: { action: 'import', data: parsed.data },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Import failed');

      setProgress(100);

      const totalInserted = Object.values(data.results as Record<string, { inserted: number }>)
        .reduce((sum, r) => sum + r.inserted, 0);
      const totalErrors = Object.values(data.results as Record<string, { errors: number }>)
        .reduce((sum, r) => sum + r.errors, 0);

      toast({
        title: "Import Complete",
        description: `Imported ${totalInserted.toLocaleString()} records. ${totalErrors > 0 ? `${totalErrors} errors.` : ''}`,
        variant: totalErrors > 0 ? "destructive" : "default",
      });
    } catch (err: any) {
      toast({
        title: "Import Failed",
        description: err.message || "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setTimeout(() => setProgress(0), 2000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="w-6 h-6" />
          Database Tools
        </h1>
        <p className="text-muted-foreground">Export and import your entire database with one click.</p>
      </div>

      {progress > 0 && (
        <Progress value={progress} className="h-2" />
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Export Database
            </CardTitle>
            <CardDescription>
              Download all tables as a single JSON backup file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleExport}
              disabled={exporting || importing}
              className="w-full"
              size="lg"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Full Backup
                </>
              )}
            </Button>
            {lastExport && (
              <p className="text-xs text-muted-foreground text-center">
                Last export: {new Date(lastExport).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-accent" />
              Import Database
            </CardTitle>
            <CardDescription>
              Upload a JSON backup to restore or merge data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing || exporting}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Backup File
                </>
              )}
            </Button>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Import merges data — existing records with the same IDs will be updated. New records will be inserted.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDatabaseTools;
