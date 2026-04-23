import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, User, Youtube, Instagram, Globe, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import FormField from "@/components/admin/FormField";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import { generateSlug } from "@/lib/slug";
import ImageUpload from "@/components/admin/ImageUpload";

interface VideoCreator {
  id: string;
  name: string;
  slug: string | null;
  avatar_url: string | null;
  bio: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  order_index: number;
}

const AdminVideoCreators = () => {
  const [creators, setCreators] = useState<VideoCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<VideoCreator | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    const { data } = await supabase
      .from("video_creators")
      .select("*")
      .order("order_index");
    if (data) setCreators(data as VideoCreator[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!editItem || !editItem.name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    const slug = editItem.slug || generateSlug(editItem.name);
    const { id, ...dataWithoutId } = editItem;
    const data = { ...dataWithoutId, slug };

    const { error } = id
      ? await supabase.from("video_creators").update(data).eq("id", id)
      : await supabase.from("video_creators").insert(data);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!" });
      setShowDialog(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this creator?")) return;
    await supabase.from("video_creators").delete().eq("id", id);
    fetchData();
  };

  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    await supabase.from("video_creators").update({ is_featured: isFeatured }).eq("id", id);
    fetchData();
  };

  const newCreator = (): VideoCreator => ({
    id: "",
    name: "",
    slug: null,
    avatar_url: null,
    bio: null,
    youtube_url: null,
    instagram_url: null,
    twitter_url: null,
    website_url: null,
    is_active: true,
    is_featured: false,
    order_index: creators.length,
  });

  const filteredCreators = creators.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Video Creators</h2>
        <div className="flex items-center gap-2">
          <AdminSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search creators..."
          />
          <Button size="sm" onClick={() => { setEditItem(newCreator()); setShowDialog(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Creator
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCreators.map((creator) => (
            <div key={creator.id} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{creator.name}</p>
                    {creator.is_featured && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1 fill-accent text-accent" /> Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{creator.bio || "No bio"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {creator.youtube_url && <Youtube className="w-4 h-4 text-red-500" />}
                    {creator.instagram_url && <Instagram className="w-4 h-4 text-pink-500" />}
                    {creator.website_url && <Globe className="w-4 h-4 text-blue-500" />}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditItem(creator); setShowDialog(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(creator.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={creator.is_featured}
                    onCheckedChange={(v) => toggleFeatured(creator.id, v)}
                  />
                  <span className="text-xs text-muted-foreground">Featured</span>
                </div>
                <span className="text-xs text-muted-foreground">/{creator.slug}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem?.id ? "Edit" : "Add"} Creator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Name" required>
              <Input
                placeholder="Creator name"
                value={editItem?.name || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, name: e.target.value } : p))}
              />
            </FormField>

            <FormField label="URL Slug">
              <div className="flex gap-2">
                <Input
                  placeholder="creator-name"
                  value={editItem?.slug || ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, slug: e.target.value } : p))}
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

            <FormField label="Avatar">
              <ImageUpload
                value={editItem?.avatar_url || null}
                onChange={(url) => setEditItem((p) => (p ? { ...p, avatar_url: url } : p))}
                folder="video-creators"
                recommendedSize="400 × 400 px"
                aspectRatio="1:1 square"
                aspectHint="Profile photo, face centered"
              />
            </FormField>

            <FormField label="Bio">
              <Textarea
                placeholder="Short description about the creator..."
                value={editItem?.bio || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, bio: e.target.value || null } : p))}
                rows={3}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="YouTube URL">
                <Input
                  placeholder="https://youtube.com/@..."
                  value={editItem?.youtube_url || ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, youtube_url: e.target.value || null } : p))}
                />
              </FormField>
              <FormField label="Instagram URL">
                <Input
                  placeholder="https://instagram.com/..."
                  value={editItem?.instagram_url || ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, instagram_url: e.target.value || null } : p))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Twitter URL">
                <Input
                  placeholder="https://twitter.com/..."
                  value={editItem?.twitter_url || ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, twitter_url: e.target.value || null } : p))}
                />
              </FormField>
              <FormField label="Website URL">
                <Input
                  placeholder="https://..."
                  value={editItem?.website_url || ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, website_url: e.target.value || null } : p))}
                />
              </FormField>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editItem?.is_active || false}
                  onCheckedChange={(v) => setEditItem((p) => (p ? { ...p, is_active: v } : p))}
                />
                <span className="text-sm">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editItem?.is_featured || false}
                  onCheckedChange={(v) => setEditItem((p) => (p ? { ...p, is_featured: v } : p))}
                />
                <span className="text-sm">Featured</span>
              </div>
            </div>

            <Button className="w-full" onClick={handleSave}>
              Save Creator
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVideoCreators;
