import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import FormField from "@/components/admin/FormField";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import { useFormValidation, ValidationSchema } from "@/hooks/useFormValidation";
import ImageUpload from "@/components/admin/ImageUpload";
import CsvButtons from "@/components/admin/CsvButtons";
import { useCsvOperations } from "@/hooks/useCsvOperations";
import { generateSlug } from "@/lib/slug";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SubCategory {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category_id: string | null;
  emoji: string | null;
  image_url: string | null;
  order_index: number | null;
  is_active: boolean | null;
}

interface Category {
  id: string;
  name: string;
  emoji: string | null;
}

const validationSchema: ValidationSchema = {
  name: { required: true, minLength: 2 },
  category_id: { required: true },
};

interface SortableItemProps {
  item: SubCategory;
  categoryName: string;
  onEdit: (item: SubCategory) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

const SortableItem = ({ item, categoryName, onEdit, onDelete, onToggleActive }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl">{item.emoji || "📁"}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {categoryName} • {item.description || "No description"}
        </p>
      </div>
      <Switch
        checked={item.is_active ?? true}
        onCheckedChange={(checked) => onToggleActive(item.id, checked)}
      />
      <Button size="icon" variant="ghost" onClick={() => onEdit(item)}>
        <Pencil className="w-4 h-4" />
      </Button>
      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onDelete(item.id)}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

const AdminSubCategories = () => {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<SubCategory | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const { toast } = useToast();
  const { errors, validate, clearErrors, clearError } = useFormValidation(validationSchema);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchData = async () => {
    const [subCatResult, catResult] = await Promise.all([
      supabase.from("sub_categories").select("*").order("order_index"),
      supabase.from("categories").select("id, name, emoji").order("name"),
    ]);
    
    if (subCatResult.data) setSubCategories(subCatResult.data);
    if (catResult.data) setCategories(catResult.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    let items = subCategories;
    
    if (filterCategory !== "all") {
      items = items.filter((s) => s.category_id === filterCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (s) => s.name.toLowerCase().includes(query) || s.description?.toLowerCase().includes(query)
      );
    }
    
    return items;
  }, [subCategories, searchQuery, filterCategory]);

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "No Category";
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? `${cat.emoji || ""} ${cat.name}`.trim() : "Unknown";
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = filteredItems.findIndex((c) => c.id === active.id);
      const newIndex = filteredItems.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(filteredItems, oldIndex, newIndex);

      if (!searchQuery && filterCategory === "all") {
        setSubCategories(reordered);
      }

      const updates = reordered.map((item, index) =>
        supabase.from("sub_categories").update({ order_index: index }).eq("id", item.id)
      );
      await Promise.all(updates);
      toast({ title: "Order updated" });
      fetchData();
    }
  };

  const handleSave = async () => {
    if (!editItem) return;

    if (!validate({ name: editItem.name, category_id: editItem.category_id })) {
      toast({ title: "Validation Error", description: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }

    const slug = editItem.slug || generateSlug(editItem.name);
    const { id, ...dataWithoutId } = editItem;
    const saveData = { ...dataWithoutId, slug };

    const { error } = id
      ? await supabase.from("sub_categories").update(saveData).eq("id", id)
      : await supabase.from("sub_categories").insert(saveData);

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
    if (!confirm("Delete this sub-category?")) return;
    await supabase.from("sub_categories").delete().eq("id", id);
    fetchData();
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await supabase.from("sub_categories").update({ is_active: isActive }).eq("id", id);
    fetchData();
  };

  const openDialog = (item: SubCategory) => {
    setEditItem(item);
    clearErrors();
    setShowDialog(true);
  };

  const newSubCategory: SubCategory = {
    id: "",
    name: "",
    slug: null,
    description: null,
    category_id: filterCategory !== "all" ? filterCategory : null,
    emoji: "📁",
    image_url: null,
    order_index: subCategories.length,
    is_active: true,
  };

  const csvOps = useCsvOperations<SubCategory>({
    tableName: "sub_categories",
    columns: ["id", "name", "slug", "description", "category_id", "emoji", "image_url", "order_index", "is_active"],
    excludeColumns: ["id"],
    formatRow: (row) => ({
      ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === null ? "" : String(v)])),
    }),
  });

  const handleCsvImport = async (rows: Partial<SubCategory>[]) => {
    for (const row of rows) {
      const { id, ...data } = row as SubCategory;
      if (id) {
        await supabase.from("sub_categories").update(data).eq("id", id);
      } else {
        await supabase.from("sub_categories").insert(data);
      }
    }
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Sub-Categories ({subCategories.length})</h2>
        <div className="flex items-center gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Categories" />
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
          <AdminSearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search..." />
          <CsvButtons
            onExport={() => csvOps.exportToCsv(subCategories)}
            onImportClick={csvOps.triggerFileInput}
            fileInputRef={csvOps.fileInputRef}
            onFileChange={(e) => {
              const file = e.target.files?.[0];
              if (file) csvOps.importFromCsv(file, handleCsvImport);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={() => openDialog(newSubCategory)}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredItems.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  categoryName={getCategoryName(item.category_id)}
                  onEdit={openDialog}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No sub-categories yet. Add your first one!
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem?.id ? "Edit" : "Add"} Sub-Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Parent Category" required error={errors.category_id}>
              <Select
                value={editItem?.category_id || ""}
                onValueChange={(v) => {
                  setEditItem((p) => (p ? { ...p, category_id: v } : p));
                  clearError("category_id");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name" required error={errors.name}>
                <Input
                  placeholder="e.g., Scotch Whisky"
                  value={editItem?.name || ""}
                  onChange={(e) => {
                    setEditItem((p) =>
                      p ? { ...p, name: e.target.value, slug: p.slug || generateSlug(e.target.value) } : p
                    );
                    clearError("name");
                  }}
                />
              </FormField>
              <FormField label="Emoji">
                <Input
                  placeholder="📁"
                  value={editItem?.emoji || ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, emoji: e.target.value } : p))}
                />
              </FormField>
            </div>

            <FormField label="URL Slug" hint="Auto-generated">
              <div className="flex gap-2">
                <Input
                  placeholder="scotch-whisky"
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
                folder="sub-categories"
                recommendedSize="800 × 400 px"
                aspectRatio="2:1 landscape"
                aspectHint="Sub-category banner, JPG/WebP"
              />
            </FormField>

            <FormField label="Description">
              <Textarea
                placeholder="Description..."
                value={editItem?.description || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, description: e.target.value } : p))}
                rows={2}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Display Order">
                <Input
                  type="number"
                  placeholder="0"
                  value={editItem?.order_index ?? 0}
                  onChange={(e) =>
                    setEditItem((p) => (p ? { ...p, order_index: parseInt(e.target.value) || 0 } : p))
                  }
                />
              </FormField>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={editItem?.is_active ?? true}
                  onCheckedChange={(checked) => setEditItem((p) => (p ? { ...p, is_active: checked } : p))}
                />
                <span className="text-sm">Active</span>
              </div>
            </div>

            <Button className="w-full" onClick={handleSave}>
              Save Sub-Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubCategories;
