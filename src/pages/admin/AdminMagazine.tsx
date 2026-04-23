import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Star, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { generateSlug } from "@/lib/slug";
import ImageUpload from "@/components/admin/ImageUpload";
import FormField from "@/components/admin/FormField";

interface Article {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  cover_emoji: string | null;
  category: string | null;
  author: string | null;
  youtube_url: string | null;
  is_featured: boolean | null;
  is_published: boolean | null;
  published_at: string | null;
}

const CATEGORIES = ["Guide", "Trends", "Tips", "News", "Reviews", "Culture", "Recipes"];

const AdminMagazine = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<Article | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    const { data } = await supabase
      .from("spiritz_magazine")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setArticles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!editItem) return;
    
    // Auto-generate slug if not set
    const slug = editItem.slug || generateSlug(editItem.title);
    
    const dataToSave = {
      ...editItem,
      slug,
      published_at: editItem.is_published ? editItem.published_at || new Date().toISOString() : null,
    };
    
    // Remove id for new records
    const { id, ...dataWithoutId } = dataToSave;

    const { error } = id
      ? await supabase.from("spiritz_magazine").update(dataToSave).eq("id", id)
      : await supabase.from("spiritz_magazine").insert(dataWithoutId);

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Saved" });
      setShowDialog(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    await supabase.from("spiritz_magazine").delete().eq("id", id);
    fetchData();
  };

  const togglePublish = async (id: string, isPublished: boolean) => {
    await supabase
      .from("spiritz_magazine")
      .update({
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
      })
      .eq("id", id);
    fetchData();
  };

  const openEdit = (article: Article) => {
    setEditItem(article);
    setShowDialog(true);
  };

  const openNew = () => {
    setEditItem({
      id: "",
      slug: null,
      title: "",
      excerpt: null,
      content: null,
      cover_url: null,
      cover_emoji: "📖",
      category: "Guide",
      author: null,
      youtube_url: null,
      is_featured: false,
      is_published: false,
      published_at: null,
    });
    setShowDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Spiritz Guide</h2>
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Add Article
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          {articles.map((article) => (
            <div
              key={article.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {article.cover_url ? (
                  <img src={article.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  article.cover_emoji || "📖"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{article.title}</p>
                  {article.is_featured && <Star className="w-3 h-3 text-accent fill-accent" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {article.category && (
                    <Badge variant="secondary" className="text-[10px]">{article.category}</Badge>
                  )}
                  <Badge
                    variant={article.is_published ? "default" : "outline"}
                    className="text-[10px]"
                  >
                    {article.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => togglePublish(article.id, !article.is_published)}
              >
                {article.is_published ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => openEdit(article)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => handleDelete(article.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {articles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No articles yet. Create your first guide!
            </div>
          )}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem?.id ? "Edit" : "Add"} Article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                placeholder="e.g., Best Whiskeys for Beginners"
                value={editItem?.title || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, title: e.target.value } : p))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={editItem?.category || ""}
                  onValueChange={(v) => setEditItem((p) => (p ? { ...p, category: v } : p))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Author</Label>
                <Input
                  placeholder="Author name"
                  value={editItem?.author || ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, author: e.target.value } : p))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Cover Emoji">
                <Input
                  placeholder="📖"
                  value={editItem?.cover_emoji || ""}
                  onChange={(e) => setEditItem((p) => (p ? { ...p, cover_emoji: e.target.value } : p))}
                />
              </FormField>
              <FormField label="Cover Image">
                <ImageUpload
                  value={editItem?.cover_url || null}
                  onChange={(url) => setEditItem((p) => (p ? { ...p, cover_url: url } : p))}
                  folder="magazine"
                  recommendedSize="1200 × 900 px"
                  aspectRatio="4:3 landscape"
                  aspectHint="High-quality magazine cover"
                />
              </FormField>
            </div>

            <div>
              <Label>YouTube URL (optional, for video content)</Label>
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={editItem?.youtube_url || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, youtube_url: e.target.value || null } : p))}
              />
            </div>

            <div>
              <Label>Excerpt (short summary)</Label>
              <Textarea
                placeholder="A brief summary of the article..."
                value={editItem?.excerpt || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, excerpt: e.target.value } : p))}
                rows={2}
              />
            </div>

            <div>
              <Label>Content</Label>
              <Textarea
                placeholder="Full article content..."
                value={editItem?.content || ""}
                onChange={(e) => setEditItem((p) => (p ? { ...p, content: e.target.value } : p))}
                rows={8}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editItem?.is_featured || false}
                  onCheckedChange={(c) => setEditItem((p) => (p ? { ...p, is_featured: c } : p))}
                />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editItem?.is_published || false}
                  onCheckedChange={(c) => setEditItem((p) => (p ? { ...p, is_published: c } : p))}
                />
                <Label>Published</Label>
              </div>
            </div>

            <Button className="w-full" onClick={handleSave}>
              Save Article
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMagazine;
