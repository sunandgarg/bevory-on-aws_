import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Play, User, Youtube, Share2, ChevronLeft } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VideoReview {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  reviewer_name: string | null;
  duration: string | null;
  views_count: number;
  is_active: boolean;
  category_id: string | null;
  creator_id: string | null;
  product_id: string | null;
  creator?: {
    id: string;
    name: string;
    slug: string | null;
    avatar_url: string | null;
    bio: string | null;
    youtube_url: string | null;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string | null;
    emoji: string | null;
  } | null;
  product?: {
    id: string;
    name: string;
    brand: string;
    slug: string | null;
  } | null;
}

const getYouTubeEmbedUrl = (url: string): string => {
  const videoId = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/))([^"&?\/\s]{11})/)?.[1];
  // Using youtube-nocookie.com for privacy mode and adding parameters to minimize ads/recommendations
  return videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`
    : "";
};

const VideoDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [video, setVideo] = useState<VideoReview | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<VideoReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVideo = async () => {
      // Try to find by slug first, then by ID
      let query = apiClient
        .from("video_reviews")
        .select(`
          *,
          creator:video_creators(id, name, slug, avatar_url, bio, youtube_url),
          category:video_categories(id, name, slug, emoji),
          product:products(id, name, brand, slug)
        `)
        .eq("is_active", true);

      // Check if slug looks like a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || "");
      
      if (isUuid) {
        query = query.eq("id", slug);
      } else {
        query = query.eq("slug", slug);
      }

      const { data } = await query.single();

      if (data) {
        setVideo(data as VideoReview);

        // Fetch related videos from same category or creator
        const { data: related } = await apiClient
          .from("video_reviews")
          .select(`
            *,
            creator:video_creators(id, name, slug, avatar_url)
          `)
          .eq("is_active", true)
          .neq("id", data.id)
          .or(`category_id.eq.${data.category_id},creator_id.eq.${data.creator_id}`)
          .limit(6);

        if (related) setRelatedVideos(related as any);
      }
      setLoading(false);
    };

    if (slug) fetchVideo();
  }, [slug]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: video?.title,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!" });
    }
  };

  if (loading) {
    return (
      <MobileLayout showBack>
        <div className="p-4">
          <div className="aspect-video bg-muted rounded-xl animate-pulse mb-4" />
          <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
        </div>
      </MobileLayout>
    );
  }

  if (!video) {
    return (
      <MobileLayout showBack>
        <div className="p-4 text-center py-12">
          <div className="text-5xl mb-4">🎬</div>
          <h3 className="font-semibold">Video not found</h3>
          <Link to="/masterclass" className="text-accent mt-2 inline-block">
            Browse all videos
          </Link>
        </div>
      </MobileLayout>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(video.youtube_url);
  const thumbnailUrl = video.thumbnail_url || 
    `https://img.youtube.com/vi/${video.youtube_url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/))([^"&?\/\s]{11})/)?.[1]}/maxresdefault.jpg`;

  return (
    <MobileLayout showBack title={video.category?.name || "MasterClass"}>
      <div className="pb-8">
        {/* Video Player */}
        <div className="relative aspect-video bg-black">
          {isPlaying ? (
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="relative w-full h-full">
              <img
                src={thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
              >
                <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
                  <Play className="w-10 h-10 text-accent-foreground fill-current ml-1" />
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Title and Actions */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{video.title}</h1>
              {video.category && (
                <Link
                  to={`/masterclass?category=${video.category.id}`}
                  className="text-sm text-muted-foreground hover:text-accent"
                >
                  {video.category.emoji} {video.category.name}
                </Link>
              )}
            </div>
            <Button size="icon" variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Creator Card */}
          {video.creator && (
            <Link
              to={`/creator/${video.creator.slug || video.creator.id}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {video.creator.avatar_url ? (
                  <img
                    src={video.creator.avatar_url}
                    alt={video.creator.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{video.creator.name}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {video.creator.bio || "Creator"}
                </p>
              </div>
              {video.creator.youtube_url && (
                <Youtube className="w-5 h-5 text-red-500" />
              )}
            </Link>
          )}

          {/* Description */}
          {video.description && (
            <div>
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{video.description}</p>
            </div>
          )}

          {/* Linked Product */}
          {video.product && (
            <Link
              to={`/product/${video.product.slug || video.product.id}`}
              className="block p-3 rounded-xl border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors"
            >
              <p className="text-sm text-muted-foreground">Featured Product</p>
              <p className="font-medium">{video.product.brand} {video.product.name}</p>
            </Link>
          )}

          {/* Related Videos */}
          {relatedVideos.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold">More Videos</h2>
              <div className="grid grid-cols-2 gap-3">
                {relatedVideos.map((related) => (
                  <Link
                    key={related.id}
                    to={`/masterclass/${related.slug || related.id}`}
                    className="group"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={related.thumbnail_url || `https://img.youtube.com/vi/${related.youtube_url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/))([^"&?\/\s]{11})/)?.[1]}/hqdefault.jpg`}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <p className="mt-1 text-sm font-medium line-clamp-2">{related.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default VideoDetail;
