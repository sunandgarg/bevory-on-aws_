import { useState, memo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/integrations/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  cover_emoji: string | null;
  author: string | null;
  category: string | null;
  published_at: string | null;
  is_featured: boolean | null;
}

const BevoryGuide = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["bevory-guide-posts"],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, cover_emoji, author, category, published_at, is_featured")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  if (isLoading) {
    return (
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-48 h-36 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent" />
          <h2 className="font-semibold">Bevory Guide</h2>
        </div>
        <Link to="/guide" className="text-sm text-accent">
          See all
        </Link>
      </div>

      {/* Mobile-optimized horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
        {posts.map((post, index) => (
          <Link 
            key={post.id} 
            to={`/guide/${post.slug}`}
            className="flex-shrink-0 snap-start"
          >
            <motion.article
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="w-48 bg-card rounded-xl border border-border overflow-hidden hover:border-accent/50 transition-colors"
            >
              {/* Image */}
              <div className="h-24 bg-muted/50 flex items-center justify-center relative">
                {post.cover_image_url ? (
                  <OptimizedImage
                    src={post.cover_image_url}
                    alt={post.title}
                    width={192}
                    height={96}
                    className="w-full h-full"
                    objectFit="cover"
                    placeholder="blur"
                  />
                ) : (
                  <span className="text-4xl">{post.cover_emoji || "📰"}</span>
                )}
                {post.is_featured && (
                  <span className="absolute top-1 left-1 text-sm">⭐</span>
                )}
                {post.category && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] bg-card/90 backdrop-blur-sm">
                    {post.category}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-2">
                <p className="font-medium text-sm line-clamp-2 leading-tight">{post.title}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {post.author || "Bevory"}
                  </span>
                  {post.published_at && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(post.published_at), "MMM d")}
                    </span>
                  )}
                </div>
              </div>
            </motion.article>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default memo(BevoryGuide);
