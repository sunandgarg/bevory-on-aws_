import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Play, ExternalLink, User, Tag, CheckSquare, X, Filter } from "lucide-react";
import { toast } from "sonner";
import CsvButtons from "@/components/admin/CsvButtons";
import { useCsvOperations } from "@/hooks/useCsvOperations";
import { Badge } from "@/components/ui/badge";
import ImageUpload from "@/components/admin/ImageUpload";
import FormField from "@/components/admin/FormField";

interface VideoCreator {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface VideoCategory {
  id: string;
  name: string;
  emoji: string | null;
}

interface VideoReview {
  id: string;
  title: string;
  youtube_url: string;
  thumbnail_url: string | null;
  reviewer_name: string | null;
  product_id: string | null;
  creator_id: string | null;
  category_id: string | null;
  order_index: number;
  is_active: boolean;
  video_creators?: VideoCreator | null;
  video_categories?: VideoCategory | null;
}

// Extract YouTube video ID
const getYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const getYouTubeThumbnail = (videoId: string): string => 
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

const AdminVideoReviews = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<VideoReview | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterCreator, setFilterCreator] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    youtube_url: "",
    thumbnail_url: "",
    reviewer_name: "",
    creator_id: "",
    category_id: "",
    order_index: 0,
    is_active: true,
  });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-video-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_reviews")
        .select("*, video_creators(id, name, avatar_url), video_categories(id, name, emoji)")
        .order("order_index");
      if (error) throw error;
      return data as VideoReview[];
    },
  });

  const { data: creators = [] } = useQuery({
    queryKey: ["video-creators-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_creators")
        .select("id, name, avatar_url")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as VideoCreator[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["video-categories-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_categories")
        .select("id, name, emoji")
        .eq("is_active", true)
        .order("order_index");
      if (error) throw error;
      return data as VideoCategory[];
    },
  });

  const filteredReviews = reviews.filter((review) => {
    if (filterCategory && review.category_id !== filterCategory) return false;
    if (filterCreator && review.creator_id !== filterCreator) return false;
    return true;
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("video_reviews").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-reviews"] });
      toast.success("Video review added!");
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("video_reviews").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-reviews"] });
      toast.success("Video review updated!");
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("video_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-reviews"] });
      toast.success("Video review deleted!");
    },
    onError: (error) => toast.error(error.message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("video_reviews").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-reviews"] });
      toast.success(`${selectedIds.size} videos deleted!`);
      setSelectedIds(new Set());
    },
    onError: (error) => toast.error(error.message),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<VideoReview> }) => {
      const { error } = await supabase.from("video_reviews").update(updates).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-reviews"] });
      toast.success(`${selectedIds.size} videos updated!`);
      setSelectedIds(new Set());
    },
    onError: (error) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({
      title: "",
      youtube_url: "",
      thumbnail_url: "",
      reviewer_name: "",
      creator_id: "",
      category_id: "",
      order_index: 0,
      is_active: true,
    });
    setEditingReview(null);
    setIsOpen(false);
  };

  const handleEdit = (review: VideoReview) => {
    setEditingReview(review);
    setFormData({
      title: review.title,
      youtube_url: review.youtube_url,
      thumbnail_url: review.thumbnail_url || "",
      reviewer_name: review.reviewer_name || "",
      creator_id: review.creator_id || "",
      category_id: review.category_id || "",
      order_index: review.order_index,
      is_active: review.is_active,
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.youtube_url.trim()) {
      toast.error("Title and YouTube URL are required");
      return;
    }

    const videoId = getYouTubeId(formData.youtube_url);
    const finalData = {
      ...formData,
      thumbnail_url: formData.thumbnail_url || (videoId ? getYouTubeThumbnail(videoId) : null),
      creator_id: formData.creator_id || null,
      category_id: formData.category_id || null,
    };

    if (editingReview) {
      updateMutation.mutate({ id: editingReview.id, data: finalData });
    } else {
      createMutation.mutate(finalData);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredReviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReviews.map((r) => r.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkActivate = () => {
    bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), updates: { is_active: true } });
  };

  const handleBulkDeactivate = () => {
    bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), updates: { is_active: false } });
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.size} videos?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const csvOps = useCsvOperations<VideoReview>({
    tableName: "video_reviews",
    columns: ["id", "title", "youtube_url", "thumbnail_url", "reviewer_name", "category_id", "creator_id", "order_index", "is_active"],
    excludeColumns: ["id"],
  });

  const handleCsvImport = async (rows: Partial<VideoReview>[]) => {
    for (const row of rows) {
      const { id, ...data } = row as VideoReview;
      if (id) {
        await supabase.from("video_reviews").update(data).eq("id", id);
      } else {
        await supabase.from("video_reviews").insert([data]);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["admin-video-reviews"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Video Reviews</h1>
          <p className="text-muted-foreground">Manage YouTube video reviews with categories and creators</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvButtons
            onExport={() => csvOps.exportToCsv(reviews)}
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
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" /> Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingReview ? "Edit Video" : "Add New Video"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Review title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>YouTube URL *</Label>
                  <Input
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    placeholder="https://youtube.com/shorts/... or https://youtu.be/..."
                  />
                </div>

                <FormField label="Custom Thumbnail (optional)" hint="Leave empty to auto-generate from YouTube">
                  <ImageUpload
                    value={formData.thumbnail_url || null}
                    onChange={(url) => setFormData({ ...formData, thumbnail_url: url || "" })}
                    folder="video-thumbnails"
                    aspectHint="1280×720px (16:9)"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.emoji} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Creator</Label>
                    <Select
                      value={formData.creator_id}
                      onValueChange={(value) => setFormData({ ...formData, creator_id: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select creator..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Creator</SelectItem>
                        {creators.map((creator) => (
                          <SelectItem key={creator.id} value={creator.id}>
                            <div className="flex items-center gap-2">
                              {creator.avatar_url ? (
                                <img src={creator.avatar_url} className="w-5 h-5 rounded-full object-cover" />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                              {creator.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reviewer Name</Label>
                  <Input
                    value={formData.reviewer_name}
                    onChange={(e) => setFormData({ ...formData, reviewer_name: e.target.value })}
                    placeholder="@reviewername"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Order Index</Label>
                    <Input
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingReview ? "Update" : "Add"} Video
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-muted/50">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterCategory || "all"} onValueChange={(v) => setFilterCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.emoji} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCreator || "all"} onValueChange={(v) => setFilterCreator(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Creators" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Creators</SelectItem>
            {creators.map((creator) => (
              <SelectItem key={creator.id} value={creator.id}>
                {creator.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterCategory || filterCreator) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterCategory(""); setFilterCreator(""); }}>
            <X className="w-4 h-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <CheckSquare className="w-5 h-5 text-primary" />
          <span className="font-medium">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={handleBulkActivate}>
            Activate
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkDeactivate}>
            Deactivate
          </Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Cancel
          </Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === filteredReviews.length && filteredReviews.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Preview</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No video reviews found.
                </TableCell>
              </TableRow>
            ) : (
              filteredReviews.map((review) => {
                const videoId = getYouTubeId(review.youtube_url);
                const thumbnail = review.thumbnail_url || (videoId ? getYouTubeThumbnail(videoId) : null);
                
                return (
                  <TableRow key={review.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(review.id)}
                        onCheckedChange={() => handleSelect(review.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-muted">
                        {thumbnail ? (
                          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{review.title}</div>
                      <a 
                        href={review.youtube_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-accent flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> View
                      </a>
                    </TableCell>
                    <TableCell>
                      {review.video_categories ? (
                        <Badge variant="secondary">
                          {review.video_categories.emoji} {review.video_categories.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {review.video_creators ? (
                        <div className="flex items-center gap-2">
                          {review.video_creators.avatar_url ? (
                            <img src={review.video_creators.avatar_url} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">{review.video_creators.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{review.order_index}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${review.is_active ? "bg-green-500/20 text-green-500" : "bg-muted"}`}>
                        {review.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(review)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => deleteMutation.mutate(review.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminVideoReviews;
