import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Star, DollarSign, Heart, MessageSquare, Search, Copy, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import FormField from "@/components/admin/FormField";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import ImageUpload from "@/components/admin/ImageUpload";
import SearchableSelect from "@/components/admin/SearchableSelect";
import { useFormValidation, ValidationSchema } from "@/hooks/useFormValidation";
import CsvButtons from "@/components/admin/CsvButtons";
import { useCsvOperations } from "@/hooks/useCsvOperations";
import { generateSlug, generateProductSlug } from "@/lib/slug";

interface FAQ {
  question: string;
  answer: string;
}

interface Product {
  id: string;
  slug: string | null;
  name: string;
  brand: string;
  category_id: string | null;
  sub_category_id: string | null;
  image_emoji: string | null;
  image_url: string | null;
  rating: number | null;
  abv: number | null;
  volume: string | null;
  age: string | null;
  origin: string | null;
  origin_flag: string | null;
  description: string | null;
  taste_profile: string | null;
  tasting_notes: string | null;
  type_tag: string | null;
  type_description: string | null;
  is_trending: boolean | null;
  is_all_time_favourite: boolean | null;
  meta_title: string | null;
  meta_description: string | null;
  faqs: FAQ[] | null;
}

interface SubCategory {
  id: string;
  name: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  emoji: string | null;
}

interface Brand {
  id: string;
  brand_name: string;
}

interface City {
  id: string;
  name: string;
  state?: { name: string } | null;
}

interface ProductPrice {
  id: string;
  city_id: string;
  volume: string;
  price: number;
  mrp: number | null;
  in_stock: boolean | null;
}

// Default volume suggestions (user can add custom volumes)
const DEFAULT_VOLUME_SUGGESTIONS = ['1000ml', '750ml', '500ml', '375ml', '180ml', '90ml'];

interface ProductReview {
  id: string;
  product_id: string | null;
  reviewer_name: string | null;
  title: string | null;
  content: string | null;
  rating: number | null;
  taste_rating: number | null;
  value_rating: number | null;
  rebuy_rating: number | null;
  is_approved: boolean | null;
  is_featured: boolean | null;
}

const validationSchema: ValidationSchema = {
  name: { required: true, minLength: 2 },
  brand: { required: true },
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showReviewsDialog, setShowReviewsDialog] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productPrices, setProductPrices] = useState<ProductPrice[]>([]);
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);
  const [priceInputs, setPriceInputs] = useState<Record<string, Record<string, { price: string; mrp: string; in_stock: boolean }>>>({});
  const [selectedPriceCity, setSelectedPriceCity] = useState<string | null>(null);
  const [newVolumeInput, setNewVolumeInput] = useState("");
  const [customVolumes, setCustomVolumes] = useState<string[]>([]);
  const [hiddenVolumes, setHiddenVolumes] = useState<string[]>([]); // Track hidden default volumes
  const [searchQuery, setSearchQuery] = useState("");
  const [editReview, setEditReview] = useState<ProductReview | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [variantMode, setVariantMode] = useState(false);
  const [selectedBulkCities, setSelectedBulkCities] = useState<string[]>([]);
  const [bulkPriceInputs, setBulkPriceInputs] = useState<Record<string, { price: string; mrp: string; in_stock: boolean }>>({});
  const [duplicateVolumes, setDuplicateVolumes] = useState<string[]>([]);
  const { toast } = useToast();
  const { errors, validate, clearErrors, clearError } = useFormValidation(validationSchema);

  const [sortOrder, setSortOrder] = useState<"latest" | "oldest" | "name">("latest");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) {
      // Parse faqs from JSON
      const parsed = data.map(p => ({
        ...p,
        faqs: Array.isArray(p.faqs) ? (p.faqs as unknown as FAQ[]) : []
      }));
      setProducts(parsed);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name, emoji").order("name");
    if (data) setCategories(data);
  };

  const fetchSubCategories = async () => {
    const { data } = await supabase.from("sub_categories").select("id, name, category_id").order("name");
    if (data) setSubCategories(data);
  };

  const fetchBrands = async () => {
    const { data } = await supabase.from("brand_spotlights").select("id, brand_name").order("brand_name");
    if (data) setBrands(data);
  };

  const fetchCities = async () => {
    const { data } = await supabase
      .from("cities")
      .select("id, name, state:states(name)")
      .eq("is_visible", true)
      .order("name");
    if (data) setCities(data);
  };

  const fetchProductPrices = async (productId: string) => {
    const { data } = await supabase
      .from("product_prices")
      .select("*")
      .eq("product_id", productId);
    if (data) {
      setProductPrices(data.map(p => ({ ...p, volume: p.volume || '750ml' })));
      // Group prices by city and volume
      const inputs: Record<string, Record<string, { price: string; mrp: string; in_stock: boolean }>> = {};
      const existingVolumes = new Set<string>();
      data.forEach((p) => {
        if (!inputs[p.city_id]) inputs[p.city_id] = {};
        const vol = p.volume || '750ml';
        existingVolumes.add(vol);
        inputs[p.city_id][vol] = {
          price: p.price.toString(),
          mrp: p.mrp?.toString() || "",
          in_stock: p.in_stock ?? true,
        };
      });
      setPriceInputs(inputs);
      // Set custom volumes from existing data
      const nonDefaultVolumes = Array.from(existingVolumes).filter(v => !DEFAULT_VOLUME_SUGGESTIONS.includes(v));
      setCustomVolumes(nonDefaultVolumes);
      // Set first city as selected
      if (cities.length > 0 && !selectedPriceCity) {
        setSelectedPriceCity(cities[0].id);
      }
    }
  };

  const fetchProductReviews = async (productId: string) => {
    const { data } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (data) setProductReviews(data);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubCategories();
    fetchBrands();
    fetchCities();
  }, []);

  const getCategoryName = (id: string | null) => {
    if (!id) return "";
    return categories.find((c) => c.id === id)?.name || "";
  };

  const getSubCategoryName = (id: string | null) => {
    if (!id) return "";
    return subCategories.find((s) => s.id === id)?.name || "";
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query) ||
          categories.find((c) => c.id === p.category_id)?.name?.toLowerCase().includes(query) ||
          subCategories.find((s) => s.id === p.sub_category_id)?.name?.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (filterCategory && filterCategory !== "all") {
      result = result.filter((p) => p.category_id === filterCategory);
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortOrder === "name") {
        return `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`);
      }
      // For latest/oldest, we rely on the order from DB but can reverse
      return 0; // Already sorted by created_at from fetch
    });
    
    if (sortOrder === "oldest") {
      result.reverse();
    }
    
    return result;
  }, [products, searchQuery, categories, subCategories, sortOrder, filterCategory]);

  const handleSave = async () => {
    if (!editProduct) return;

    if (!validate({ name: editProduct.name, brand: editProduct.brand })) {
      toast({ title: "Validation Error", description: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }

    // Auto-generate slug if not set - SEO-friendly format
    const slug = editProduct.slug || generateProductSlug(editProduct.brand, editProduct.name);

    const productData = {
      name: editProduct.name,
      brand: editProduct.brand,
      slug,
      category_id: editProduct.category_id,
      sub_category_id: editProduct.sub_category_id,
      image_emoji: editProduct.image_emoji,
      image_url: editProduct.image_url,
      rating: editProduct.rating ? Number(editProduct.rating) : null,
      abv: editProduct.abv ? Number(editProduct.abv) : null,
      volume: editProduct.volume,
      age: editProduct.age,
      origin: editProduct.origin,
      origin_flag: editProduct.origin_flag,
      description: editProduct.description,
      taste_profile: editProduct.taste_profile,
      tasting_notes: editProduct.tasting_notes,
      type_tag: editProduct.type_tag,
      type_description: editProduct.type_description,
      is_trending: editProduct.is_trending,
      is_all_time_favourite: editProduct.is_all_time_favourite,
      meta_title: editProduct.meta_title,
      meta_description: editProduct.meta_description,
      faqs: JSON.parse(JSON.stringify(editProduct.faqs || [])),
    };

    if (editProduct.id) {
      const { error } = await supabase.from("products").update(productData).eq("id", editProduct.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Success", description: "Product saved!" });
      setShowDialog(false);
      setEditProduct(null);
      clearErrors();
      fetchProducts();
    } else {
      const { data, error } = await supabase.from("products").insert([productData]).select("id").single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Success", description: "Product created — you can now add prices." });
      // Keep the dialog open with the new id so admin can click "Manage Variants" right away
      setEditProduct((p) => (p ? { ...p, id: data!.id } : p));
      clearErrors();
      fetchProducts();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      toast({ title: "Deleted" });
      fetchProducts();
    }
  };

  const openPriceDialog = (productId: string) => {
    setSelectedProductId(productId);
    setHiddenVolumes([]); // Reset hidden volumes when opening dialog
    fetchProductPrices(productId);
    setShowPriceDialog(true);
  };

  // Live duplicate detection across all visible variants (trim + case-fold)
  const visibleVolumes = useMemo(
    () => [...DEFAULT_VOLUME_SUGGESTIONS.filter(v => !hiddenVolumes.includes(v)), ...customVolumes],
    [hiddenVolumes, customVolumes]
  );
  useEffect(() => {
    const seen = new Map<string, string>();
    const dups: string[] = [];
    for (const v of visibleVolumes) {
      const key = v.trim().toLowerCase();
      if (seen.has(key)) dups.push(v, seen.get(key)!);
      else seen.set(key, v);
    }
    setDuplicateVolumes(Array.from(new Set(dups)));
  }, [visibleVolumes]);

  const savePrices = async () => {
    if (!selectedProductId) return;

    // Block on duplicates
    if (duplicateVolumes.length > 0) {
      toast({
        title: "Duplicate quantities",
        description: `Remove duplicates: ${duplicateVolumes.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Determine which cities are "selected" (have any input or existing prices)
    const citiesWithInput = new Set<string>(
      Object.keys(priceInputs).filter(cityId =>
        Object.values(priceInputs[cityId] || {}).some(v => v.price && v.price.trim() !== "")
      )
    );
    productPrices.forEach(p => citiesWithInput.add(p.city_id));

    // Block on missing prices: any visible variant × any selected city must have a price
    const missing: string[] = [];
    for (const cityId of citiesWithInput) {
      const cityName = cities.find(c => c.id === cityId)?.name || cityId;
      for (const volume of visibleVolumes) {
        const val = priceInputs[cityId]?.[volume]?.price;
        if (!val || isNaN(Number(val)) || Number(val) <= 0) {
          missing.push(`${cityName} → ${volume}`);
        }
      }
    }
    if (missing.length > 0) {
      toast({
        title: `Missing ${missing.length} price${missing.length > 1 ? "s" : ""}`,
        description: missing.slice(0, 6).join(" • ") + (missing.length > 6 ? ` …+${missing.length - 6} more` : ""),
        variant: "destructive",
      });
      return;
    }

    const updates: any[] = [];
    const inserts: any[] = [];
    let count = 0;

    for (const [cityId, volumePrices] of Object.entries(priceInputs)) {
      for (const [volume, { price, mrp, in_stock }] of Object.entries(volumePrices)) {
        if (!price || isNaN(Number(price)) || Number(price) <= 0) continue;
        count++;
        const existingPrice = productPrices.find((p) => p.city_id === cityId && p.volume === volume);
        const priceData = {
          product_id: selectedProductId,
          city_id: cityId,
          volume,
          price: Number(price),
          mrp: mrp ? Number(mrp) : null,
          in_stock,
        };
        if (existingPrice) {
          updates.push(supabase.from("product_prices").update(priceData).eq("id", existingPrice.id));
        } else {
          inserts.push(priceData);
        }
      }
    }

    if (count === 0) {
      toast({ title: "Nothing to save", description: "Enter at least one price before saving.", variant: "destructive" });
      return;
    }

    const tasks: any[] = [...updates];
    if (inserts.length) tasks.push(supabase.from("product_prices").insert(inserts));
    const results = await Promise.all(tasks);
    const errs = results.map(r => (r as any)?.error).filter(Boolean);
    if (errs.length) {
      toast({ title: "Some prices failed", description: errs[0].message, variant: "destructive" });
    } else {
      toast({ title: `Saved ${count} price${count > 1 ? "s" : ""} ⚡` });
    }
    setShowPriceDialog(false);
  };

  const openReviewsDialog = (productId: string) => {
    setSelectedProductId(productId);
    fetchProductReviews(productId);
    setShowReviewsDialog(true);
  };

  const newReview = (): ProductReview => ({
    id: "",
    product_id: selectedProductId,
    reviewer_name: "",
    title: "",
    content: "",
    rating: 4,
    taste_rating: 4,
    value_rating: 4,
    rebuy_rating: 4,
    is_approved: true,
    is_featured: false,
  });

  const saveReview = async () => {
    if (!editReview || !selectedProductId) return;

    const reviewData = {
      product_id: selectedProductId,
      reviewer_name: editReview.reviewer_name,
      title: editReview.title,
      content: editReview.content,
      rating: editReview.rating,
      taste_rating: editReview.taste_rating,
      value_rating: editReview.value_rating,
      rebuy_rating: editReview.rebuy_rating,
      is_approved: editReview.is_approved,
      is_featured: editReview.is_featured,
    };

    const { error } = editReview.id
      ? await supabase.from("product_reviews").update(reviewData).eq("id", editReview.id)
      : await supabase.from("product_reviews").insert([reviewData]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review saved!" });
      setShowReviewDialog(false);
      setEditReview(null);
      fetchProductReviews(selectedProductId);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    await supabase.from("product_reviews").delete().eq("id", id);
    if (selectedProductId) fetchProductReviews(selectedProductId);
  };

  const addFAQ = () => {
    setEditProduct((p) => {
      if (!p) return p;
      const currentFaqs = p.faqs || [];
      return { ...p, faqs: [...currentFaqs, { question: "", answer: "" }] };
    });
  };

  const updateFAQ = (index: number, field: "question" | "answer", value: string) => {
    setEditProduct((p) => {
      if (!p) return p;
      const faqs = [...(p.faqs || [])];
      faqs[index] = { ...faqs[index], [field]: value };
      return { ...p, faqs };
    });
  };

  const removeFAQ = (index: number) => {
    setEditProduct((p) => {
      if (!p) return p;
      const faqs = [...(p.faqs || [])];
      faqs.splice(index, 1);
      return { ...p, faqs };
    });
  };

  const newProduct: Product = {
    id: "",
    slug: null,
    name: "",
    brand: "",
    category_id: null,
    sub_category_id: null,
    image_emoji: "🥃",
    image_url: null,
    rating: 4.0,
    abv: 40,
    volume: "750ml",
    age: null,
    origin: "India",
    origin_flag: "🇮🇳",
    description: null,
    taste_profile: null,
    tasting_notes: null,
    type_tag: null,
    type_description: null,
    is_trending: false,
    is_all_time_favourite: false,
    meta_title: null,
    meta_description: null,
    faqs: [],
  };

  // getCategoryName and getSubCategoryName moved before filteredProducts useMemo

  const openDialog = (product: Product) => {
    setEditProduct(product);
    clearErrors();
    setShowDialog(true);
  };

  // All product columns for CSV operations
  const allProductColumns = [
    "id", "slug", "name", "brand", "category_id", "sub_category_id",
    "image_emoji", "image_url", "rating", "abv", "volume", "age",
    "origin", "origin_flag", "description", "taste_profile", "tasting_notes",
    "type_tag", "type_description", "is_trending", "is_all_time_favourite",
    "meta_title", "meta_description", "faqs"
  ];

  const csvOps = useCsvOperations<Product>({
    tableName: "products",
    columns: allProductColumns,
    excludeColumns: [], // Include all columns in export, even id for reference
    formatRow: (row) => {
      const formatted: Record<string, string> = {};
      allProductColumns.forEach(col => {
        const value = (row as any)[col];
        if (value === null || value === undefined) {
          formatted[col] = "";
        } else if (typeof value === "object") {
          formatted[col] = JSON.stringify(value);
        } else if (typeof value === "boolean") {
          formatted[col] = value ? "true" : "false";
        } else {
          formatted[col] = String(value);
        }
      });
      // Add category and subcategory names for reference (inline lookup to avoid hoisting issues)
      const catName = row.category_id ? categories.find(c => c.id === row.category_id)?.name || "" : "";
      const subCatName = row.sub_category_id ? subCategories.find(s => s.id === row.sub_category_id)?.name || "" : "";
      formatted["category_name"] = catName;
      formatted["sub_category_name"] = subCatName;
      return formatted;
    },
    parseRow: (row) => {
      const parsed: Partial<Product> = {};
      
      // Handle each field properly
      if (row.id && row.id.trim()) parsed.id = row.id.trim();
      if (row.slug) parsed.slug = row.slug.trim() || null;
      if (row.name) parsed.name = row.name.trim();
      if (row.brand) parsed.brand = row.brand.trim();
      
      // Handle foreign keys - look up by name if id not provided
      if (row.category_id && row.category_id.trim()) {
        parsed.category_id = row.category_id.trim();
      } else if (row.category_name && row.category_name.trim()) {
        const cat = categories.find(c => c.name.toLowerCase() === row.category_name.trim().toLowerCase());
        if (cat) parsed.category_id = cat.id;
      }
      
      if (row.sub_category_id && row.sub_category_id.trim()) {
        parsed.sub_category_id = row.sub_category_id.trim();
      } else if (row.sub_category_name && row.sub_category_name.trim()) {
        const subCat = subCategories.find(s => s.name.toLowerCase() === row.sub_category_name.trim().toLowerCase());
        if (subCat) parsed.sub_category_id = subCat.id;
      }
      
      parsed.image_emoji = row.image_emoji || null;
      parsed.image_url = row.image_url || null;
      parsed.rating = row.rating ? Number(row.rating) : null;
      parsed.abv = row.abv ? Number(row.abv) : null;
      parsed.volume = row.volume || null;
      parsed.age = row.age || null;
      parsed.origin = row.origin || null;
      parsed.origin_flag = row.origin_flag || null;
      parsed.description = row.description || null;
      parsed.taste_profile = row.taste_profile || null;
      parsed.tasting_notes = row.tasting_notes || null;
      parsed.type_tag = row.type_tag || null;
      parsed.type_description = row.type_description || null;
      parsed.meta_title = row.meta_title || null;
      parsed.meta_description = row.meta_description || null;
      parsed.is_trending = row.is_trending === "true";
      parsed.is_all_time_favourite = row.is_all_time_favourite === "true";
      
      // Handle FAQs
      if (row.faqs) {
        try {
          parsed.faqs = JSON.parse(row.faqs);
        } catch {
          parsed.faqs = [];
        }
      } else {
        parsed.faqs = [];
      }
      
      return parsed;
    },
  });

  const handleCsvImport = async (rows: Partial<Product>[]) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const { id, ...rest } = row as Product;
        
        // Prepare data - ensure required fields
        if (!rest.name || !rest.brand) {
          errors.push(`Row ${i + 1}: Missing name or brand`);
          errorCount++;
          continue;
        }
        
        // Generate slug if not provided - SEO-friendly format
        if (!rest.slug) {
          rest.slug = generateProductSlug(rest.brand, rest.name);
        }
        
        // Ensure proper typing
        const data: Record<string, unknown> = {
          name: rest.name,
          brand: rest.brand,
          slug: rest.slug,
          category_id: rest.category_id || null,
          sub_category_id: rest.sub_category_id || null,
          image_emoji: rest.image_emoji || null,
          image_url: rest.image_url || null,
          rating: rest.rating ? Number(rest.rating) : null,
          abv: rest.abv ? Number(rest.abv) : null,
          volume: rest.volume || null,
          age: rest.age || null,
          origin: rest.origin || null,
          origin_flag: rest.origin_flag || null,
          description: rest.description || null,
          taste_profile: rest.taste_profile || null,
          tasting_notes: rest.tasting_notes || null,
          type_tag: rest.type_tag || null,
          type_description: rest.type_description || null,
          is_trending: Boolean(rest.is_trending),
          is_all_time_favourite: Boolean(rest.is_all_time_favourite),
          meta_title: rest.meta_title || null,
          meta_description: rest.meta_description || null,
          faqs: Array.isArray(rest.faqs) ? rest.faqs : [],
        };
        
        if (id && id.trim()) {
          const { error } = await supabase.from("products").update(data).eq("id", id);
          if (error) {
            errors.push(`Row ${i + 1}: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          const { error } = await supabase.from("products").insert([data as { name: string; brand: string; [key: string]: unknown }]);
          if (error) {
            errors.push(`Row ${i + 1}: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        }
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        errorCount++;
      }
    }
    
    if (errors.length > 0) {
      console.error("Import errors:", errors);
    }
    
    toast({
      title: "Import Complete",
      description: `${successCount} products saved, ${errorCount} errors${errors.length > 0 ? `. Check console for details.` : ''}`,
      variant: errorCount > 0 ? "destructive" : "default",
    });
    
    fetchProducts();
  };

  const downloadCategoryMapping = () => {
    const csvContent = [
      "category_id,category_name,emoji",
      ...categories.map(c => `${c.id},"${c.name}",${c.emoji || ""}`)
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "category_id_mapping.csv";
    link.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Downloaded", description: "Category ID mapping exported" });
  };

  const downloadSubCategoryMapping = () => {
    const csvContent = [
      "sub_category_id,sub_category_name,parent_category_id,parent_category_name",
      ...subCategories.map(s => {
        const parentCat = categories.find(c => c.id === s.category_id);
        return `${s.id},"${s.name}",${s.category_id || ""},"${parentCat?.name || ""}"`;
      })
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "subcategory_id_mapping.csv";
    link.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Downloaded", description: "Sub-category ID mapping exported" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Products ({filteredProducts.length})</h2>
        <div className="flex items-center gap-2">
          <AdminSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search products..."
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-1" /> ID Mappings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={downloadCategoryMapping}>
                Download Category IDs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadSubCategoryMapping}>
                Download Sub-Category IDs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <CsvButtons
            onExport={() => csvOps.exportToCsv(products)}
            onImportClick={csvOps.triggerFileInput}
            fileInputRef={csvOps.fileInputRef}
            onFileChange={(e) => {
              const file = e.target.files?.[0];
              if (file) csvOps.importFromCsv(file, handleCsvImport);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={() => openDialog(newProduct)}>
            <Plus className="w-4 h-4 mr-1" /> Add Product
          </Button>
        </div>
      </div>

      {/* Sort & Filter Controls */}
      <div className="flex items-center gap-3 flex-wrap">
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
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter category..." />
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
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
            >
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{p.image_emoji}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {p.brand} {p.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> {p.rating}
                  </span>
                  <span>•</span>
                  <span>{p.volume}</span>
                  {p.abv && (
                    <>
                      <span>•</span>
                      <span>{p.abv}%</span>
                    </>
                  )}
                  {getCategoryName(p.category_id) && (
                    <Badge variant="outline" className="text-xs">
                      {getCategoryName(p.category_id)}
                    </Badge>
                  )}
                  {p.is_all_time_favourite && (
                    <Badge className="bg-pink-500/10 text-pink-500 text-xs">
                      <Heart className="w-3 h-3 mr-1 fill-current" /> Favourite
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => openReviewsDialog(p.id)}
                title="Manage Reviews"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => openPriceDialog(p.id)}
                title="Manage Prices"
              >
                <DollarSign className="w-4 h-4" />
              </Button>
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

      {/* Product Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct?.id ? "Edit" : "Add"} Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Brand & Name */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Brand" required error={errors.brand}>
                <SearchableSelect
                  options={brands.map(b => ({ value: b.brand_name, label: b.brand_name }))}
                  value={editProduct?.brand || ""}
                  onValueChange={(v) => {
                    setEditProduct((p) => (p ? { ...p, brand: v } : p));
                    clearError("brand");
                  }}
                  placeholder="Select brand"
                  searchPlaceholder="Search brands..."
                />
              </FormField>
              <FormField label="Product Name" required error={errors.name}>
                <Input
                  placeholder="e.g., Black Label"
                  value={editProduct?.name || ""}
                  onChange={(e) => {
                    setEditProduct((p) => (p ? { ...p, name: e.target.value } : p));
                    clearError("name");
                  }}
                />
              </FormField>
            </div>

            {/* Slug (SEO URL) */}
            <FormField label="URL Slug (SEO)" hint="Auto-generated from brand + name. Edit for custom URL.">
              <div className="flex gap-2">
                <Input
                  placeholder="johnnie-walker-black-label"
                  value={editProduct?.slug || ""}
                  onChange={(e) =>
                    setEditProduct((p) => (p ? { ...p, slug: e.target.value } : p))
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editProduct?.brand && editProduct?.name) {
                      setEditProduct((p) => (p ? { ...p, slug: generateProductSlug(p.brand, p.name) } : p));
                    }
                  }}
                >
                  Generate
                </Button>
              </div>
            </FormField>

            {/* Category & Sub-Category */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Category">
                <SearchableSelect
                  options={categories.map(c => ({ value: c.id, label: c.name, emoji: c.emoji }))}
                  value={editProduct?.category_id || ""}
                  onValueChange={(v) => setEditProduct((p) => (p ? { ...p, category_id: v, sub_category_id: null } : p))}
                  placeholder="Select category"
                  searchPlaceholder="Search categories..."
                />
              </FormField>
              <FormField label="Sub-Category">
                <SearchableSelect
                  options={subCategories
                    .filter((sc) => sc.category_id === editProduct?.category_id)
                    .map(sc => ({ value: sc.id, label: sc.name }))}
                  value={editProduct?.sub_category_id || ""}
                  onValueChange={(v) => setEditProduct((p) => (p ? { ...p, sub_category_id: v || null } : p))}
                  placeholder={editProduct?.category_id ? "Select sub-category" : "Select category first"}
                  searchPlaceholder="Search sub-categories..."
                  disabled={!editProduct?.category_id}
                />
              </FormField>
            </div>

            {/* Image */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Product Image">
                <ImageUpload
                  value={editProduct?.image_url || null}
                  onChange={(url) => setEditProduct((p) => (p ? { ...p, image_url: url } : p))}
                  folder="products"
                  recommendedSize="600 × 600 px"
                  aspectRatio="1:1 square"
                  aspectHint="Centered bottle on transparent/white background"
                />
              </FormField>
              <FormField label="Emoji (fallback)">
                <Input
                  placeholder="🥃"
                  value={editProduct?.image_emoji || ""}
                  onChange={(e) => setEditProduct((p) => (p ? { ...p, image_emoji: e.target.value } : p))}
                />
              </FormField>
            </div>

            {/* Volume, ABV, Age */}
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Volume">
                <Input
                  placeholder="750ml"
                  value={editProduct?.volume || ""}
                  onChange={(e) => setEditProduct((p) => (p ? { ...p, volume: e.target.value } : p))}
                />
              </FormField>
              <FormField label="ABV %">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="40"
                  value={editProduct?.abv || ""}
                  onChange={(e) =>
                    setEditProduct((p) => (p ? { ...p, abv: Number(e.target.value) || null } : p))
                  }
                />
              </FormField>
              <FormField label="Age">
                <Input
                  placeholder="12 Years"
                  value={editProduct?.age || ""}
                  onChange={(e) =>
                    setEditProduct((p) => (p ? { ...p, age: e.target.value || null } : p))
                  }
                />
              </FormField>
            </div>

            {/* Origin & Rating */}
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Origin Country">
                <Input
                  placeholder="Scotland"
                  value={editProduct?.origin || ""}
                  onChange={(e) =>
                    setEditProduct((p) => (p ? { ...p, origin: e.target.value || null } : p))
                  }
                />
              </FormField>
              <FormField label="Origin Flag">
                <Input
                  placeholder="🏴󠁧󠁢󠁳󠁣󠁴󠁿"
                  value={editProduct?.origin_flag || ""}
                  onChange={(e) =>
                    setEditProduct((p) => (p ? { ...p, origin_flag: e.target.value || null } : p))
                  }
                />
              </FormField>
              <FormField label="Admin Rating" hint="Default rating if no user reviews">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="4.5"
                  value={editProduct?.rating || ""}
                  onChange={(e) =>
                    setEditProduct((p) => (p ? { ...p, rating: Number(e.target.value) || null } : p))
                  }
                />
              </FormField>
            </div>

            {/* SEO Section */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">🔍 SEO & Canonical Tags</h4>
              <div className="grid grid-cols-1 gap-3">
                <FormField label="Product Slug (URL)" hint="Auto-generated from name. Defines the canonical URL.">
                  <div className="flex gap-2">
                    <Input
                      placeholder="product-slug"
                      value={editProduct?.slug || ""}
                      onChange={(e) =>
                        setEditProduct((p) => (p ? { ...p, slug: e.target.value || null } : p))
                      }
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => {
                      if (editProduct?.name && editProduct?.brand) {
                        const slug = generateProductSlug(editProduct.name, editProduct.brand);
                        setEditProduct((p) => (p ? { ...p, slug } : p));
                      }
                    }}>
                      Auto
                    </Button>
                  </div>
                  {editProduct?.slug && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Canonical: <code className="bg-secondary px-1 rounded">https://www.bevory.in/product/{editProduct.slug}</code>
                    </p>
                  )}
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Meta Title" hint={`${(editProduct?.meta_title || '').length}/60 chars`}>
                    <Input
                      placeholder="Product name - Brand | BevOry"
                      value={editProduct?.meta_title || ""}
                      maxLength={60}
                      onChange={(e) =>
                        setEditProduct((p) => (p ? { ...p, meta_title: e.target.value || null } : p))
                      }
                    />
                  </FormField>
                  <FormField label="Meta Description" hint={`${(editProduct?.meta_description || '').length}/160 chars`}>
                    <Input
                      placeholder="Short description for search results..."
                      value={editProduct?.meta_description || ""}
                      maxLength={160}
                      onChange={(e) =>
                        setEditProduct((p) => (p ? { ...p, meta_description: e.target.value || null } : p))
                      }
                    />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Type Tag & Description */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Type Tag">
                <Input
                  placeholder="Single Malt"
                  value={editProduct?.type_tag || ""}
                  onChange={(e) =>
                    setEditProduct((p) => (p ? { ...p, type_tag: e.target.value || null } : p))
                  }
                />
              </FormField>
              <FormField label="Type Description (What's this?)">
                <Input
                  placeholder="Made from 100% malted barley..."
                  value={editProduct?.type_description || ""}
                  onChange={(e) =>
                    setEditProduct((p) => (p ? { ...p, type_description: e.target.value || null } : p))
                  }
                />
              </FormField>
            </div>

            {/* Description */}
            <FormField label="Description">
              <Textarea
                placeholder="Product description..."
                value={editProduct?.description || ""}
                onChange={(e) =>
                  setEditProduct((p) => (p ? { ...p, description: e.target.value || null } : p))
                }
                rows={3}
              />
            </FormField>

            {/* Taste Profile & Notes */}
            <FormField label="Taste Profile">
              <Input
                placeholder="Smooth, Rich, Smoky"
                value={editProduct?.taste_profile || ""}
                onChange={(e) =>
                  setEditProduct((p) => (p ? { ...p, taste_profile: e.target.value || null } : p))
                }
              />
            </FormField>
            <FormField label="Tasting Notes">
              <Textarea
                placeholder="Notes of vanilla, oak, honey..."
                value={editProduct?.tasting_notes || ""}
                onChange={(e) =>
                  setEditProduct((p) => (p ? { ...p, tasting_notes: e.target.value || null } : p))
                }
                rows={2}
              />
            </FormField>

            {/* Variants & Pricing — nested manager */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">💰 Variants & Pricing</h4>
                  <p className="text-xs text-muted-foreground">
                    Add multiple sizes (e.g. 1L, 750ml, 350ml) — each with prices per city.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!editProduct?.id) {
                      toast({
                        title: "Save product first",
                        description: "Save the product, then add variants & pricing.",
                      });
                      return;
                    }
                    openPriceDialog(editProduct.id);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Manage Variants
                </Button>
              </div>
              {!editProduct?.id && (
                <p className="text-xs text-muted-foreground bg-secondary/40 rounded-md p-2">
                  Variants unlock after the first save.
                </p>
              )}
            </div>

            {/* FAQs Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">❓ FAQs</h4>
                <Button type="button" size="sm" variant="outline" onClick={addFAQ}>
                  <Plus className="w-4 h-4 mr-1" /> Add FAQ
                </Button>
              </div>
              <div className="space-y-3">
                {(editProduct?.faqs || []).map((faq, index) => (
                  <div key={index} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">FAQ #{index + 1}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive h-6 px-2"
                        onClick={() => removeFAQ(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Question"
                      value={faq.question}
                      onChange={(e) => updateFAQ(index, "question", e.target.value)}
                    />
                    <Textarea
                      placeholder="Answer"
                      value={faq.answer}
                      onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}
                {(!editProduct?.faqs || editProduct.faqs.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No FAQs added yet. Click "Add FAQ" to create one.
                  </p>
                )}
              </div>
            </div>

            {/* Toggles */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editProduct?.is_trending || false}
                    onCheckedChange={(v) => setEditProduct((p) => (p ? { ...p, is_trending: v } : p))}
                  />
                  <span className="text-sm">🔥 Trending Product</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editProduct?.is_all_time_favourite || false}
                    onCheckedChange={(v) => setEditProduct((p) => (p ? { ...p, is_all_time_favourite: v } : p))}
                  />
                  <span className="text-sm">❤️ All Time Favourite</span>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={handleSave}>
              Save Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price Management Dialog */}
      <Dialog open={showPriceDialog} onOpenChange={(open) => {
        setShowPriceDialog(open);
        if (!open) {
          setBulkMode(false);
          setSelectedBulkCities([]);
          setBulkPriceInputs({});
          setCitySearchQuery("");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
              <span>Manage Variants & Prices</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={variantMode ? "default" : "outline"}
                  onClick={() => { setVariantMode(true); setBulkMode(false); }}
                >
                  By Variant
                </Button>
                <Button
                  size="sm"
                  variant={bulkMode ? "default" : "outline"}
                  onClick={() => { setBulkMode(true); setVariantMode(false); setSelectedBulkCities([]); setBulkPriceInputs({}); }}
                >
                  <Copy className="w-4 h-4 mr-1" /> Bulk
                </Button>
                <Button
                  size="sm"
                  variant={!variantMode && !bulkMode ? "default" : "outline"}
                  onClick={() => { setVariantMode(false); setBulkMode(false); }}
                >
                  By City
                </Button>
              </div>
            </DialogTitle>
            {duplicateVolumes.length > 0 && (
              <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                Duplicate quantities detected (case-insensitive): <strong>{duplicateVolumes.join(", ")}</strong>. Saving is blocked until removed.
              </div>
            )}
          </DialogHeader>

          {variantMode ? (
            /* Variant-First Mode: each variant lists all cities */
            <ScrollArea className="h-[60vh] pr-3">
              <div className="space-y-2 mb-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new variant (e.g., 2.5L)"
                    value={newVolumeInput}
                    onChange={(e) => setNewVolumeInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const v = newVolumeInput.trim();
                      if (!v) return;
                      const exists = visibleVolumes.some(x => x.trim().toLowerCase() === v.toLowerCase());
                      if (exists) {
                        toast({ title: "Already exists", description: `"${v}" already in the list.`, variant: "destructive" });
                        return;
                      }
                      setCustomVolumes([...customVolumes, v]);
                      setNewVolumeInput("");
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  For each variant below, set price for every city. Variants with duplicate names are flagged.
                </p>
              </div>

              <div className="space-y-4">
                {visibleVolumes.map((volume) => {
                  const isDup = duplicateVolumes.includes(volume);
                  return (
                    <div
                      key={volume}
                      className={`rounded-lg border p-3 ${isDup ? "border-destructive bg-destructive/5" : "border-border bg-card"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-sm">{volume}</Badge>
                          {isDup && <span className="text-xs text-destructive font-medium">⚠ Duplicate name</span>}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (customVolumes.includes(volume)) setCustomVolumes(prev => prev.filter(v => v !== volume));
                            else setHiddenVolumes(prev => [...prev, volume]);
                            // Clear inputs for this volume across all cities
                            setPriceInputs(prev => {
                              const next = { ...prev };
                              for (const cid of Object.keys(next)) {
                                if (next[cid]?.[volume]) {
                                  next[cid] = { ...next[cid] };
                                  delete next[cid][volume];
                                }
                              }
                              return next;
                            });
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cities.map((city) => {
                          const v = priceInputs[city.id]?.[volume] || { price: "", mrp: "", in_stock: true };
                          const missing = !v.price || isNaN(Number(v.price)) || Number(v.price) <= 0;
                          const hasAnyForCity = Object.values(priceInputs[city.id] || {}).some(x => x.price);
                          const showError = hasAnyForCity && missing;
                          return (
                            <div
                              key={city.id}
                              className={`rounded-md p-2 border ${showError ? "border-destructive/60 bg-destructive/5" : "border-border bg-secondary/30"}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium truncate">{city.name}</span>
                                {showError && <span className="text-[10px] text-destructive">Missing</span>}
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                <Input
                                  type="number"
                                  placeholder="Price ₹"
                                  value={v.price}
                                  className="h-8 text-sm"
                                  onChange={(e) =>
                                    setPriceInputs(prev => ({
                                      ...prev,
                                      [city.id]: { ...prev[city.id], [volume]: { ...v, price: e.target.value } },
                                    }))
                                  }
                                />
                                <Input
                                  type="number"
                                  placeholder="MRP"
                                  value={v.mrp}
                                  className="h-8 text-sm"
                                  onChange={(e) =>
                                    setPriceInputs(prev => ({
                                      ...prev,
                                      [city.id]: { ...prev[city.id], [volume]: { ...v, mrp: e.target.value } },
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button className="w-full mt-4" onClick={savePrices} disabled={duplicateVolumes.length > 0}>
                Save All Variants & Prices
              </Button>
            </ScrollArea>
          ) : bulkMode ? (
            /* Bulk Pricing Mode */
            <div className="space-y-4">
              {/* City Search & Selection */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cities..."
                    value={citySearchQuery}
                    onChange={(e) => setCitySearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedBulkCities(cities.map(c => c.id))}
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedBulkCities([])}
                  >
                    Deselect All
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    {selectedBulkCities.length} cities selected
                  </span>
                </div>
              </div>

              <ScrollArea className="h-48 border rounded-lg p-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {cities
                    .filter(city => 
                      city.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
                      city.state?.name?.toLowerCase().includes(citySearchQuery.toLowerCase())
                    )
                    .map((city) => (
                      <div key={city.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`bulk-city-${city.id}`}
                          checked={selectedBulkCities.includes(city.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedBulkCities(prev => [...prev, city.id]);
                            } else {
                              setSelectedBulkCities(prev => prev.filter(id => id !== city.id));
                            }
                          }}
                        />
                        <label htmlFor={`bulk-city-${city.id}`} className="text-sm cursor-pointer">
                          {city.name} {city.state?.name ? `(${city.state.name})` : ''}
                        </label>
                      </div>
                    ))}
                </div>
              </ScrollArea>

              {/* Bulk Price Inputs */}
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Set prices for selected cities (will apply to all {selectedBulkCities.length} cities)
                </p>
                <ScrollArea className="h-[40vh] pr-4">
                  <div className="space-y-3">
                    {[...DEFAULT_VOLUME_SUGGESTIONS.filter(v => !hiddenVolumes.includes(v)), ...customVolumes].map((volume) => {
                      const volInput = bulkPriceInputs[volume] || { price: "", mrp: "", in_stock: true };
                      
                      const handleBulkDeleteVolume = async () => {
                        if (!selectedProductId || selectedBulkCities.length === 0) return;
                        
                        // Delete this volume from all selected cities
                        for (const cityId of selectedBulkCities) {
                          const existingPrice = productPrices.find((p) => p.city_id === cityId && p.volume === volume);
                          if (existingPrice) {
                            await supabase.from("product_prices").delete().eq("id", existingPrice.id);
                          }
                        }
                        
                        // Refresh prices
                        fetchProductPrices(selectedProductId);
                        
                        // Remove from custom volumes if it's a custom one, or hide if default
                        if (customVolumes.includes(volume)) {
                          setCustomVolumes(prev => prev.filter(v => v !== volume));
                        } else if (DEFAULT_VOLUME_SUGGESTIONS.includes(volume)) {
                          setHiddenVolumes(prev => [...prev, volume]);
                        }
                        
                        // Clear bulk price input for this volume
                        setBulkPriceInputs(prev => {
                          const updated = { ...prev };
                          delete updated[volume];
                          return updated;
                        });
                        
                        toast({ title: `${volume} removed from ${selectedBulkCities.length} cities` });
                      };
                      
                      return (
                        <div key={volume} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{volume}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={handleBulkDeleteVolume}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs">Price (₹)</span>
                              <Input
                                type="number"
                                placeholder="Leave empty to skip"
                                value={volInput.price}
                                onChange={(e) =>
                                  setBulkPriceInputs((prev) => ({
                                    ...prev,
                                    [volume]: { ...volInput, price: e.target.value },
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <span className="text-xs">MRP (₹)</span>
                              <Input
                                type="number"
                                placeholder="0"
                                value={volInput.mrp}
                                onChange={(e) =>
                                  setBulkPriceInputs((prev) => ({
                                    ...prev,
                                    [volume]: { ...volInput, mrp: e.target.value },
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              <Button 
                className="w-full" 
                disabled={selectedBulkCities.length === 0}
                onClick={async () => {
                  if (!selectedProductId || selectedBulkCities.length === 0) return;
                  
                  let count = 0;
                  for (const cityId of selectedBulkCities) {
                    for (const [volume, { price, mrp, in_stock }] of Object.entries(bulkPriceInputs)) {
                      if (!price) continue;
                      
                      const existingPrice = productPrices.find((p) => p.city_id === cityId && p.volume === volume);
                      const priceData = {
                        product_id: selectedProductId,
                        city_id: cityId,
                        volume,
                        price: Number(price),
                        mrp: mrp ? Number(mrp) : null,
                        in_stock,
                      };

                      if (existingPrice) {
                        await supabase.from("product_prices").update(priceData).eq("id", existingPrice.id);
                      } else {
                        await supabase.from("product_prices").insert(priceData);
                      }
                      count++;
                    }
                  }
                  
                  toast({ title: `Bulk prices saved for ${selectedBulkCities.length} cities!` });
                  setShowPriceDialog(false);
                  setBulkMode(false);
                  setSelectedBulkCities([]);
                  setBulkPriceInputs({});
                }}
              >
                Apply to {selectedBulkCities.length} Cities
              </Button>
            </div>
          ) : (
            /* Single City Mode */
            <>
              {/* City Selector Dropdown with Search */}
              <div className="mb-4 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cities..."
                    value={citySearchQuery}
                    onChange={(e) => setCitySearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedPriceCity || ""} onValueChange={setSelectedPriceCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities
                      .filter(city => 
                        city.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
                        city.state?.name?.toLowerCase().includes(citySearchQuery.toLowerCase())
                      )
                      .map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name} {city.state?.name ? `(${city.state.name})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPriceCity && (
                <ScrollArea className="h-[50vh] pr-4">
                  <div className="space-y-3">
                    {/* Add custom volume */}
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Add volume (e.g., 500ml)"
                        value={newVolumeInput}
                        onChange={(e) => setNewVolumeInput(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newVolumeInput && !customVolumes.includes(newVolumeInput) && !DEFAULT_VOLUME_SUGGESTIONS.includes(newVolumeInput)) {
                            setCustomVolumes([...customVolumes, newVolumeInput]);
                            setNewVolumeInput("");
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      Set prices for different volumes in {cities.find(c => c.id === selectedPriceCity)?.name}
                    </p>
                    
                    {/* Render all volumes (suggestions + custom, excluding hidden) */}
                    {[...DEFAULT_VOLUME_SUGGESTIONS.filter(v => !hiddenVolumes.includes(v)), ...customVolumes].map((volume) => {
                      const cityPrices = priceInputs[selectedPriceCity] || {};
                      const volInput = cityPrices[volume] || { price: "", mrp: "", in_stock: true };
                      const hasPrice = volInput.price && volInput.price !== "";
                      
                      const handleDeleteVolume = async () => {
                        // Delete from database if exists
                        const existingPrice = productPrices.find((p) => p.city_id === selectedPriceCity && p.volume === volume);
                        if (existingPrice) {
                          await supabase.from("product_prices").delete().eq("id", existingPrice.id);
                          setProductPrices(prev => prev.filter(p => p.id !== existingPrice.id));
                        }
                        // Remove from local state
                        setPriceInputs((prev) => {
                          const updated = { ...prev };
                          if (updated[selectedPriceCity]) {
                            delete updated[selectedPriceCity][volume];
                          }
                          return updated;
                        });
                        // Remove from custom volumes if it's a custom one, or hide if default
                        if (customVolumes.includes(volume)) {
                          setCustomVolumes(prev => prev.filter(v => v !== volume));
                        } else if (DEFAULT_VOLUME_SUGGESTIONS.includes(volume)) {
                          setHiddenVolumes(prev => [...prev, volume]);
                        }
                        toast({ title: "Volume price removed" });
                      };

                      return (
                        <div key={volume} className={`p-3 rounded-lg space-y-2 ${hasPrice ? 'bg-accent/10 border border-accent/20' : 'bg-secondary/50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{volume}</span>
                              {hasPrice && <Badge className="bg-green-500/10 text-green-600 text-xs">Active</Badge>}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={handleDeleteVolume}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs">Price (₹)</span>
                              <Input
                                type="number"
                                placeholder="Leave empty to skip"
                                value={volInput.price}
                                onChange={(e) =>
                                  setPriceInputs((prev) => ({
                                    ...prev,
                                    [selectedPriceCity]: {
                                      ...prev[selectedPriceCity],
                                      [volume]: { ...volInput, price: e.target.value },
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <span className="text-xs">MRP (₹)</span>
                              <Input
                                type="number"
                                placeholder="0"
                                value={volInput.mrp}
                                onChange={(e) =>
                                  setPriceInputs((prev) => ({
                                    ...prev,
                                    [selectedPriceCity]: {
                                      ...prev[selectedPriceCity],
                                      [volume]: { ...volInput, mrp: e.target.value },
                                    },
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              <Button className="w-full mt-4" onClick={savePrices}>
                Save All Prices
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reviews Management Dialog */}
      <Dialog open={showReviewsDialog} onOpenChange={setShowReviewsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Product Reviews</span>
              <Button size="sm" onClick={() => { setEditReview(newReview()); setShowReviewDialog(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add Review
              </Button>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3">
              {productReviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No reviews yet. Add the first one!</p>
              ) : (
                productReviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-lg bg-secondary/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.reviewer_name || "Anonymous"}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < (review.rating || 0) ? "fill-accent text-accent" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                        {review.is_featured && <Badge className="bg-accent/10 text-accent text-xs">Featured</Badge>}
                        {!review.is_approved && <Badge variant="outline" className="text-xs">Pending</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditReview(review); setShowReviewDialog(true); }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteReview(review.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {review.title && <p className="font-medium text-sm">{review.title}</p>}
                    {review.content && <p className="text-sm text-muted-foreground">{review.content}</p>}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {review.taste_rating && <span>Taste: {review.taste_rating}/5</span>}
                      {review.value_rating && <span>Value: {review.value_rating}/5</span>}
                      {review.rebuy_rating && <span>Rebuy: {review.rebuy_rating}/5</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editReview?.id ? "Edit" : "Add"} Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Reviewer Name">
              <Input
                placeholder="John Doe"
                value={editReview?.reviewer_name || ""}
                onChange={(e) => setEditReview((r) => (r ? { ...r, reviewer_name: e.target.value } : r))}
              />
            </FormField>
            <FormField label="Title">
              <Input
                placeholder="Great whisky!"
                value={editReview?.title || ""}
                onChange={(e) => setEditReview((r) => (r ? { ...r, title: e.target.value } : r))}
              />
            </FormField>
            <FormField label="Content">
              <Textarea
                placeholder="Write your review..."
                value={editReview?.content || ""}
                onChange={(e) => setEditReview((r) => (r ? { ...r, content: e.target.value } : r))}
                rows={3}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Overall Rating (1-5)">
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={editReview?.rating || 4}
                  onChange={(e) => setEditReview((r) => (r ? { ...r, rating: Number(e.target.value) } : r))}
                />
              </FormField>
              <FormField label="Taste Rating (1-5)">
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={editReview?.taste_rating || 4}
                  onChange={(e) => setEditReview((r) => (r ? { ...r, taste_rating: Number(e.target.value) } : r))}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Value Rating (1-5)">
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={editReview?.value_rating || 4}
                  onChange={(e) => setEditReview((r) => (r ? { ...r, value_rating: Number(e.target.value) } : r))}
                />
              </FormField>
              <FormField label="Rebuy Rating (1-5)">
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={editReview?.rebuy_rating || 4}
                  onChange={(e) => setEditReview((r) => (r ? { ...r, rebuy_rating: Number(e.target.value) } : r))}
                />
              </FormField>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editReview?.is_approved || false}
                  onCheckedChange={(v) => setEditReview((r) => (r ? { ...r, is_approved: v } : r))}
                />
                <span className="text-sm">Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editReview?.is_featured || false}
                  onCheckedChange={(v) => setEditReview((r) => (r ? { ...r, is_featured: v } : r))}
                />
                <span className="text-sm">Featured</span>
              </div>
            </div>
            <Button className="w-full" onClick={saveReview}>
              Save Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;