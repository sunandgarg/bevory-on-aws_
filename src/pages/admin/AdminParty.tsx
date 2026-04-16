import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import FormField from "@/components/admin/FormField";
import { useFormValidation, ValidationSchema } from "@/hooks/useFormValidation";
import CsvButtons from "@/components/admin/CsvButtons";
import { useCsvOperations } from "@/hooks/useCsvOperations";

interface PartyRecommendation {
  id: string;
  category_id: string | null;
  min_guests: number;
  max_guests: number;
  min_budget: number;
  max_budget: number;
  recommended_quantity: number;
  notes: string | null;
}

interface Category {
  id: string;
  name: string;
  emoji: string | null;
}

const validationSchema: ValidationSchema = {
  min_guests: { required: true },
  max_guests: { required: true },
  min_budget: { required: true },
  max_budget: { required: true },
  recommended_quantity: { required: true },
};

const AdminParty = () => {
  const [recommendations, setRecommendations] = useState<PartyRecommendation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<PartyRecommendation | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();
  const { errors, validate, clearErrors, clearError } = useFormValidation(validationSchema);

  const fetchData = async () => {
    const [recsRes, catsRes] = await Promise.all([
      supabase.from("party_recommendations").select("*").order("min_guests, min_budget"),
      supabase.from("categories").select("id, name, emoji").order("name"),
    ]);
    if (recsRes.data) setRecommendations(recsRes.data);
    if (catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!editItem) return;

    if (!validate({
      min_guests: editItem.min_guests,
      max_guests: editItem.max_guests,
      min_budget: editItem.min_budget,
      max_budget: editItem.max_budget,
      recommended_quantity: editItem.recommended_quantity,
    })) {
      toast({ title: "Validation Error", description: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }

    const data = {
      category_id: editItem.category_id || null,
      min_guests: Number(editItem.min_guests),
      max_guests: Number(editItem.max_guests),
      min_budget: Number(editItem.min_budget),
      max_budget: Number(editItem.max_budget),
      recommended_quantity: Number(editItem.recommended_quantity),
      notes: editItem.notes || null,
    };

    const { error } = editItem.id
      ? await supabase.from("party_recommendations").update(data).eq("id", editItem.id)
      : await supabase.from("party_recommendations").insert(data);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved" });
      setShowDialog(false);
      clearErrors();
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this recommendation?")) return;
    await supabase.from("party_recommendations").delete().eq("id", id);
    fetchData();
  };

  const openDialog = (item: PartyRecommendation) => {
    setEditItem(item);
    clearErrors();
    setShowDialog(true);
  };

  const newItem: PartyRecommendation = {
    id: "",
    category_id: null,
    min_guests: 1,
    max_guests: 10,
    min_budget: 1000,
    max_budget: 5000,
    recommended_quantity: 2,
    notes: "",
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return "All Categories";
    const cat = categories.find((c) => c.id === id);
    return cat ? `${cat.emoji || ""} ${cat.name}` : "Unknown";
  };

  const csvOps = useCsvOperations<PartyRecommendation>({
    tableName: "party_recommendations",
    columns: ["id", "category_id", "min_guests", "max_guests", "min_budget", "max_budget", "recommended_quantity", "notes"],
    excludeColumns: ["id"],
  });

  const handleCsvImport = async (rows: Partial<PartyRecommendation>[]) => {
    for (const row of rows) {
      const { id, ...data } = row as PartyRecommendation;
      if (id) {
        await supabase.from("party_recommendations").update(data).eq("id", id);
      } else {
        await supabase.from("party_recommendations").insert(data);
      }
    }
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Party Recommendations</h2>
        <div className="flex items-center gap-2">
          <CsvButtons
            onExport={() => csvOps.exportToCsv(recommendations)}
            onImportClick={csvOps.triggerFileInput}
            fileInputRef={csvOps.fileInputRef}
            onFileChange={(e) => {
              const file = e.target.files?.[0];
              if (file) csvOps.importFromCsv(file, handleCsvImport);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={() => openDialog(newItem)}>
            <Plus className="w-4 h-4 mr-1" /> Add Rule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-card border text-center">
          <p className="text-2xl font-bold">{recommendations.length}</p>
          <p className="text-sm text-muted-foreground">Total Rules</p>
        </div>
        <div className="p-4 rounded-xl bg-card border text-center">
          <p className="text-2xl font-bold">{new Set(recommendations.map(r => r.category_id)).size}</p>
          <p className="text-sm text-muted-foreground">Categories</p>
        </div>
        <div className="p-4 rounded-xl bg-card border text-center">
          <p className="text-2xl font-bold">
            {Math.max(...recommendations.map(r => r.max_guests), 0)}
          </p>
          <p className="text-sm text-muted-foreground">Max Guests</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-2">📋 How Party Rules Work</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Rules match guest count and budget range to recommend drink quantities</li>
          <li>• Category-specific rules override general rules</li>
          <li>• Leave category empty for catch-all recommendations</li>
        </ul>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-2">
          {recommendations.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{getCategoryName(r.category_id)}</Badge>
                  <span className="text-sm">
                    {r.min_guests}-{r.max_guests} guests
                  </span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm">
                    ₹{r.min_budget.toLocaleString()}-₹{r.max_budget.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm mt-1">
                  <strong>Recommend:</strong> {r.recommended_quantity} bottles
                  {r.notes && <span className="text-muted-foreground"> — {r.notes}</span>}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => openDialog(r)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => handleDelete(r.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {recommendations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No recommendations yet. Add your first rule!
            </div>
          )}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem?.id ? "Edit" : "Add"} Party Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Category (optional)">
              <Select
                value={editItem?.category_id || "all"}
                onValueChange={(v) => setEditItem((p) => (p ? { ...p, category_id: v === "all" ? null : v } : p))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Min Guests" required error={errors.min_guests}>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={editItem?.min_guests || ""}
                  onChange={(e) => {
                    setEditItem((p) => (p ? { ...p, min_guests: Number(e.target.value) } : p));
                    clearError("min_guests");
                  }}
                />
              </FormField>
              <FormField label="Max Guests" required error={errors.max_guests}>
                <Input
                  type="number"
                  min="1"
                  placeholder="10"
                  value={editItem?.max_guests || ""}
                  onChange={(e) => {
                    setEditItem((p) => (p ? { ...p, max_guests: Number(e.target.value) } : p));
                    clearError("max_guests");
                  }}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Min Budget (₹)" required error={errors.min_budget}>
                <Input
                  type="number"
                  min="0"
                  placeholder="1000"
                  value={editItem?.min_budget || ""}
                  onChange={(e) => {
                    setEditItem((p) => (p ? { ...p, min_budget: Number(e.target.value) } : p));
                    clearError("min_budget");
                  }}
                />
              </FormField>
              <FormField label="Max Budget (₹)" required error={errors.max_budget}>
                <Input
                  type="number"
                  min="0"
                  placeholder="5000"
                  value={editItem?.max_budget || ""}
                  onChange={(e) => {
                    setEditItem((p) => (p ? { ...p, max_budget: Number(e.target.value) } : p));
                    clearError("max_budget");
                  }}
                />
              </FormField>
            </div>

            <FormField label="Recommended Quantity (bottles)" required error={errors.recommended_quantity}>
              <Input
                type="number"
                min="1"
                placeholder="2"
                value={editItem?.recommended_quantity || ""}
                onChange={(e) => {
                  setEditItem((p) => (p ? { ...p, recommended_quantity: Number(e.target.value) } : p));
                  clearError("recommended_quantity");
                }}
              />
            </FormField>

            <FormField label="Notes (optional)">
              <Textarea
                placeholder="e.g., Good for casual gatherings..."
                value={editItem?.notes || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, notes: e.target.value } : p))}
                rows={2}
              />
            </FormField>

            <Button className="w-full" onClick={handleSave}>
              Save Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminParty;