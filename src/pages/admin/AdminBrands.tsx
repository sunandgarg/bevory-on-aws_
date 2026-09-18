import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, GripVertical, X, Search } from "lucide-react";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import FormField from "@/components/admin/FormField";
import ImageUpload from "@/components/admin/ImageUpload";
import { useFormValidation, ValidationSchema } from "@/hooks/useFormValidation";
import CsvButtons from "@/components/admin/CsvButtons";
import { useCsvOperations } from "@/hooks/useCsvOperations";
import { generateSlug } from "@/lib/slug";

interface TastingNote {
  title: string;
  description: string;
}

interface HowToEnjoy {
  subheading: string;
  description: string;
}

interface PairingIdea {
  title: string;
  items: string[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface Brand {
  id: string;
  slug: string | null;
  brand_name: string;
  logo_emoji: string | null;
  logo_url: string | null;
  image_url: string | null;
  description: string | null;
  link_url: string | null;
  country: string | null;
  tasting_notes: TastingNote[];
  story: string | null;
  how_to_enjoy: HowToEnjoy[];
  pairing_ideas: PairingIdea[];
  why_choose: string | null;
  faqs: FAQ[];
  final_verdict: string | null;
  is_active: boolean | null;
  show_in_spotlight: boolean | null;
  order_index: number | null;
  meta_title: string | null;
  meta_description: string | null;
}

const validationSchema: ValidationSchema = {
  brand_name: { required: true, minLength: 2 },
};

const AdminBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<Brand | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest" | "name">("name");
  const { toast } = useToast();
  const { errors, validate, clearErrors, clearError } = useFormValidation(validationSchema);

  const fetchData = async () => {
    const { data } = await apiClient
      .from("brand_spotlights")
      .select("*")
      .order("order_index");
    if (data) {
      setBrands(data.map((b: any) => ({
        ...b,
        tasting_notes: Array.isArray(b.tasting_notes) ? b.tasting_notes : [],
        how_to_enjoy: Array.isArray(b.how_to_enjoy) ? b.how_to_enjoy : [],
        pairing_ideas: Array.isArray(b.pairing_ideas) ? b.pairing_ideas : [],
        faqs: Array.isArray(b.faqs) ? b.faqs : [],
      })) as Brand[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!editItem) return;

    if (!validate({ brand_name: editItem.brand_name })) {
      toast({ title: "Validation Error", description: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }

    // Auto-generate slug if not set
    const slug = editItem.slug || generateSlug(editItem.brand_name);

    const brandData: any = {
      brand_name: editItem.brand_name,
      slug,
      logo_emoji: editItem.logo_emoji,
      logo_url: editItem.logo_url,
      image_url: editItem.image_url,
      description: editItem.description,
      link_url: editItem.link_url,
      country: editItem.country,
      tasting_notes: editItem.tasting_notes || [],
      story: editItem.story,
      how_to_enjoy: editItem.how_to_enjoy || [],
      pairing_ideas: editItem.pairing_ideas || [],
      why_choose: editItem.why_choose,
      faqs: editItem.faqs || [],
      final_verdict: editItem.final_verdict,
      is_active: editItem.is_active,
      show_in_spotlight: editItem.show_in_spotlight,
      order_index: editItem.order_index,
      meta_title: editItem.meta_title,
      meta_description: editItem.meta_description,
    };

    const { error } = editItem.id
      ? await apiClient.from("brand_spotlights").update(brandData).eq("id", editItem.id)
      : await apiClient.from("brand_spotlights").insert(brandData);

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
    if (!confirm("Delete this brand?")) return;
    await apiClient.from("brand_spotlights").delete().eq("id", id);
    fetchData();
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await apiClient.from("brand_spotlights").update({ is_active: isActive }).eq("id", id);
    fetchData();
  };

  const newBrand = (): Brand => ({
    id: "",
    slug: null,
    brand_name: "",
    logo_emoji: "🏷️",
    logo_url: null,
    image_url: null,
    description: null,
    link_url: null,
    country: "India",
    tasting_notes: [],
    story: null,
    how_to_enjoy: [],
    pairing_ideas: [],
    why_choose: null,
    faqs: [],
    final_verdict: null,
    is_active: true,
    show_in_spotlight: false,
    order_index: brands.length,
    meta_title: null,
    meta_description: null,
  });

  const openDialog = (brand: Brand) => {
    setEditItem(brand);
    clearErrors();
    setShowDialog(true);
  };

  const addTastingNote = () => {
    if (!editItem) return;
    setEditItem({
      ...editItem,
      tasting_notes: [...editItem.tasting_notes, { title: "", description: "" }],
    });
  };

  const removeTastingNote = (index: number) => {
    if (!editItem) return;
    setEditItem({
      ...editItem,
      tasting_notes: editItem.tasting_notes.filter((_, i) => i !== index),
    });
  };

  const addHowToEnjoy = () => {
    if (!editItem) return;
    setEditItem({
      ...editItem,
      how_to_enjoy: [...editItem.how_to_enjoy, { subheading: "", description: "" }],
    });
  };

  const removeHowToEnjoy = (index: number) => {
    if (!editItem) return;
    setEditItem({
      ...editItem,
      how_to_enjoy: editItem.how_to_enjoy.filter((_, i) => i !== index),
    });
  };

  const addPairingIdea = () => {
    if (!editItem) return;
    setEditItem({
      ...editItem,
      pairing_ideas: [...editItem.pairing_ideas, { title: "", items: [] }],
    });
  };

  const removePairingIdea = (index: number) => {
    if (!editItem) return;
    setEditItem({
      ...editItem,
      pairing_ideas: editItem.pairing_ideas.filter((_, i) => i !== index),
    });
  };

  const addFAQ = () => {
    if (!editItem) return;
    setEditItem({
      ...editItem,
      faqs: [...editItem.faqs, { question: "", answer: "" }],
    });
  };

  const removeFAQ = (index: number) => {
    if (!editItem) return;
    setEditItem({
      ...editItem,
      faqs: editItem.faqs.filter((_, i) => i !== index),
    });
  };

  const csvOps = useCsvOperations<Brand>({
    tableName: "brand_spotlights",
    columns: ["id", "brand_name", "logo_emoji", "logo_url", "image_url", "description", "link_url", "country", "story", "why_choose", "final_verdict", "is_active", "order_index", "tasting_notes", "how_to_enjoy", "pairing_ideas", "faqs"],
    excludeColumns: ["id"],
    formatRow: (row) => ({
      ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)])),
    }),
  });

  const handleCsvImport = async (rows: Partial<Brand>[]) => {
    for (const row of rows) {
      const { id, tasting_notes, how_to_enjoy, pairing_ideas, faqs, ...rest } = row as Brand;
      const data = {
        ...rest,
        tasting_notes: JSON.parse(JSON.stringify(tasting_notes || [])),
        how_to_enjoy: JSON.parse(JSON.stringify(how_to_enjoy || [])),
        pairing_ideas: JSON.parse(JSON.stringify(pairing_ideas || [])),
        faqs: JSON.parse(JSON.stringify(faqs || [])),
      };
      if (id) {
        await apiClient.from("brand_spotlights").update(data).eq("id", id);
      } else {
        await apiClient.from("brand_spotlights").insert([data]);
      }
    }
    fetchData();
  };

  const filteredBrands = useMemo(() => {
    let result = [...brands];
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((b) => 
        b.brand_name.toLowerCase().includes(query) ||
        b.country?.toLowerCase().includes(query) ||
        b.description?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    if (sortOrder === "name") {
      result.sort((a, b) => a.brand_name.localeCompare(b.brand_name));
    } else if (sortOrder === "oldest") {
      result.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    } else {
      result.sort((a, b) => (b.order_index || 0) - (a.order_index || 0));
    }
    
    return result;
  }, [brands, searchQuery, sortOrder]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Brand Spotlights ({filteredBrands.length})</h2>
        <div className="flex items-center gap-2">
          <CsvButtons
            onExport={() => csvOps.exportToCsv(brands)}
            onImportClick={csvOps.triggerFileInput}
            fileInputRef={csvOps.fileInputRef}
            onFileChange={(e) => {
              const file = e.target.files?.[0];
              if (file) csvOps.importFromCsv(file, handleCsvImport);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={() => openDialog(newBrand())}>
            <Plus className="w-4 h-4 mr-1" /> Add Brand
          </Button>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
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
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {brand.image_url || brand.logo_url ? (
                  <img
                    src={brand.image_url || brand.logo_url || ""}
                    alt={brand.brand_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  brand.logo_emoji || "🏷️"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{brand.brand_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {brand.country} • {brand.description || "No description"}
                </p>
              </div>
              <Switch
                checked={brand.is_active || false}
                onCheckedChange={(checked) => handleToggleActive(brand.id, checked)}
              />
              <Button size="icon" variant="ghost" onClick={() => openDialog(brand)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => handleDelete(brand.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {brands.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No brands yet. Add your first brand spotlight!
            </div>
          )}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{editItem?.id ? "Edit" : "Add"} Brand</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="p-6 pt-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="tasting">Tasting</TabsTrigger>
                  <TabsTrigger value="enjoy">How to Enjoy</TabsTrigger>
                  <TabsTrigger value="pairing">Pairing</TabsTrigger>
                  <TabsTrigger value="faq">FAQ</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Brand Name" required error={errors.brand_name}>
                      <Input
                        placeholder="e.g., Johnnie Walker"
                        value={editItem?.brand_name || ""}
                        onChange={(e) => {
                          setEditItem((p) => (p ? { ...p, brand_name: e.target.value } : p));
                          clearError("brand_name");
                        }}
                      />
                    </FormField>
                    <FormField label="Country">
                      <Input
                        placeholder="e.g., Scotland"
                        value={editItem?.country || ""}
                        onChange={(e) =>
                          setEditItem((p) => (p ? { ...p, country: e.target.value } : p))
                        }
                      />
                    </FormField>
                  </div>

                  <FormField label="URL Slug (SEO)" hint="Auto-generated. Used in URLs like /brand/johnnie-walker">
                    <div className="flex gap-2">
                      <Input
                        placeholder="johnnie-walker"
                        value={editItem?.slug || ""}
                        onChange={(e) => setEditItem((p) => (p ? { ...p, slug: e.target.value } : p))}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editItem?.brand_name) {
                            setEditItem((p) => (p ? { ...p, slug: generateSlug(p.brand_name) } : p));
                          }
                        }}
                      >
                        Generate
                      </Button>
                    </div>
                  </FormField>

                  <FormField label="Brand Image (Hero Banner)">
                    <ImageUpload
                      value={editItem?.image_url || null}
                      onChange={(url) => setEditItem((p) => (p ? { ...p, image_url: url } : p))}
                      folder="brands"
                      recommendedSize="1200 × 400 px"
                      aspectRatio="3:1 banner"
                      aspectHint="Wide hero banner with brand visuals"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Logo Emoji">
                      <Input
                        placeholder="🏷️"
                        value={editItem?.logo_emoji || ""}
                        onChange={(e) =>
                          setEditItem((p) => (p ? { ...p, logo_emoji: e.target.value } : p))
                        }
                      />
                    </FormField>
                    <FormField label="Logo Image">
                      <ImageUpload
                        value={editItem?.logo_url || null}
                        onChange={(url) => setEditItem((p) => (p ? { ...p, logo_url: url } : p))}
                        folder="brands/logos"
                        recommendedSize="400 × 400 px"
                        aspectRatio="1:1 square"
                        aspectHint="Logo on transparent background"
                      />
                    </FormField>
                  </div>

                  <FormField label="Description">
                    <Textarea
                      placeholder="About this brand..."
                      value={editItem?.description || ""}
                      onChange={(e) =>
                        setEditItem((p) => (p ? { ...p, description: e.target.value } : p))
                      }
                      rows={3}
                    />
                  </FormField>

                  <FormField label="Story">
                    <Textarea
                      placeholder="The brand's history and heritage..."
                      value={editItem?.story || ""}
                      onChange={(e) =>
                        setEditItem((p) => (p ? { ...p, story: e.target.value || null } : p))
                      }
                      rows={4}
                    />
                  </FormField>

                  <FormField label={`Why Choose ${editItem?.brand_name || "This Brand"}?`}>
                    <Textarea
                      placeholder="Reasons to choose this brand..."
                      value={editItem?.why_choose || ""}
                      onChange={(e) =>
                        setEditItem((p) => (p ? { ...p, why_choose: e.target.value || null } : p))
                      }
                      rows={3}
                    />
                  </FormField>

                  <FormField label="Final Verdict">
                    <Textarea
                      placeholder="Overall assessment..."
                      value={editItem?.final_verdict || ""}
                      onChange={(e) =>
                        setEditItem((p) => (p ? { ...p, final_verdict: e.target.value || null } : p))
                      }
                      rows={3}
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Website URL">
                      <Input
                        placeholder="https://brand-website.com"
                        value={editItem?.link_url || ""}
                        onChange={(e) =>
                          setEditItem((p) => (p ? { ...p, link_url: e.target.value || null } : p))
                        }
                      />
                    </FormField>
                    <FormField label="Order Index">
                      <Input
                        type="number"
                        value={editItem?.order_index || 0}
                        onChange={(e) =>
                          setEditItem((p) =>
                            p ? { ...p, order_index: parseInt(e.target.value) || 0 } : p
                          )
                        }
                      />
                    </FormField>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editItem?.is_active || false}
                        onCheckedChange={(checked) =>
                          setEditItem((p) => (p ? { ...p, is_active: checked } : p))
                        }
                      />
                      <span className="text-sm">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editItem?.show_in_spotlight || false}
                        onCheckedChange={(checked) =>
                          setEditItem((p) => (p ? { ...p, show_in_spotlight: checked } : p))
                        }
                      />
                      <span className="text-sm">Show in Spotlight</span>
                    </div>
                  </div>

                  {/* SEO Settings */}
                  <h4 className="font-semibold pt-2">🔍 SEO Settings</h4>
                  <FormField label="Meta Title (max 60 chars)" hint={`${editItem?.meta_title?.length || 0}/60 characters`}>
                    <Input
                      placeholder="Brand Name | Bevory"
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
                </TabsContent>

                <TabsContent value="tasting" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tasting Notes</span>
                    <Button size="sm" variant="outline" onClick={addTastingNote}>
                      <Plus className="w-4 h-4 mr-1" /> Add Note
                    </Button>
                  </div>
                  {editItem?.tasting_notes.map((note, index) => (
                    <div key={index} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Note {index + 1}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => removeTastingNote(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Title (e.g., Nose, Palate, Finish)"
                        value={note.title}
                        onChange={(e) => {
                          const newNotes = [...editItem.tasting_notes];
                          newNotes[index] = { ...note, title: e.target.value };
                          setEditItem({ ...editItem, tasting_notes: newNotes });
                        }}
                      />
                      <Textarea
                        placeholder="Description..."
                        value={note.description}
                        rows={2}
                        onChange={(e) => {
                          const newNotes = [...editItem.tasting_notes];
                          newNotes[index] = { ...note, description: e.target.value };
                          setEditItem({ ...editItem, tasting_notes: newNotes });
                        }}
                      />
                    </div>
                  ))}
                  {editItem?.tasting_notes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tasting notes yet. Add your first one!
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="enjoy" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">How to Enjoy</span>
                    <Button size="sm" variant="outline" onClick={addHowToEnjoy}>
                      <Plus className="w-4 h-4 mr-1" /> Add Section
                    </Button>
                  </div>
                  {editItem?.how_to_enjoy.map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Section {index + 1}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => removeHowToEnjoy(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Subheading (e.g., Neat, On the Rocks)"
                        value={item.subheading}
                        onChange={(e) => {
                          const newItems = [...editItem.how_to_enjoy];
                          newItems[index] = { ...item, subheading: e.target.value };
                          setEditItem({ ...editItem, how_to_enjoy: newItems });
                        }}
                      />
                      <Textarea
                        placeholder="Description..."
                        value={item.description}
                        rows={2}
                        onChange={(e) => {
                          const newItems = [...editItem.how_to_enjoy];
                          newItems[index] = { ...item, description: e.target.value };
                          setEditItem({ ...editItem, how_to_enjoy: newItems });
                        }}
                      />
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="pairing" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Pairing Ideas</span>
                    <Button size="sm" variant="outline" onClick={addPairingIdea}>
                      <Plus className="w-4 h-4 mr-1" /> Add Pairing
                    </Button>
                  </div>
                  {editItem?.pairing_ideas.map((pairing, index) => (
                    <div key={index} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Pairing {index + 1}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => removePairingIdea(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Title (e.g., Food Pairing, Hot Toddy)"
                        value={pairing.title}
                        onChange={(e) => {
                          const newPairings = [...editItem.pairing_ideas];
                          newPairings[index] = { ...pairing, title: e.target.value };
                          setEditItem({ ...editItem, pairing_ideas: newPairings });
                        }}
                      />
                      <Input
                        placeholder="Items (comma separated for multiple)"
                        value={Array.isArray(pairing.items) ? pairing.items.join(", ") : (pairing.items || "")}
                        onChange={(e) => {
                          const newPairings = [...editItem.pairing_ideas];
                          const value = e.target.value;
                          // If contains comma, split into array; otherwise store as single-item array
                          const items = value.includes(",") 
                            ? value.split(",").map((s) => s.trim()).filter(Boolean)
                            : value.trim() ? [value.trim()] : [];
                          newPairings[index] = {
                            ...pairing,
                            items,
                          };
                          setEditItem({ ...editItem, pairing_ideas: newPairings });
                        }}
                      />
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="faq" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">FAQs</span>
                    <Button size="sm" variant="outline" onClick={addFAQ}>
                      <Plus className="w-4 h-4 mr-1" /> Add FAQ
                    </Button>
                  </div>
                  {editItem?.faqs.map((faq, index) => (
                    <div key={index} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">FAQ {index + 1}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => removeFAQ(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Question"
                        value={faq.question}
                        onChange={(e) => {
                          const newFaqs = [...editItem.faqs];
                          newFaqs[index] = { ...faq, question: e.target.value };
                          setEditItem({ ...editItem, faqs: newFaqs });
                        }}
                      />
                      <Textarea
                        placeholder="Answer..."
                        value={faq.answer}
                        rows={2}
                        onChange={(e) => {
                          const newFaqs = [...editItem.faqs];
                          newFaqs[index] = { ...faq, answer: e.target.value };
                          setEditItem({ ...editItem, faqs: newFaqs });
                        }}
                      />
                    </div>
                  ))}
                </TabsContent>
              </Tabs>

              <Button className="w-full mt-6" onClick={handleSave}>
                Save Brand
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBrands;