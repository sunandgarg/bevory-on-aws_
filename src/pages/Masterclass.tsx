import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Play, User, Search } from "lucide-react";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import { apiClient } from "@/integrations/api/client";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface VideoReview {
  id: string;
  title: string;
  slug: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  reviewer_name: string | null;
  is_active: boolean;
  category_id: string | null;
  creator_id: string | null;
  creator?: {
    id: string;
    name: string;
    slug: string | null;
    avatar_url: string | null;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string | null;
    emoji: string | null;
  } | null;
}

interface VideoCategory {
  id: string;
  name: string;
  slug: string | null;
  emoji: string | null;
}

const getYouTubeThumbnail = (url: string): string => {
  const videoId = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/))([^"&?\/\s]{11})/)?.[1];
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";
};

const Masterclass = () => {
  const [videos, setVideos] = useState<VideoReview[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [videosRes, categoriesRes] = await Promise.all([
        apiClient
          .from("video_reviews")
          .select(`
            *,
            creator:video_creators(id, name, slug, avatar_url),
            category:video_categories(id, name, slug, emoji)
          `)
          .eq("is_active", true)
          .order("order_index"),
        apiClient
          .from("video_categories")
          .select("*")
          .eq("is_active", true)
          .order("order_index"),
      ]);

      if (videosRes.data) setVideos(videosRes.data as VideoReview[]);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredVideos = useMemo(() => {
    let result = videos;

    if (selectedCategory) {
      result = result.filter((v) => v.category_id === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.creator?.name.toLowerCase().includes(query) ||
          v.category?.name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [videos, selectedCategory, searchQuery]);

  // Group videos by category for display
  const videosByCategory = useMemo(() => {
    if (selectedCategory) return null;

    const grouped: Record<string, { category: VideoCategory; videos: VideoReview[] }> = {};

    videos.forEach((video) => {
      if (video.category) {
        if (!grouped[video.category.id]) {
          grouped[video.category.id] = { category: video.category, videos: [] };
        }
        grouped[video.category.id].videos.push(video);
      }
    });

    return Object.values(grouped).filter((g) => g.videos.length > 0);
  }, [videos, selectedCategory]);

  if (loading) {
    return (
      <MobileLayout title="MasterClass">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-video bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="MasterClass">
      <div className="p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search videos, creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl"
          />
        </div>

        {/* Categories */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                !selectedCategory
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-foreground"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Videos */}
        {selectedCategory || searchQuery ? (
          // Filtered view - simple grid
          <div className="grid grid-cols-2 gap-3">
            {filteredVideos.map((video, index) => (
              <VideoCard key={video.id} video={video} index={index} />
            ))}
            {filteredVideos.length === 0 && (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                No videos found
              </div>
            )}
          </div>
        ) : (
          // Grouped by category
          videosByCategory?.map((group) => (
            <div key={group.category.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {group.category.emoji} {group.category.name}
                </h2>
                <button
                  onClick={() => setSelectedCategory(group.category.id)}
                  className="text-sm text-accent font-medium"
                >
                  View All
                </button>
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-3 pb-2">
                  {group.videos.slice(0, 6).map((video, index) => (
                    <div key={video.id} className="w-[200px] flex-shrink-0">
                      <VideoCard video={video} index={index} />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          ))
        )}
      </div>
    </MobileLayout>
  );
};

const VideoCard = ({ video, index }: { video: VideoReview; index: number }) => {
  const thumbnail = video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/masterclass/${video.slug || video.id}`}>
        <div className="group">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-accent/90 flex items-center justify-center">
                <Play className="w-6 h-6 text-accent-foreground fill-current" />
              </div>
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
            {video.creator && (
              <Link
                to={`/creator/${video.creator.slug || video.creator.id}`}
                className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground hover:text-accent"
                onClick={(e) => e.stopPropagation()}
              >
                {video.creator.avatar_url ? (
                  <img
                    src={video.creator.avatar_url}
                    alt={video.creator.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span>{video.creator.name}</span>
              </Link>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default Masterclass;
