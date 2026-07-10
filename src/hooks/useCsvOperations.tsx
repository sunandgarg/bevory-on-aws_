import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface CsvOperationsConfig<T> {
  tableName: string;
  columns: string[];
  formatRow?: (row: T) => Record<string, string>;
  parseRow?: (row: Record<string, string>) => Partial<T>;
  excludeColumns?: string[];
}

export function useCsvOperations<T>(
  config: CsvOperationsConfig<T>
) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToCsv = (data: T[], filename?: string) => {
    if (!data.length) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const headers = config.columns.filter(
      (col) => !config.excludeColumns?.includes(col)
    );

    const rows = data.map((item) => {
      if (config.formatRow) {
        const formatted = config.formatRow(item);
        return headers.map((h) => escapeCSV(formatted[h] ?? ""));
      }
      return headers.map((h) => escapeCSV(String(item[h] ?? "")));
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `${config.tableName}_export_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported successfully", description: `${data.length} rows exported` });
  };

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h.trim()] = values[idx]?.trim() ?? "";
      });
      rows.push(row);
    }

    return rows;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const importFromCsv = (
    file: File,
    onParsed: (rows: Partial<T>[]) => Promise<void>
  ) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rawRows = parseCSV(text);

        const parsedRows = rawRows.map((row) => {
          if (config.parseRow) {
            return config.parseRow(row);
          }
          // Default parsing - handle arrays and JSON
          const parsed: Record<string, unknown> = {};
          Object.entries(row).forEach(([key, value]) => {
            if (config.excludeColumns?.includes(key)) return;
            if (value === "") {
              parsed[key] = null;
            } else if (value.startsWith("[") || value.startsWith("{")) {
              try {
                parsed[key] = JSON.parse(value);
              } catch {
                parsed[key] = value;
              }
            } else if (value === "true") {
              parsed[key] = true;
            } else if (value === "false") {
              parsed[key] = false;
            } else if (!isNaN(Number(value)) && value !== "") {
              parsed[key] = Number(value);
            } else {
              parsed[key] = value;
            }
          });
          return parsed as Partial<T>;
        });

        await onParsed(parsedRows);
        toast({
          title: "Import complete",
          description: `${parsedRows.length} rows processed`,
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return {
    exportToCsv,
    importFromCsv,
    triggerFileInput,
    fileInputRef,
  };
}

function escapeCSV(value: string): string {
  if (typeof value !== "string") {
    value = JSON.stringify(value) ?? "";
  }
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
