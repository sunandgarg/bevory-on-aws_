import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Calendar, User, ChevronRight, X, Clock, TrendingUp, Star, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import MobileLayout from "@/components/layout/MobileLayout";
import { apiClient } from "@/integrations/api/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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

const CATEGORY_FILTERS = ["All", "Whiskey", "Rum", "Vodka", "Gin", "Wine", "Beer", "Cocktails", "Guides", "News"];

const Guide = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["guide-posts"],
    queryFn: async () => {
      const { data, error } = await apiClient
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.filter((p) => p.is_featured);
  const regularPosts = filteredPosts.filter((p) => !p.is_featured);

  // Calculate read time
  const getReadTime = (content: string | null) => {
    if (!content) return 3;
    return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
  };

  return (
    <>
      <SEOHead
        title="Bevory Guide - Expert Spirits & Cocktails Knowledge"
        description="Discover expert insights on whiskey, rum, vodka, gin, wine, beer, and cocktails. Learn about tasting notes, pairing ideas, and drinking culture."
        keywords="spirits guide, cocktail recipes, whiskey guide, rum guide, vodka guide, wine tips, beer guide"
      />
      <MobileLayout showSearch={false} showCheersGuide={false}>
        {/* Hero Header */}
        <header className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-background to-background" />
          
          <div className="relative px-4 pt-6 pb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-3">
                <Sparkles className="w-4 h-4" />
                <span>Expert Knowledge Hub</span>
              </div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                Bevory Guide
              </h1>
              <p className="text-muted-foreground">
                Master the art of spirits, cocktails & drinking culture
              </p>
            </motion.div>

            {/* Search with Glass Effect */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-accent/10 rounded-2xl blur-xl" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search articles, topics, recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-10 h-12 bg-card/80 backdrop-blur-sm border-border/50 rounded-2xl text-base shadow-lg"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-muted hover:bg-muted/80"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Category Pills */}
          <nav className="px-4 pb-4" aria-label="Article categories">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
            >
              {CATEGORY_FILTERS.map((category, index) => (
                <motion.button
                  key={category}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25 scale-105"
                      : "bg-secondary/80 text-foreground hover:bg-secondary hover:scale-102"
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </motion.div>
          </nav>
        </header>

        <main className="px-4 pb-8">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-secondary/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Featured Articles - Hero Cards */}
              {featuredPosts.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-accent fill-accent" />
                    <h2 className="text-lg font-bold">Featured Stories</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {featuredPosts.map((post, index) => (
                      <FeaturedArticleCard key={post.id} post={post} index={index} getReadTime={getReadTime} />
                    ))}
                  </div>
                </section>
              )}

              {/* Trending Section */}
              {regularPosts.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    <h2 className="text-lg font-bold">Latest Articles</h2>
                  </div>
                  
                  {/* Grid Layout for larger screens, List for mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {regularPosts.map((post, index) => (
                      <ArticleCard key={post.id} post={post} index={index} getReadTime={getReadTime} />
                    ))}
                  </div>
                </section>
              )}

              {filteredPosts.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-1">No articles found</p>
                  <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
                </motion.div>
              )}
            </>
          )}
        </main>
      </MobileLayout>
    </>
  );
};

// Featured Article Card - Large Hero Style
const FeaturedArticleCard = ({
  post,
  index,
  getReadTime,
}: {
  post: BlogPost;
  index: number;
  getReadTime: (content: string | null) => number;
}) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="group relative rounded-3xl overflow-hidden cursor-pointer"
  >
    <Link to={`/guide/${post.slug}`}>
      {/* Background Image or Gradient */}
      <div className="relative h-64 sm:h-72">
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/30 via-accent/10 to-secondary flex items-center justify-center">
            <span className="text-8xl">{post.cover_emoji || "📰"}</span>
          </div>
        )}
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <div className="flex flex-wrap gap-2 mb-3">
            {post.category && (
              <Badge className="bg-accent/90 text-accent-foreground backdrop-blur-sm">
                {post.category}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-0">
              <Star className="w-3 h-3 mr-1 fill-current" /> Featured
            </Badge>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2 line-clamp-2 group-hover:text-accent transition-colors">
            {post.title}
          </h3>
          
          <p className="text-white/80 text-sm line-clamp-2 mb-3">
            {post.excerpt}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-white/70">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {post.author || "Bevory Team"}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {getReadTime(post.content)} min read
            </span>
            {post.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(post.published_at), "MMM d, yyyy")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  </motion.article>
);

// Regular Article Card
const ArticleCard = ({
  post,
  index,
  getReadTime,
}: {
  post: BlogPost;
  index: number;
  getReadTime: (content: string | null) => number;
}) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="group rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 cursor-pointer"
  >
    <Link to={`/guide/${post.slug}`}>
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <span className="text-5xl">{post.cover_emoji || "📰"}</span>
          </div>
        )}
        
        {/* Category Badge */}
        {post.category && (
          <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground">
            {post.category}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {post.excerpt}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getReadTime(post.content)} min
            </span>
            {post.published_at && (
              <span>{format(new Date(post.published_at), "MMM d")}</span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  </motion.article>
);

export default Guide;
