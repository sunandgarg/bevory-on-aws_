import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Play, User, Youtube, Instagram, Globe, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";

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
}

interface VideoReview {
  id: string;
  title: string;
  slug: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  category?: {
    name: string;
    emoji: string | null;
  } | null;
}

const CreatorProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [creator, setCreator] = useState<VideoCreator | null>(null);
  const [videos, setVideos] = useState<VideoReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Try to find by slug first, then by ID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || "");
      
      let creatorQuery = apiClient
        .from("video_creators")
        .select("*")
        .eq("is_active", true);

      if (isUuid) {
        creatorQuery = creatorQuery.eq("id", slug);
      } else {
        creatorQuery = creatorQuery.eq("slug", slug);
      }

      const { data: creatorData } = await creatorQuery.single();

      if (creatorData) {
        setCreator(creatorData as VideoCreator);

        // Fetch creator's videos
        const { data: videosData } = await apiClient
          .from("video_reviews")
          .select(`
            id, title, slug, youtube_url, thumbnail_url,
            category:video_categories(name, emoji)
          `)
          .eq("creator_id", creatorData.id)
          .eq("is_active", true)
          .order("order_index");

        if (videosData) setVideos(videosData as VideoReview[]);
      }
      setLoading(false);
    };

    if (slug) fetchData();
  }, [slug]);

  const getYouTubeThumbnail = (url: string): string => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/shorts\/))([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";
  };

  if (loading) {
    return (
      <MobileLayout showBack>
        <div className="p-4">
          <div className="flex flex-col items-center py-8">
            <div className="w-24 h-24 rounded-full bg-muted animate-pulse mb-4" />
            <div className="h-6 w-32 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!creator) {
    return (
      <MobileLayout showBack>
        <div className="p-4 text-center py-12">
          <div className="text-5xl mb-4">👤</div>
          <h3 className="font-semibold">Creator not found</h3>
          <Link to="/masterclass" className="text-accent mt-2 inline-block">
            Browse all videos
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBack title={creator.name}>
      <div className="pb-8">
        {/* Creator Header */}
        <div className="relative">
          {/* Background gradient */}
          <div className="h-32 bg-gradient-to-br from-accent/30 via-accent/10 to-transparent" />
          
          {/* Profile content */}
          <div className="px-4 -mt-16">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-card border-4 border-background flex items-center justify-center overflow-hidden">
                {creator.avatar_url ? (
                  <img
                    src={creator.avatar_url}
                    alt={creator.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <h1 className="text-2xl font-bold mt-4">{creator.name}</h1>
              {creator.bio && (
                <p className="text-muted-foreground mt-2 max-w-sm">{creator.bio}</p>
              )}

              {/* Social Links */}
              <div className="flex items-center gap-3 mt-4">
                {creator.youtube_url && (
                  <a
                    href={creator.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  >
                    <Youtube className="w-5 h-5" />
                    <span className="text-sm font-medium">YouTube</span>
                  </a>
                )}
                {creator.instagram_url && (
                  <a
                    href={creator.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                    <span className="text-sm font-medium">Instagram</span>
                  </a>
                )}
                {creator.twitter_url && (
                  <a
                    href={creator.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 hover:bg-blue-500/20 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {creator.website_url && (
                  <a
                    href={creator.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Videos Section */}
        <div className="p-4 mt-6">
          <h2 className="text-lg font-semibold mb-4">
            Videos ({videos.length})
          </h2>

          {videos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No videos yet
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {videos.map((video, index) => {
                const thumbnail = video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);
                return (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/masterclass/${video.slug || video.id}`} className="group">
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
                        {video.category && (
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-1 rounded-full bg-black/60 text-white text-xs">
                              {video.category.emoji} {video.category.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <h3 className="mt-2 font-medium text-sm line-clamp-2">{video.title}</h3>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default CreatorProfile;
