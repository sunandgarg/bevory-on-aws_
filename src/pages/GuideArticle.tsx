import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User, Clock, Share2, BookOpen, ChevronRight, Heart, Bookmark, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import MobileLayout from "@/components/layout/MobileLayout";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";

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
  published_at: string | null;
  is_featured: boolean | null;
  meta_title: string | null;
  meta_description: string | null;
}

const GuideArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ["guide-article", slug],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      return data as BlogPost | null;
    },
    enabled: !!slug,
  });

  // Fetch related posts
  const { data: relatedPosts = [] } = useQuery({
    queryKey: ["related-posts", post?.category],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("blog_posts")
        .select("id, title, slug, cover_image_url, cover_emoji, category")
        .eq("is_published", true)
        .eq("category", post?.category || "")
        .neq("id", post?.id || "")
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!post?.category,
  });

  // Calculate read time (approx 200 words per minute)
  const readTime = post?.content 
    ? Math.ceil(post.content.split(/\s+/).length / 200) 
    : 3;

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || "",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    }
  };

  if (isLoading) {
    return (
      <MobileLayout showSearch={false} showCheersGuide={false}>
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </MobileLayout>
    );
  }

  if (!post) {
    return (
      <MobileLayout showSearch={false} showCheersGuide={false}>
        <div className="px-4 py-12 text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Article not found</h1>
          <p className="text-muted-foreground mb-4">
            The article you're looking for doesn't exist.
          </p>
          <Link to="/guide">
            <Button>Back to Guide</Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  // Check if cover image is a valid URL
  const isValidImageUrl = post.cover_image_url && (
    post.cover_image_url.startsWith('http://') || 
    post.cover_image_url.startsWith('https://') || 
    post.cover_image_url.startsWith('/')
  );
  
  // Use valid image URL or default OG image
  const articleImage = isValidImageUrl 
    ? post.cover_image_url 
    : "https://bevory.in/og-image.png";

  // Generate structured data for SEO with all required fields
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt || post.meta_description || `Read ${post.title} on Bevory Guide.`,
    "image": [articleImage],
    "author": {
      "@type": "Person",
      "name": post.author || "Bevory Team",
      "url": "https://bevory.in/guide"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Bevory",
      "logo": {
        "@type": "ImageObject",
        "url": "https://bevory.in/favicon.png"
      }
    },
    "datePublished": post.published_at || new Date().toISOString(),
    "dateModified": post.published_at || new Date().toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://bevory.in/guide/${post.slug}`
    },
    "articleSection": post.category || "Guide",
    "keywords": post.tags?.join(", ") || post.category || "bevory, guide, drinks"
  };

  return (
    <>
      <SEOHead
        title={post.meta_title || `${post.title} | Bevory Guide`}
        description={post.meta_description || post.excerpt || ""}
        keywords={post.tags?.join(", ") || post.category || ""}
        ogImage={articleImage}
        ogType="article"
        author={post.author || "Bevory Team"}
        publishedTime={post.published_at || undefined}
        section={post.category || undefined}
        tags={post.tags || undefined}
        jsonLd={structuredData}
        canonical={`/guide/${post.slug}`}
      />
      <MobileLayout showSearch={false} showCheersGuide={false}>
        <article className="pb-8">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
            <div className="px-4 py-3 flex items-center justify-between">
              <Link to="/guide">
                <Button variant="ghost" size="sm" className="-ml-2">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLiked(!isLiked)}
                  className={isLiked ? "text-red-500" : ""}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSaved(!isSaved)}
                  className={isSaved ? "text-accent" : ""}
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleShare}>
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <header className="relative">
            {/* Cover Image */}
            {post.cover_image_url ? (
              <motion.figure
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative h-64 sm:h-80"
              >
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              </motion.figure>
            ) : (
              <div className="h-40 bg-gradient-to-br from-accent/20 to-secondary flex items-center justify-center">
                <span className="text-7xl">{post.cover_emoji || "📰"}</span>
              </div>
            )}

            {/* Title Section */}
            <div className="px-4 -mt-16 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-5 shadow-xl border border-border/50"
              >
                {/* Category & Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.category && (
                    <Badge className="bg-accent text-accent-foreground">
                      {post.category}
                    </Badge>
                  )}
                  {post.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Title - H1 for SEO */}
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground leading-tight mb-3">
                  {post.title}
                </h1>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-3 border-t border-border/50">
                  <span className="flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-accent" />
                    </div>
                    <span className="font-medium text-foreground">{post.author || "Bevory Team"}</span>
                  </span>
                  {post.published_at && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(post.published_at), "MMMM d, yyyy")}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {readTime} min read
                  </span>
                </div>
              </motion.div>
            </div>
          </header>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-4 mt-6"
          >
            <div 
              className="prose prose-lg max-w-none text-foreground
                prose-headings:font-serif prose-headings:text-foreground prose-headings:scroll-mt-20
                prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/50
                prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:my-4 prose-ul:pl-6 prose-li:text-muted-foreground prose-li:marker:text-accent
                prose-ol:my-4 prose-ol:pl-6
                prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:bg-secondary/30 prose-blockquote:py-2 prose-blockquote:rounded-r-lg
                prose-img:rounded-xl prose-img:my-6 prose-img:shadow-lg
                prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(post.content || "", {
                  ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u', 'blockquote', 'img', 'code', 'pre', 'br', 'hr', 'div', 'span'],
                  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'style', 'loading']
                })
              }}
            />
          </motion.div>

          {/* Engagement Bar */}
          <div className="px-4 mt-8">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLiked(!isLiked)}
                  className={`gap-2 ${isLiked ? "text-red-500" : ""}`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                  <span>Like</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Comment</span>
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </Button>
            </div>
          </div>

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <section className="px-4 mt-8">
              <h2 className="text-lg font-bold mb-4">Related Articles</h2>
              <div className="space-y-3">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.id}
                    to={`/guide/${related.slug}`}
                    className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 hover:border-accent/30 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                      {related.cover_image_url ? (
                        <img
                          src={related.cover_image_url}
                          alt={related.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl">{related.cover_emoji || "📰"}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{related.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{related.category}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Footer CTA */}
          <footer className="px-4 mt-8 pt-6 border-t border-border">
            <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-2xl p-5 text-center">
              <BookOpen className="w-10 h-10 text-accent mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Explore More Guides</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Discover expert insights on spirits, cocktails, and drinking culture
              </p>
              <Link to="/guide">
                <Button className="rounded-full">
                  Browse All Articles
                </Button>
              </Link>
            </div>
          </footer>
        </article>
      </MobileLayout>
    </>
  );
};

export default GuideArticle;
