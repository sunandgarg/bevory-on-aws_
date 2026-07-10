import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RateProductSectionProps {
  productId: string;
  onReviewSubmitted?: () => void;
}

const RateProductSection = ({ productId, onReviewSubmitted }: RateProductSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedStar, setSelectedStar] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [tasteRating, setTasteRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [rebuyRating, setRebuyRating] = useState(0);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleStarClick = (star: number) => {
    setSelectedStar(star);
    setIsExpanded(true);
  };

  const renderStars = (rating: number, onSelect: (star: number) => void, size: "lg" | "sm" = "lg") => {
    const sizeClass = size === "lg" ? "w-8 h-8" : "w-5 h-5";
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onSelect(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`${sizeClass} ${
                star <= rating ? "fill-accent text-accent" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!reviewerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to submit a review.",
        variant: "destructive",
      });
      return;
    }

    if (reviewerName.trim().length < 2) {
      toast({
        title: "Invalid Name",
        description: "Name must be at least 2 characters.",
        variant: "destructive",
      });
      return;
    }

    if (selectedStar === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Prepare review data - directly approved for immediate posting
      const reviewData = {
        product_id: productId,
        rating: selectedStar,
        reviewer_name: reviewerName.trim(),
        content: reviewContent.trim() || null,
        taste_rating: tasteRating > 0 ? tasteRating : null,
        value_rating: valueRating > 0 ? valueRating : null,
        rebuy_rating: rebuyRating > 0 ? rebuyRating : null,
        is_approved: true, // Auto-approve reviews for immediate visibility
        is_featured: false,
        is_reported: false,
      };

      console.log("Submitting review:", reviewData);

      const { data, error } = await supabase
        .from("product_reviews")
        .insert(reviewData)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Review submitted successfully:", data);

      toast({
        title: "Review Submitted!",
        description: "Thank you for your review. It's now live!",
      });

      // Reset form
      setIsExpanded(false);
      setSelectedStar(0);
      setTasteRating(0);
      setValueRating(0);
      setRebuyRating(0);
      setReviewerName("");
      setReviewContent("");
      onReviewSubmitted?.();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Rate This Product</h3>
        </div>

        {/* Main Rating Stars */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => setHoverStar(star)}
                onMouseLeave={() => setHoverStar(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverStar || selectedStar)
                      ? "fill-accent text-accent"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {selectedStar > 0 ? `${selectedStar}/5` : "Tap to rate"}
          </span>
        </div>

        {/* Expanded Review Form */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-4 overflow-hidden"
            >
              {/* Detailed Ratings */}
              <div className="grid grid-cols-1 gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taste</span>
                  {renderStars(tasteRating, setTasteRating, "sm")}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Value for Money</span>
                  {renderStars(valueRating, setValueRating, "sm")}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Likelihood to Buy Again</span>
                  {renderStars(rebuyRating, setRebuyRating, "sm")}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="text-sm font-medium mb-1 block">Your Name *</label>
                <Input
                  placeholder="Enter your name"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                />
              </div>

              {/* Review Text */}
              <div>
                <label className="text-sm font-medium mb-1 block">Your Review (Optional)</label>
                <Textarea
                  placeholder="Share your experience with this product..."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                className="w-full gap-2"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Review
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RateProductSection;
