import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, X, Image, Video, GripVertical, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CsvButtons from "@/components/admin/CsvButtons";
import { useCsvOperations } from "@/hooks/useCsvOperations";
import ImageUpload from "@/components/admin/ImageUpload";
import FormField from "@/components/admin/FormField";

interface StoryMedia {
  type: "image" | "video";
  url: string;
  duration?: number;
}

interface CheersGuide {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  video_url: string | null;
  media_type: string | null;
  display_duration: number | null;
  emoji: string | null;
  link_url: string | null;
  link_type: string | null;
  order_index: number | null;
  is_active: boolean | null;
  stories: StoryMedia[] | null;
}

interface FormErrors {
  [key: string]: string;
}

const AdminCheersGuide = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<CheersGuide | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    video_url: "",
    media_type: "image",
    display_duration: 5,
    emoji: "🥂",
    link_url: "",
    link_type: "internal",
    order_index: 0,
    is_active: true,
    stories: [] as StoryMedia[],
  });

  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["admin-cheers-guides"],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("cheers_guides")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data.map((g) => ({
        ...g,
        stories: Array.isArray(g.stories) ? (g.stories as unknown as StoryMedia[]) : [],
      })) as CheersGuide[];
    },
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (formData.stories.length === 0 && !formData.image_url && !formData.emoji) {
      newErrors.stories = "Add at least one story or a cover image/emoji";
    }
    
    formData.stories.forEach((story, index) => {
      if (!story.url.trim()) {
        newErrors[`story_${index}`] = "URL is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await apiClient.from("cheers_guides").insert([{
        ...data,
        stories: data.stories.length > 0 ? (data.stories as unknown as any[]) : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cheers-guides"] });
      toast.success("Cheers guide created!");
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await apiClient.from("cheers_guides").update({
        ...data,
        stories: data.stories.length > 0 ? (data.stories as unknown as any[]) : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cheers-guides"] });
      toast.success("Cheers guide updated!");
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.from("cheers_guides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cheers-guides"] });
      toast.success("Cheers guide deleted!");
    },
    onError: (error) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      video_url: "",
      media_type: "image",
      display_duration: 5,
      emoji: "🥂",
      link_url: "",
      link_type: "internal",
      order_index: 0,
      is_active: true,
      stories: [],
    });
    setEditingGuide(null);
    setErrors({});
    setIsOpen(false);
  };

  const handleEdit = (guide: CheersGuide) => {
    setEditingGuide(guide);
    setFormData({
      title: guide.title,
      subtitle: guide.subtitle || "",
      image_url: guide.image_url || "",
      video_url: guide.video_url || "",
      media_type: guide.media_type || "image",
      display_duration: guide.display_duration || 5,
      emoji: guide.emoji || "🥂",
      link_url: guide.link_url || "",
      link_type: guide.link_type || "internal",
      order_index: guide.order_index || 0,
      is_active: guide.is_active ?? true,
      stories: guide.stories || [],
    });
    setErrors({});
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    if (editingGuide) {
      updateMutation.mutate({ id: editingGuide.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addStory = () => {
    setFormData({
      ...formData,
      stories: [...formData.stories, { type: "image", url: "", duration: 5 }],
    });
  };

  const removeStory = (index: number) => {
    setFormData({
      ...formData,
      stories: formData.stories.filter((_, i) => i !== index),
    });
    const newErrors = { ...errors };
    delete newErrors[`story_${index}`];
    setErrors(newErrors);
  };

  const updateStory = (index: number, field: keyof StoryMedia, value: any) => {
    const newStories = [...formData.stories];
    newStories[index] = { ...newStories[index], [field]: value };
    setFormData({ ...formData, stories: newStories });
    if (errors[`story_${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`story_${index}`];
      setErrors(newErrors);
    }
  };

  const csvOps = useCsvOperations<CheersGuide>({
    tableName: "cheers_guides",
    columns: ["id", "title", "subtitle", "image_url", "video_url", "media_type", "display_duration", "emoji", "link_url", "link_type", "order_index", "is_active", "stories"],
    excludeColumns: ["id"],
    formatRow: (row) => ({
      ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)])),
    }),
  });

  const handleCsvImport = async (rows: Partial<CheersGuide>[]) => {
    for (const row of rows) {
      const { id, stories, ...rest } = row as CheersGuide;
      const data = { ...rest, stories: JSON.parse(JSON.stringify(stories || [])) };
      if (id) {
        await apiClient.from("cheers_guides").update(data).eq("id", id);
      } else {
        await apiClient.from("cheers_guides").insert([data]);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["admin-cheers-guides"] });
  };

  const filteredGuides = guides.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Cheers Guide</h1>
          <p className="text-muted-foreground">Manage story highlights for homepage</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvButtons
            onExport={() => csvOps.exportToCsv(guides)}
            onImportClick={csvOps.triggerFileInput}
            fileInputRef={csvOps.fileInputRef}
            onFileChange={(e) => {
              const file = e.target.files?.[0];
              if (file) csvOps.importFromCsv(file, handleCsvImport);
              e.target.value = "";
            }}
          />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Guide
              </Button>
            </DialogTrigger>

            {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search guides..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingGuide ? "Edit Guide" : "Add New Guide"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={cn(errors.title && "text-destructive")}>
                      Title *
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (errors.title) {
                          setErrors({ ...errors, title: "" });
                        }
                      }}
                      placeholder="Whiskey"
                      className={cn(errors.title && "border-destructive")}
                    />
                    {errors.title && (
                      <p className="text-xs text-destructive">{errors.title}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Emoji</Label>
                    <Input
                      value={formData.emoji}
                      onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                      placeholder="🥃"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Explore whiskey collection"
                  />
                </div>

                <FormField label="Cover Image (displayed as story circle)" hint="400×400px (1:1 square)">
                  <ImageUpload
                    value={formData.image_url || null}
                    onChange={(url) => setFormData({ ...formData, image_url: url || "" })}
                    folder="cheers-guides"
                    recommendedSize="400 × 400 px"
                    aspectRatio="1:1 square"
                    aspectHint="Story circle thumbnail"
                  />
                </FormField>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className={cn(errors.stories && "text-destructive")}>
                        Story Content
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Add multiple images or videos that play as stories
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={addStory}>
                      <Plus className="w-4 h-4 mr-1" /> Add Story
                    </Button>
                  </div>
                  
                  {errors.stories && (
                    <p className="text-xs text-destructive mb-2">{errors.stories}</p>
                  )}

                  <div className="space-y-3">
                    {formData.stories.map((story, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-3 rounded-lg bg-secondary/50 space-y-2",
                          errors[`story_${index}`] && "border border-destructive"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                            <span className="text-sm font-medium">Story {index + 1}</span>
                            {story.type === "image" ? (
                              <Image className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Video className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => removeStory(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={story.type}
                              onValueChange={(v) => updateStory(index, "type", v)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Duration (seconds)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={30}
                              value={story.duration || 5}
                              onChange={(e) => updateStory(index, "duration", parseInt(e.target.value) || 5)}
                              className="h-8"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className={cn("text-xs", errors[`story_${index}`] && "text-destructive")}>
                            {story.type === "video" ? "Video URL / YouTube URL *" : "Image URL *"}
                          </Label>
                          <Input
                            value={story.url}
                            onChange={(e) => updateStory(index, "url", e.target.value)}
                            placeholder={story.type === "image" 
                              ? "https://image-url..." 
                              : "https://youtube.com/shorts/... or video URL"
                            }
                            className={cn("h-8", errors[`story_${index}`] && "border-destructive")}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {story.type === "image" 
                              ? "📐 Recommended: 1080×1920px (9:16 portrait), JPG/WebP, max 500KB"
                              : "📹 YouTube Shorts, YouTube videos, or direct MP4 URLs supported"
                            }
                          </p>
                          {errors[`story_${index}`] && (
                            <p className="text-xs text-destructive">{errors[`story_${index}`]}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {formData.stories.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          No stories added yet. Click "Add Story" to create your first story slide.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Link Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Link Type</Label>
                      <Select
                        value={formData.link_type}
                        onValueChange={(value) => setFormData({ ...formData, link_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Internal Page</SelectItem>
                          <SelectItem value="external">External URL</SelectItem>
                          <SelectItem value="section">Page Section</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Order</Label>
                      <Input
                        type="number"
                        value={formData.order_index}
                        onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-3">
                    <Label>Link URL</Label>
                    <div className="space-y-2">
                      <Input
                        value={formData.link_url}
                        onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                        placeholder={formData.link_type === "internal" ? "Select or type path..." : "https://..."}
                      />
                      {formData.link_type === "internal" && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground mr-2">Quick links:</span>
                          {[
                            { label: "Categories", path: "/categories" },
                            { label: "Whisky", path: "/category/whisky" },
                            { label: "Rum", path: "/category/rum" },
                            { label: "Vodka", path: "/category/vodka" },
                            { label: "Beer", path: "/category/beer" },
                            { label: "Wine", path: "/category/wine" },
                            { label: "Cocktails", path: "/cocktails" },
                            { label: "Guide", path: "/guide" },
                            { label: "Party", path: "/party-planner" },
                          ].map((link) => (
                            <button
                              key={link.path}
                              type="button"
                              onClick={() => setFormData({ ...formData, link_url: link.path })}
                              className={cn(
                                "px-2 py-0.5 text-xs rounded-full transition-colors",
                                formData.link_url === link.path
                                  ? "bg-accent text-accent-foreground"
                                  : "bg-secondary hover:bg-secondary/80"
                              )}
                            >
                              {link.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingGuide ? "Update" : "Create"} Guide
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Stories</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredGuides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No guides match your search." : "No guides yet. Add your first one!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredGuides.map((guide) => (
                <TableRow key={guide.id}>
                  <TableCell>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-red-500 p-[2px]">
                      <div className="w-full h-full rounded-full bg-background p-[2px]">
                        <div className="w-full h-full rounded-full bg-secondary overflow-hidden flex items-center justify-center">
                          {guide.image_url ? (
                            <img src={guide.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">{guide.emoji}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{guide.title}</p>
                      {guide.subtitle && (
                        <p className="text-sm text-muted-foreground">{guide.subtitle}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {guide.stories && guide.stories.length > 0 ? (
                        <>
                          <span className="text-sm font-medium">{guide.stories.length}</span>
                          <span className="text-xs text-muted-foreground">
                            ({guide.stories.filter(s => s.type === 'image').length} img, 
                            {guide.stories.filter(s => s.type === 'video').length} vid)
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-muted-foreground">{guide.link_type}: </span>
                      {guide.link_url || "—"}
                    </div>
                  </TableCell>
                  <TableCell>{guide.order_index}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      guide.is_active 
                        ? "bg-green-500/10 text-green-500" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {guide.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(guide)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(guide.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminCheersGuide;
