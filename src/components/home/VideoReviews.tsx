import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Star, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface VideoReview {
  id: string;
  title: string;
  youtube_url: string;
  thumbnail_url: string | null;
  reviewer_name: string | null;
  product_id: string | null;
  order_index: number;
  is_active: boolean;
}

// Extract YouTube video ID from various URL formats
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

// Generate thumbnail from YouTube ID
const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string => {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault', 
    high: 'hqdefault',
    maxres: 'maxresdefault'
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
};

const VideoReviews = () => {
  const [reviews, setReviews] = useState<VideoReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from("video_reviews")
        .select("*")
        .eq("is_active", true)
        .order("order_index");
      
      if (!error && data) {
        setReviews(data as VideoReview[]);
      }
      setLoading(false);
    };
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <section className="px-4 py-8">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[9/16] rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <section className="px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-accent fill-accent" />
          <h2 className="font-semibold">Product Reviews</h2>
        </div>
        <Link to="/reviews" className="text-sm text-accent flex items-center gap-1">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {reviews.slice(0, 5).map((review, index) => {
          const videoId = getYouTubeId(review.youtube_url);
          const thumbnail = review.thumbnail_url || (videoId ? getYouTubeThumbnail(videoId) : null);
          
          return (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative aspect-[9/16] rounded-xl overflow-hidden bg-muted group cursor-pointer"
              onClick={() => setActiveVideo(review.id)}
            >
              {/* Thumbnail */}
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={review.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                  <Play className="w-10 h-10 text-muted-foreground" />
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-6 h-6 text-black ml-1" fill="black" />
                </div>
              </div>

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-medium line-clamp-2">
                  {review.title}
                </p>
                {review.reviewer_name && (
                  <p className="text-white/70 text-xs mt-1">
                    by {review.reviewer_name}
                  </p>
                )}
              </div>

              {/* YouTube Shorts badge */}
              {review.youtube_url.includes('/shorts/') && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">
                  SHORTS
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setActiveVideo(null)}
          >
            <X className="w-8 h-8" />
          </button>
          
          <div 
            className="w-full max-w-md aspect-[9/16] bg-black rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const review = reviews.find(r => r.id === activeVideo);
              const videoId = review ? getYouTubeId(review.youtube_url) : null;
              
              if (!videoId) return <p className="text-white text-center p-4">Invalid video URL</p>;
              
              return (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
};

export default VideoReviews;
