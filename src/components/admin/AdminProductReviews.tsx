import { useState, useEffect, useRef } from "react";
import { Star, Trash2, Check, X, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Review {
  id: string;
  product_id: string | null;
  rating: number | null;
  content: string | null;
  reviewer_name: string | null;
  is_approved: boolean | null;
  created_at: string;
  product?: { name: string; brand: string } | null;
}

interface AdminProductReviewsProps {
  productId?: string;
}

const AdminProductReviews = ({ productId }: AdminProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchReviews = async () => {
    let query = apiClient
      .from("product_reviews")
      .select("*, product:products(name, brand)")
      .order("created_at", { ascending: false });

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data } = await query;
    if (data) setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const toggleApproval = async (id: string, currentStatus: boolean | null) => {
    const { error } = await apiClient
      .from("product_reviews")
      .update({ is_approved: !currentStatus })
      .eq("id", id);

    if (!error) {
      toast({ title: currentStatus ? "Review unapproved" : "Review approved" });
      fetchReviews();
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const { error } = await apiClient.from("product_reviews").delete().eq("id", id);
    if (!error) {
      toast({ title: "Review deleted" });
      fetchReviews();
    }
  };

  const exportToCsv = () => {
    const headers = ["id", "product_id", "rating", "reviewer_name", "content", "is_approved", "created_at"];
    const rows = reviews.map(r => [
      r.id, r.product_id || "", r.rating || "", r.reviewer_name || "", 
      `"${(r.content || "").replace(/"/g, '""')}"`, r.is_approved ? "true" : "false", r.created_at
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_reviews.csv";
    a.click();
  };

  const importFromCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n").slice(1);
    
    for (const line of lines) {
      if (!line.trim()) continue;
      const [id, product_id, rating, reviewer_name, content, is_approved] = line.split(",");
      
      const reviewData = {
        product_id: product_id || null,
        rating: rating ? parseInt(rating) : null,
        reviewer_name: reviewer_name?.replace(/"/g, "") || null,
        content: content?.replace(/"/g, "") || null,
        is_approved: is_approved === "true",
      };

      if (id && id !== "id") {
        await apiClient.from("product_reviews").update(reviewData).eq("id", id);
      } else {
        await apiClient.from("product_reviews").insert([reviewData]);
      }
    }
    
    toast({ title: "Reviews imported!" });
    fetchReviews();
  };

  if (loading) return <div className="text-center py-4">Loading reviews...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Reviews ({reviews.length})</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportToCsv}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" /> Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importFromCsv(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {reviews.map((review) => (
          <div key={review.id} className="p-3 rounded-lg bg-card border border-border">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{review.reviewer_name || "Anonymous"}</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-accent text-accent" />
                    <span className="text-xs">{review.rating}/5</span>
                  </div>
                  <Badge className={review.is_approved ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}>
                    {review.is_approved ? "Approved" : "Pending"}
                  </Badge>
                </div>
                {review.product && (
                  <p className="text-xs text-muted-foreground mb-1">
                    {review.product.brand} {review.product.name}
                  </p>
                )}
                {review.content && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{review.content}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => toggleApproval(review.id, review.is_approved)}
                >
                  {review.is_approved ? <X className="w-4 h-4" /> : <Check className="w-4 h-4 text-green-600" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteReview(review.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No reviews yet</p>
        )}
      </div>
    </div>
  );
};

export default AdminProductReviews;
