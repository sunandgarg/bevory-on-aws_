import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Star, Flame, Search } from "lucide-react";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import FormField from "@/components/admin/FormField";
import { useFormValidation, ValidationSchema } from "@/hooks/useFormValidation";
import CsvButtons from "@/components/admin/CsvButtons";
import { useCsvOperations } from "@/hooks/useCsvOperations";
import { generateSlug } from "@/lib/slug";
import ImageUpload from "@/components/admin/ImageUpload";

interface Cocktail {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  image_emoji: string | null;
  image_url: string | null;
  ingredients: string[] | null;
  instructions: string | null;
  difficulty: string | null;
  prep_time: string | null;
  category: string | null;
  base_spirit: string | null;
  is_featured: boolean | null;
  is_popular: boolean | null;
  meta_title: string | null;
  meta_description: string | null;
}

const SPIRITS = ["Whiskey", "Vodka", "Rum", "Gin", "Tequila", "Brandy", "Other"];
const CATEGORIES = ["Classic", "Modern", "Tropical", "Shots", "Non-Alcoholic"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const validationSchema: ValidationSchema = {
  name: { required: true, minLength: 2 },
};

const AdminCocktails = () => {
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<Cocktail | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [ingredientsText, setIngredientsText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest" | "name">("latest");
  const [filterSpirit, setFilterSpirit] = useState<string>("all");
  const { toast } = useToast();
  const { errors, validate, clearErrors, clearError } = useFormValidation(validationSchema);

  const fetchData = async () => {
    const { data } = await apiClient
      .from("cocktails")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCocktails(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!editItem) return;

    if (!validate({ name: editItem.name })) {
      toast({ title: "Validation Error", description: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }

    const ingredientsArray = ingredientsText
      .split("\n")
      .map((i) => i.trim())
      .filter((i) => i);
    
    // Auto-generate slug if not set
    const slug = editItem.slug || generateSlug(editItem.name);
    
    // Exclude id for new records
    const { id, ...dataWithoutId } = editItem;
    const dataToSave = { ...dataWithoutId, slug, ingredients: ingredientsArray };

    const { error } = id
      ? await apiClient.from("cocktails").update({ ...dataToSave, id }).eq("id", id)
      : await apiClient.from("cocktails").insert(dataToSave);

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
    if (!confirm("Delete this cocktail?")) return;
    await apiClient.from("cocktails").delete().eq("id", id);
    fetchData();
  };

  const openEdit = (cocktail: Cocktail) => {
    setEditItem(cocktail);
    setIngredientsText(cocktail.ingredients?.join("\n") || "");
    clearErrors();
    setShowDialog(true);
  };

  const openNew = () => {
    setEditItem({
      id: "",
      slug: null,
      name: "",
      description: null,
      image_emoji: "🍸",
      image_url: null,
      ingredients: [],
      instructions: null,
      difficulty: "Easy",
      prep_time: "5 mins",
      category: "Classic",
      base_spirit: "Whiskey",
      is_featured: false,
      is_popular: false,
      meta_title: null,
      meta_description: null,
    });
    setIngredientsText("");
    clearErrors();
    setShowDialog(true);
  };

  const csvOps = useCsvOperations<Cocktail>({
    tableName: "cocktails",
    columns: ["id", "name", "slug", "description", "image_emoji", "image_url", "ingredients", "instructions", "difficulty", "prep_time", "category", "base_spirit", "is_featured", "is_popular", "meta_title", "meta_description"],
    excludeColumns: ["id"],
    formatRow: (row) => ({
      ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === null ? "" : Array.isArray(v) ? JSON.stringify(v) : String(v)])),
    }),
  });

  const handleCsvImport = async (rows: Partial<Cocktail>[]) => {
    for (const row of rows) {
      const { id, ...data } = row as Cocktail;
      if (id) {
        await apiClient.from("cocktails").update(data).eq("id", id);
      } else {
        await apiClient.from("cocktails").insert(data);
      }
    }
    fetchData();
  };

  const filteredCocktails = useMemo(() => {
    let result = [...cocktails];
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) => 
        c.name.toLowerCase().includes(query) ||
        c.base_spirit?.toLowerCase().includes(query) ||
        c.category?.toLowerCase().includes(query)
      );
    }
    
    // Filter by spirit
    if (filterSpirit && filterSpirit !== "all") {
      result = result.filter((c) => c.base_spirit === filterSpirit);
    }
    
    // Sort
    if (sortOrder === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === "oldest") {
      result.reverse();
    }
    // latest is default from fetch
    
    return result;
  }, [cocktails, searchQuery, sortOrder, filterSpirit]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Cocktails</h2>
        <div className="flex items-center gap-2">
          <CsvButtons
            onExport={() => csvOps.exportToCsv(cocktails)}
            onImportClick={csvOps.triggerFileInput}
            fileInputRef={csvOps.fileInputRef}
            onFileChange={(e) => {
              const file = e.target.files?.[0];
              if (file) csvOps.importFromCsv(file, handleCsvImport);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1" /> Add Cocktail
          </Button>
        </div>
      </div>

      {/* Search & Sort/Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cocktails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "latest" | "oldest" | "name")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">By Name</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterSpirit} onValueChange={setFilterSpirit}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter spirit..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Spirits</SelectItem>
            {SPIRITS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          {filteredCocktails.map((cocktail) => (
            <div
              key={cocktail.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {cocktail.image_url ? (
                  <img src={cocktail.image_url} alt={cocktail.name} className="w-full h-full object-cover" />
                ) : (
                  cocktail.image_emoji || "🍸"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{cocktail.name}</p>
                  {cocktail.is_featured && <Star className="w-3 h-3 text-accent fill-accent" />}
                  {cocktail.is_popular && <Flame className="w-3 h-3 text-orange-500" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-[10px]">
                    {cocktail.base_spirit}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{cocktail.category}</span>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => openEdit(cocktail)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => handleDelete(cocktail.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {filteredCocktails.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No cocktails match your search." : "No cocktails yet. Add your first recipe!"}
            </div>
          )}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem?.id ? "Edit" : "Add"} Cocktail</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Name" required error={errors.name}>
                <Input
                  placeholder="e.g., Old Fashioned"
                  value={editItem?.name || ""}
                  onChange={(e) => {
                    setEditItem((p) => (p ? { ...p, name: e.target.value } : p));
                    clearError("name");
                  }}
                />
              </FormField>
              <FormField label="Emoji">
                <Input
                  placeholder="🍸"
                  value={editItem?.image_emoji || ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, image_emoji: e.target.value } : p))}
                />
              </FormField>
            </div>

            <FormField label="URL Slug (SEO)" hint="Auto-generated. Used in URLs like /cocktails?slug=old-fashioned">
              <div className="flex gap-2">
                <Input
                  placeholder="old-fashioned"
                  value={editItem?.slug || ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, slug: e.target.value } : p))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editItem?.name) {
                      setEditItem((p) => (p ? { ...p, slug: generateSlug(p.name) } : p));
                    }
                  }}
                >
                  Generate
                </Button>
              </div>
            </FormField>

            <FormField label="Image">
              <ImageUpload
                value={editItem?.image_url || null}
                onChange={(url) => setEditItem((p) => (p ? { ...p, image_url: url } : p))}
                folder="cocktails"
                recommendedSize="800 × 800 px"
                aspectRatio="1:1 square"
                aspectHint="Cocktail glass centered, JPG/WebP"
              />
            </FormField>

            <FormField label="Description">
              <Textarea
                placeholder="A timeless classic..."
                value={editItem?.description || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, description: e.target.value } : p))}
                rows={2}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Base Spirit">
                <Select
                  value={editItem?.base_spirit || ""}
                  onValueChange={(v) => setEditItem((p) => (p ? { ...p, base_spirit: v } : p))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select spirit" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPIRITS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Category">
                <Select
                  value={editItem?.category || ""}
                  onValueChange={(v) => setEditItem((p) => (p ? { ...p, category: v } : p))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Difficulty">
                <Select
                  value={editItem?.difficulty || ""}
                  onValueChange={(v) => setEditItem((p) => (p ? { ...p, difficulty: v } : p))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Prep Time">
                <Input
                  placeholder="5 mins"
                  value={editItem?.prep_time || ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, prep_time: e.target.value } : p))}
                />
              </FormField>
            </div>

            <FormField label="Ingredients (one per line)">
              <Textarea
                placeholder="2 oz Bourbon&#10;1 Sugar cube&#10;2-3 dashes Angostura bitters"
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                rows={4}
              />
            </FormField>

            <FormField label="Instructions">
              <Textarea
                placeholder="Step by step instructions..."
                value={editItem?.instructions || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, instructions: e.target.value } : p))}
                rows={4}
              />
            </FormField>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editItem?.is_featured || false}
                  onCheckedChange={(c) => setEditItem((p) => (p ? { ...p, is_featured: c } : p))}
                />
                <span className="text-sm">Featured</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editItem?.is_popular || false}
                  onCheckedChange={(c) => setEditItem((p) => (p ? { ...p, is_popular: c } : p))}
                />
                <span className="text-sm">Popular</span>
              </div>
            </div>

            {/* SEO Settings */}
            <h4 className="font-semibold pt-2">🔍 SEO Settings</h4>
            <FormField label="Meta Title (max 60 chars)" hint={`${editItem?.meta_title?.length || 0}/60 characters`}>
              <Input
                placeholder="Cocktail Name | BevOry"
                value={editItem?.meta_title || ""}
                maxLength={60}
                onChange={(e) => setEditItem((p) => (p ? { ...p, meta_title: e.target.value || null } : p))}
              />
            </FormField>
            <FormField label="Meta Description (max 160 chars)" hint={`${editItem?.meta_description?.length || 0}/160 characters`}>
              <Textarea
                placeholder="Compelling description for search results..."
                value={editItem?.meta_description || ""}
                maxLength={160}
                rows={2}
                onChange={(e) => setEditItem((p) => (p ? { ...p, meta_description: e.target.value || null } : p))}
              />
            </FormField>

            <Button className="w-full" onClick={handleSave}>
              Save Cocktail
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCocktails;