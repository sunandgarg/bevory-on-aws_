import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import FormField from "@/components/admin/FormField";
import { useFormValidation, ValidationSchema } from "@/hooks/useFormValidation";
import CsvButtons from "@/components/admin/CsvButtons";
import { useCsvOperations } from "@/hooks/useCsvOperations";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUpload from "@/components/admin/ImageUpload";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  cover_emoji: string | null;
  author: string | null;
  category: string | null;
  tags: string[] | null;
  is_published: boolean | null;
  is_featured: boolean | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  linked_product_id: string | null;
  linked_brand: string | null;
  notify_users: boolean | null;
}

interface Product {
  id: string;
  name: string;
  brand: string;
}

interface Brand {
  id: string;
  brand_name: string;
}

const CATEGORIES = ["Whiskey", "Rum", "Vodka", "Gin", "Wine", "Beer", "Cocktails", "Guides", "News"];

const validationSchema: ValidationSchema = {
  title: { required: true, minLength: 5 },
};

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest" | "name">("latest");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const { toast } = useToast();
  const { errors, validate, clearErrors, clearError } = useFormValidation(validationSchema);

  const fetchPosts = async () => {
    const { data } = await apiClient
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await apiClient.from("products").select("id, name, brand").order("brand, name");
    if (data) setProducts(data);
  };

  const fetchBrands = async () => {
    const { data } = await apiClient.from("brand_spotlights").select("id, brand_name").order("brand_name");
    if (data) setBrands(data);
  };

  useEffect(() => {
    fetchPosts();
    fetchProducts();
    fetchBrands();
  }, []);

  const generateSlugFromTitle = (title: string) => {
    // Remove stop words for cleaner article slugs
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are'];
    const words = title.toLowerCase().split(/\s+/).filter(word => !stopWords.includes(word));
    return words.join(' ')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  };

  const handleSave = async () => {
    if (!editPost) return;

    if (!validate({ title: editPost.title })) {
      toast({ title: "Validation Error", description: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }

    const slug = editPost.slug || generateSlugFromTitle(editPost.title);
    
    // Create a clean object without the id if it's a new post
    const postToSave = {
      title: editPost.title,
      slug,
      excerpt: editPost.excerpt || null,
      content: editPost.content || null,
      cover_image_url: editPost.cover_image_url || null,
      cover_emoji: editPost.cover_emoji || "📰",
      author: editPost.author || null,
      category: editPost.category || null,
      tags: editPost.tags || [],
      is_published: editPost.is_published || false,
      is_featured: editPost.is_featured || false,
      meta_title: editPost.meta_title || null,
      meta_description: editPost.meta_description || null,
      linked_product_id: editPost.linked_product_id || null,
      linked_brand: editPost.linked_brand || null,
      published_at: editPost.is_published && !editPost.published_at 
        ? new Date().toISOString() 
        : editPost.published_at,
    };

    let error;
    if (editPost.id) {
      const result = await apiClient.from("blog_posts").update(postToSave).eq("id", editPost.id);
      error = result.error;
    } else {
      const result = await apiClient.from("blog_posts").insert(postToSave);
      error = result.error;
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Blog post saved!" });
      setShowDialog(false);
      setEditPost(null);
      clearErrors();
      fetchPosts();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    const { error } = await apiClient.from("blog_posts").delete().eq("id", id);
    if (!error) {
      toast({ title: "Deleted" });
      fetchPosts();
    }
  };

  const newPost: BlogPost = {
    id: "",
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    cover_emoji: "📰",
    author: "BevOry Team",
    category: "Guides",
    tags: [],
    is_published: false,
    is_featured: false,
    meta_title: "",
    meta_description: "",
    published_at: null,
    linked_product_id: null,
    linked_brand: null,
    notify_users: false,
  };

  const openDialog = (post: BlogPost) => {
    setEditPost(post);
    clearErrors();
    setShowDialog(true);
  };

  const csvOps = useCsvOperations<BlogPost>({
    tableName: "blog_posts",
    columns: ["id", "title", "slug", "excerpt", "content", "cover_image_url", "cover_emoji", "author", "category", "tags", "is_published", "is_featured", "meta_title", "meta_description", "linked_product_id", "linked_brand"],
    excludeColumns: ["id"],
    formatRow: (row) => ({
      ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === null ? "" : Array.isArray(v) ? JSON.stringify(v) : String(v)])),
    }),
  });

  const handleCsvImport = async (rows: Partial<BlogPost>[]) => {
    for (const row of rows) {
      const { id, ...data } = row as BlogPost;
      if (id) {
        await apiClient.from("blog_posts").update(data).eq("id", id);
      } else {
        await apiClient.from("blog_posts").insert(data);
      }
    }
    fetchPosts();
  };

  const filteredPosts = useMemo(() => {
    let result = [...posts];
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => 
        p.title.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.author?.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (filterCategory && filterCategory !== "all") {
      result = result.filter((p) => p.category === filterCategory);
    }
    
    // Sort
    if (sortOrder === "name") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === "oldest") {
      result.reverse();
    }
    // latest is default from fetch
    
    return result;
  }, [posts, searchQuery, sortOrder, filterCategory]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">BevOry Guide (Blog)</h2>
        <div className="flex items-center gap-2">
          <CsvButtons
            onExport={() => csvOps.exportToCsv(posts)}
            onImportClick={csvOps.triggerFileInput}
            fileInputRef={csvOps.fileInputRef}
            onFileChange={(e) => {
              const file = e.target.files?.[0];
              if (file) csvOps.importFromCsv(file, handleCsvImport);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={() => openDialog(newPost)}>
            <Plus className="w-4 h-4 mr-1" /> Add Article
          </Button>
        </div>
      </div>

      {/* Search & Sort/Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
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
            <SelectItem value="name">By Title</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Category..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-2">📝 SEO Best Practices</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>H1:</strong> Article title (auto-set)</li>
          <li>• <strong>Meta Title:</strong> Under 60 chars with main keyword</li>
          <li>• <strong>Meta Description:</strong> Under 160 chars, compelling summary</li>
          <li>• <strong>Content:</strong> Use H2 for sections, H3 for subsections</li>
          <li>• <strong>Images:</strong> Add descriptive alt text</li>
        </ul>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-2">
          {filteredPosts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
            >
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  p.cover_emoji || "📰"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{p.title}</p>
                  {p.is_featured && <Star className="w-3 h-3 text-accent fill-accent" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {p.category}
                  </Badge>
                  {p.is_published ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Eye className="w-3 h-3" /> Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> Draft
                    </span>
                  )}
                  {(p.linked_product_id || p.linked_brand) && (
                    <Badge variant="secondary" className="text-xs">
                      🔗 Linked
                    </Badge>
                  )}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => openDialog(p)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => handleDelete(p.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPost?.id ? "Edit" : "Add"} Blog Article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <FormField label="Title (H1)" required error={errors.title}>
                  <Input
                    placeholder="Article title"
                    value={editPost?.title || ""}
                    onChange={(e) => {
                      setEditPost((p) => (p ? { ...p, title: e.target.value } : p));
                      clearError("title");
                    }}
                  />
                </FormField>
              </div>
              <FormField label="Slug (URL)">
                <Input
                  placeholder="auto-generated-from-title"
                  value={editPost?.slug || ""}
                  onChange={(e) =>
                    setEditPost((p) => (p ? { ...p, slug: e.target.value } : p))
                  }
                />
              </FormField>
              <FormField label="Category">
                <Select
                  value={editPost?.category || ""}
                  onValueChange={(v) =>
                    setEditPost((p) => (p ? { ...p, category: v } : p))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Article Linking */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">🔗 Link to Product/Brand</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Link this article to a specific product or brand to show it on their detail pages.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Link to Product">
                  <Select
                    value={editPost?.linked_product_id || "none"}
                    onValueChange={(v) =>
                      setEditPost((p) => (p ? { ...p, linked_product_id: v === "none" ? null : v } : p))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {products.map((prod) => (
                        <SelectItem key={prod.id} value={prod.id}>
                          {prod.brand} - {prod.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Link to Brand">
                  <Select
                    value={editPost?.linked_brand || "none"}
                    onValueChange={(v) =>
                      setEditPost((p) => (p ? { ...p, linked_brand: v === "none" ? null : v } : p))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.brand_name}>
                          {b.brand_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </div>

            {/* SEO Fields */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">🔍 SEO Settings</h4>
              <div className="space-y-3">
                <FormField label="Meta Title (max 60 chars)" hint={`${editPost?.meta_title?.length || 0}/60 characters`}>
                  <Input
                    placeholder="SEO title for search results"
                    value={editPost?.meta_title || ""}
                    maxLength={60}
                    onChange={(e) =>
                      setEditPost((p) => (p ? { ...p, meta_title: e.target.value } : p))
                    }
                  />
                </FormField>
                <FormField label="Meta Description (max 160 chars)" hint={`${editPost?.meta_description?.length || 0}/160 characters`}>
                  <Textarea
                    placeholder="Compelling description for search results"
                    value={editPost?.meta_description || ""}
                    maxLength={160}
                    rows={2}
                    onChange={(e) =>
                      setEditPost((p) =>
                        p ? { ...p, meta_description: e.target.value } : p
                      )
                    }
                  />
                </FormField>
              </div>
            </div>

            {/* Content */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                📝 Content
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Rich Editor
                </Badge>
              </h4>
              <div className="space-y-3">
                <FormField label="Excerpt (Short preview for cards & search results)" hint="2-3 sentences, under 160 chars for SEO">
                  <Textarea
                    placeholder="Brief summary of the article that appears in search results and article cards..."
                    value={editPost?.excerpt || ""}
                    rows={2}
                    maxLength={160}
                    onChange={(e) =>
                      setEditPost((p) => (p ? { ...p, excerpt: e.target.value } : p))
                    }
                  />
                  <span className="text-xs text-muted-foreground">{editPost?.excerpt?.length || 0}/160</span>
                </FormField>
                <FormField label="Article Content">
                  <RichTextEditor
                    value={editPost?.content || ""}
                    onChange={(content) =>
                      setEditPost((p) => (p ? { ...p, content } : p))
                    }
                    placeholder="Start writing your article content..."
                  />
                </FormField>
              </div>
            </div>

            {/* Media */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">🖼️ Media</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <FormField label="Cover Image" hint="📐 1200×630px (1.91:1 OG ratio) for social sharing">
                    <ImageUpload
                      value={editPost?.cover_image_url || null}
                      onChange={(url) =>
                        setEditPost((p) =>
                          p ? { ...p, cover_image_url: url } : p
                        )
                      }
                      folder="blog"
                      recommendedSize="1200 × 630 px"
                      aspectRatio="1.91:1 (Open Graph)"
                      aspectHint="Optimized for social sharing previews"
                    />
                  </FormField>
                </div>
                <FormField label="Cover Emoji (fallback)">
                  <Input
                    placeholder="📰"
                    value={editPost?.cover_emoji || ""}
                    onChange={(e) =>
                      setEditPost((p) =>
                        p ? { ...p, cover_emoji: e.target.value } : p
                      )
                    }
                  />
                </FormField>
                <FormField label="Author">
                  <Input
                    placeholder="Author name"
                    value={editPost?.author || ""}
                    onChange={(e) =>
                      setEditPost((p) => (p ? { ...p, author: e.target.value } : p))
                    }
                  />
                </FormField>
              </div>
            </div>

            {/* Publish Settings */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">⚙️ Settings</h4>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editPost?.is_published || false}
                      onCheckedChange={(v) =>
                        setEditPost((p) => (p ? { ...p, is_published: v } : p))
                      }
                    />
                    <span className="text-sm">Published</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editPost?.is_featured || false}
                      onCheckedChange={(v) =>
                        setEditPost((p) => (p ? { ...p, is_featured: v } : p))
                      }
                    />
                    <span className="text-sm">Featured</span>
                  </div>
                </div>
                
                {/* Notify Users */}
                {editPost?.is_published && !editPost?.published_at && (
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editPost?.notify_users || false}
                        onCheckedChange={(v) =>
                          setEditPost((p) => (p ? { ...p, notify_users: v } : p))
                        }
                      />
                      <div>
                        <span className="text-sm font-medium">🔔 Notify users about this article</span>
                        <p className="text-xs text-muted-foreground">
                          Send a notification to all users when this article is published
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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

export default AdminBlog;