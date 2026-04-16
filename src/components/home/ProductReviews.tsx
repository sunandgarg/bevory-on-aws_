import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Star, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProductReview {
  id: string;
  product_id: string | null;
  title: string | null;
  content: string | null;
  rating: number | null;
  youtube_url: string | null;
  thumbnail_url: string | null;
  is_featured: boolean;
  product?: {
    name: string;
    brand: string;
    image_emoji: string | null;
  };
}

const ProductReviews = () => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          *,
          product:products(name, brand, image_emoji)
        `)
        .eq("is_featured", true)
        .eq("is_approved", true)
        .not("youtube_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setReviews(data);
      }
      setLoading(false);
    };
    fetchReviews();
  }, []);

  const getYouTubeEmbedUrl = (url: string) => {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/shorts\/|youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
      }
    }
    return null;
  };

  const getYouTubeThumbnail = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/shorts\/|youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="px-4">
        <Skeleton className="h-5 w-40 mb-3" />
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-32 h-56 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <>
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Spiritz Reviews</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scroll-smooth">
          {reviews.map((review, index) => {
            const thumbnail = review.thumbnail_url || 
              (review.youtube_url ? getYouTubeThumbnail(review.youtube_url) : null);
            
            return (
              <motion.button
                key={review.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => review.youtube_url && setSelectedVideo(review.youtube_url)}
                className="w-32 flex-shrink-0 text-left group"
              >
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-secondary">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={review.title || "Review"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {review.product?.image_emoji || "🥃"}
                    </div>
                  )}
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-5 h-5 text-foreground fill-foreground ml-0.5" />
                    </div>
                  </div>
                  
                  {/* Rating badge */}
                  {review.rating && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-accent text-accent" />
                      <span className="text-white text-xs">{review.rating}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium mt-1.5 line-clamp-2">
                  {review.title || review.product?.name || "Review"}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-black border-0">
          {selectedVideo && getYouTubeEmbedUrl(selectedVideo) && (
            <div className="relative aspect-[9/16] max-h-[80vh]">
              <iframe
                src={getYouTubeEmbedUrl(selectedVideo)!}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductReviews;
