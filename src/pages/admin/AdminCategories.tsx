import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, TrendingUp, GripVertical, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import FormField from "@/components/admin/FormField";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import ImageUpload from "@/components/admin/ImageUpload";
import { useFormValidation, ValidationSchema } from "@/hooks/useFormValidation";
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

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  description: string | null;
  image_url: string | null;
  is_trending: boolean | null;
  order_index: number | null;
  meta_title: string | null;
  meta_description: string | null;
}

const validationSchema: ValidationSchema = {
  name: { required: true, minLength: 2 },
};

interface SortableCategoryItemProps {
  category: Category;
  index: number;
  showNumbering: boolean;
  onToggleTrending: (id: string, isTrending: boolean) => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}

const SortableCategoryItem = ({
  category,
  index,
  showNumbering,
  onToggleTrending,
  onEdit,
  onDelete,
}: SortableCategoryItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 rounded-xl bg-card border border-border overflow-hidden"
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded mt-1"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="w-12 h-12 object-cover rounded-lg"
              />
            ) : (
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                <span className="text-2xl">{category.emoji}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {showNumbering && (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold">
                    {index + 1}
                  </span>
                )}
                <p className="font-medium truncate">{category.name}</p>
                {category.is_trending && (
                  <TrendingUp className="w-4 h-4 text-accent flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {category.description || "No description"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={category.is_trending || false}
                onCheckedChange={(checked) => onToggleTrending(category.id, checked)}
              />
              <span className="text-xs text-muted-foreground">Trending</span>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => onEdit(category)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => onDelete(category.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNumbering, setShowNumbering] = useState(true);
  const { toast } = useToast();
  const { errors, validate, clearErrors, clearError } = useFormValidation(validationSchema);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchData = async () => {
    const { data } = await supabase.from("categories").select("*").order("order_index").order("name");
    if (data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredCategories.findIndex((c) => c.id === active.id);
      const newIndex = filteredCategories.findIndex((c) => c.id === over.id);

      const reordered = arrayMove(filteredCategories, oldIndex, newIndex);
      
      // Update local state immediately for responsiveness
      if (!searchQuery) {
        setCategories(reordered);
      }

      // Update all order_index values in database
      const updates = reordered.map((cat, index) => 
        supabase.from("categories").update({ order_index: index }).eq("id", cat.id)
      );
      
      await Promise.all(updates);
      
      toast({ title: "Order updated" });
      fetchData();
    }
  };

  const handleSave = async () => {
    if (!editItem) return;

    if (!validate({ name: editItem.name })) {
      toast({ title: "Validation Error", description: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }

    const slug = editItem.slug || generateSlug(editItem.name);
    const { id, ...dataWithoutId } = editItem;
    const saveData = { ...dataWithoutId, slug };

    const { error } = id
      ? await supabase.from("categories").update(saveData).eq("id", id)
      : await supabase.from("categories").insert(saveData);

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
    if (!confirm("Delete?")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchData();
  };

  const trendingCount = useMemo(() => 
    categories.filter((c) => c.is_trending).length, 
    [categories]
  );

  const handleToggleTrending = async (id: string, isTrending: boolean) => {
    await supabase.from("categories").update({ is_trending: isTrending }).eq("id", id);
    fetchData();
  };

  const openDialog = (cat: Category) => {
    setEditItem(cat);
    clearErrors();
    setShowDialog(true);
  };

  const newCategory: Category = {
    id: "",
    name: "",
    slug: "",
    emoji: "🍺",
    description: "",
    image_url: "",
    is_trending: false,
    order_index: categories.length,
    meta_title: null,
    meta_description: null,
  };

  const csvOps = useCsvOperations<Category>({
    tableName: "categories",
    columns: ["id", "name", "slug", "emoji", "description", "image_url", "is_trending", "order_index", "meta_title", "meta_description"],
    excludeColumns: ["id"],
  });

  const handleCsvImport = async (rows: Partial<Category>[]) => {
    for (const row of rows) {
      const { id, ...data } = row as Category;
      if (id) {
        await supabase.from("categories").update(data).eq("id", id);
      } else {
        await supabase.from("categories").insert(data);
      }
    }
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Categories</h2>
        <div className="flex items-center gap-2">
          <AdminSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search categories..."
          />
          <CsvButtons
            onExport={() => csvOps.exportToCsv(categories)}
            onImportClick={csvOps.triggerFileInput}
            fileInputRef={csvOps.fileInputRef}
            onFileChange={(e) => {
              const file = e.target.files?.[0];
              if (file) csvOps.importFromCsv(file, handleCsvImport);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={() => openDialog(newCategory)}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Show Numbering Toggle */}
      <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
        <Switch
          checked={showNumbering}
          onCheckedChange={setShowNumbering}
        />
        <Hash className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Show order numbers on categories</span>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredCategories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCategories.map((c, index) => (
                <SortableCategoryItem
                  key={c.id}
                  category={c}
                  index={index}
                  showNumbering={showNumbering}
                  onToggleTrending={handleToggleTrending}
                  onEdit={openDialog}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem?.id ? "Edit" : "Add"} Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name" required error={errors.name}>
                <Input
                  placeholder="Category name"
                  value={editItem?.name || ""}
                  onChange={(e) => {
                    setEditItem((p) =>
                      p
                        ? {
                            ...p,
                            name: e.target.value,
                            slug: p.slug || generateSlug(e.target.value),
                          }
                        : p
                    );
                    clearError("name");
                  }}
                />
              </FormField>
              <FormField label="Emoji">
                <Input
                  placeholder="🍺"
                  value={editItem?.emoji || ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, emoji: e.target.value } : p))}
                />
              </FormField>
            </div>
            <FormField label="URL Slug (SEO)" hint="Auto-generated. Used in URLs like /category/whisky">
              <div className="flex gap-2">
                <Input
                  placeholder="whisky"
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
            <FormField label="Category Image">
              <ImageUpload
                value={editItem?.image_url || null}
                onChange={(url) => setEditItem((p) => (p ? { ...p, image_url: url } : p))}
                folder="categories"
                recommendedSize="800 × 400 px"
                aspectRatio="2:1 landscape"
                aspectHint="Banner-style category image"
              />
            </FormField>
            <FormField label="Description">
              <Textarea
                placeholder="Category description for SEO..."
                value={editItem?.description || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, description: e.target.value } : p))}
                rows={2}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Display Order" hint="Lower numbers appear first">
                <Input
                  type="number"
                  placeholder="0"
                  value={editItem?.order_index ?? 0}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, order_index: parseInt(e.target.value) || 0 } : p))}
                />
              </FormField>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={editItem?.is_trending || false}
                  onCheckedChange={(checked) =>
                    setEditItem((p) => (p ? { ...p, is_trending: checked } : p))
                  }
                />
                <span className="text-sm">Show in Trending ({trendingCount} selected)</span>
              </div>
            </div>

            {/* SEO Settings */}
            <h4 className="font-semibold pt-2">🔍 SEO Settings</h4>
            <FormField label="Meta Title (max 60 chars)" hint={`${editItem?.meta_title?.length || 0}/60 characters`}>
              <Input
                placeholder="Category Name | BevOry"
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
              Save Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;