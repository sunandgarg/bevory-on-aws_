import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  cover_emoji: string | null;
  category: string | null;
  author: string | null;
  youtube_url: string | null;
  published_at: string | null;
  is_featured: boolean | null;
}

const getYouTubeEmbedUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com") && urlObj.pathname.includes("shorts")) {
      const videoId = urlObj.pathname.split("/shorts/")[1];
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (urlObj.hostname.includes("youtube.com")) {
      const videoId = urlObj.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (urlObj.hostname.includes("youtu.be")) {
      const videoId = urlObj.pathname.slice(1);
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
  } catch {
    return null;
  }
  return null;
};

const SpiritzGuide = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["spiritz-guide"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spiritz_magazine")
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Article[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <Skeleton className="h-5 w-32 mb-3" />
              <Skeleton className="h-10 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  const handleArticleClick = (article: Article) => {
    if (article.youtube_url) {
      setSelectedVideo(article.youtube_url);
    } else {
      setSelectedArticle(article);
    }
  };

  return (
    <>
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-accent" />
                <span className="text-sm font-semibold text-accent uppercase tracking-wider">
                  BevOry Guide
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                Learn & Discover
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollPrev}
                className="rounded-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollNext}
                className="rounded-full"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="gap-2 hidden sm:flex">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Articles Carousel */}
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {articles.map((article, index) => (
                <CarouselItem
                  key={article.id}
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    onClick={() => handleArticleClick(article)}
                    className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-accent/30 transition-all cursor-pointer hover-lift h-full"
                  >
                    {/* Image Area */}
                    <div className="relative h-48 bg-muted/50 overflow-hidden">
                      {article.cover_url ? (
                        <img
                          src={article.cover_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5">
                          <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
                            {article.cover_emoji || "📖"}
                          </span>
                        </div>
                      )}
                      {article.youtube_url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-6 h-6 text-foreground fill-foreground ml-0.5" />
                          </div>
                        </div>
                      )}
                      {article.is_featured && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-accent text-xs">⭐ Featured</Badge>
                        </div>
                      )}
                      {article.category && (
                        <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-card/90 backdrop-blur-sm text-xs">
                          {article.category}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {article.excerpt}
                          </p>
                        )}
                      </div>

                      {article.author && (
                        <div className="flex items-center pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            By {article.author}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.ceil(articles.length / 3) }).map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index * 3)}
                className={`w-2 h-2 rounded-full transition-all ${
                  Math.floor(current / 3) === index
                    ? "bg-accent w-6"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Article Detail Sheet */}
      <Sheet open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <ScrollArea className="h-full pr-4">
            <SheetHeader className="text-left pb-4">
              {selectedArticle?.cover_url ? (
                <div className="aspect-video rounded-xl overflow-hidden mb-4">
                  <img
                    src={selectedArticle.cover_url}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="text-6xl mb-3">{selectedArticle?.cover_emoji || "📖"}</div>
              )}
              <div className="flex items-center gap-2 mb-2">
                {selectedArticle?.category && (
                  <Badge variant="secondary">{selectedArticle.category}</Badge>
                )}
                {selectedArticle?.is_featured && (
                  <Badge className="bg-accent">⭐ Featured</Badge>
                )}
              </div>
              <SheetTitle className="text-2xl font-serif">{selectedArticle?.title}</SheetTitle>
              {selectedArticle?.author && (
                <p className="text-sm text-muted-foreground">By {selectedArticle.author}</p>
              )}
            </SheetHeader>

            {selectedArticle?.excerpt && (
              <p className="text-muted-foreground mb-4 font-medium">{selectedArticle.excerpt}</p>
            )}

            {selectedArticle?.content && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedArticle.content}
                </p>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-black border-0">
          {selectedVideo && getYouTubeEmbedUrl(selectedVideo) && (
            <div className="relative aspect-video">
              <iframe
                src={getYouTubeEmbedUrl(selectedVideo)!}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SpiritzGuide;
