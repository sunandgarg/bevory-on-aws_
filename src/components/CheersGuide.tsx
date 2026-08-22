import { useState, useCallback, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/integrations/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { X, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { isValidExternalUrl, openExternalUrl } from "@/lib/urlValidation";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

interface StoryMedia {
  type: "image" | "video";
  url: string;
  duration?: number;
}

interface CheersGuideItem {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  emoji: string | null;
  link_url: string | null;
  link_type: string | null;
  order_index: number;
  is_active: boolean;
  stories: StoryMedia[] | null;
}

interface CheersGuideProps {
  className?: string;
}

const fetchGuides = async (): Promise<CheersGuideItem[]> => {
  const { data, error } = await apiClient
    .from("cheers_guides")
    .select("*")
    .eq("is_active", true)
    .order("order_index");
  if (error) throw error;
  return (data || []).map((g) => ({
    ...g,
    stories: Array.isArray(g.stories) ? (g.stories as unknown as StoryMedia[]) : null,
  }));
};

const CheersGuide = memo(({ className = "" }: CheersGuideProps) => {
  const [selectedGuideIndex, setSelectedGuideIndex] = useState<number | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["cheers-guides"],
    queryFn: fetchGuides,
    staleTime: 10 * 60 * 1000,
  });

  const selectedGuide = selectedGuideIndex !== null ? guides[selectedGuideIndex] : null;
  const stories = selectedGuide?.stories || [];
  const currentStory = stories[currentStoryIndex];
  const storyDuration = (currentStory?.duration || 5) * 1000;

  // Progress timer
  useEffect(() => {
    if (selectedGuideIndex === null || stories.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex((i) => i + 1);
            return 0;
          } else if (selectedGuideIndex < guides.length - 1) {
            setSelectedGuideIndex((i) => (i !== null ? i + 1 : null));
            setCurrentStoryIndex(0);
            return 0;
          } else {
            setSelectedGuideIndex(null);
            setCurrentStoryIndex(0);
            return 0;
          }
        }
        return prev + 100 / (storyDuration / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [selectedGuideIndex, currentStoryIndex, stories.length, storyDuration, isPaused, guides.length]);

  const handleClick = useCallback((index: number) => {
    const guide = guides[index];
    
    if (guide.stories && guide.stories.length > 0) {
      setSelectedGuideIndex(index);
      setCurrentStoryIndex(0);
      setProgress(0);
      setIsPaused(false);
      return;
    }

    if (guide.link_url) {
      if (guide.link_type === "external") {
        if (!isValidExternalUrl(guide.link_url)) {
          toast({
            title: "Invalid Link",
            description: "This external link is not from a trusted source",
            variant: "destructive",
          });
          return;
        }
        openExternalUrl(guide.link_url);
      } else if (guide.link_type === "section") {
        const element = document.getElementById(guide.link_url.replace("#", ""));
        element?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate(guide.link_url);
      }
    }
  }, [guides, navigate, toast]);

  const closeStoryViewer = useCallback(() => {
    setSelectedGuideIndex(null);
    setCurrentStoryIndex(0);
    setProgress(0);
  }, []);

  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((i) => i - 1);
      setProgress(0);
    } else if (selectedGuideIndex !== null && selectedGuideIndex > 0) {
      setSelectedGuideIndex((i) => (i !== null ? i - 1 : null));
      const prevGuide = guides[selectedGuideIndex - 1];
      setCurrentStoryIndex((prevGuide.stories?.length || 1) - 1);
      setProgress(0);
    }
  }, [currentStoryIndex, selectedGuideIndex, guides]);

  const goToNextStory = useCallback(() => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((i) => i + 1);
      setProgress(0);
    } else if (selectedGuideIndex !== null && selectedGuideIndex < guides.length - 1) {
      setSelectedGuideIndex((i) => (i !== null ? i + 1 : null));
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      closeStoryViewer();
    }
  }, [currentStoryIndex, stories.length, selectedGuideIndex, guides.length, closeStoryViewer]);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center flex-shrink-0">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-12 h-3 mt-2 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (guides.length === 0) return null;

  return (
    <>
      <div className={className}>
        <div className="flex gap-3 overflow-x-auto px-4 scrollbar-hide snap-x snap-mandatory scroll-smooth">
          {guides.map((guide, index) => (
            <button
              key={guide.id}
              onClick={() => handleClick(index)}
              className="flex flex-col items-center flex-shrink-0 group"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-orange-500 to-red-500">
                  <div className="w-full h-full rounded-full p-[2px] bg-background">
                    <div className="w-full h-full rounded-full bg-secondary overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      {guide.image_url ? (
                        <img
                          src={guide.image_url}
                          alt={guide.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xl">{guide.emoji || "🥂"}</span>
                      )}
                    </div>
                  </div>
                </div>
                {guide.stories && guide.stories.length > 1 && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                    {guide.stories.length}
                  </div>
                )}
              </div>
              <p className="text-[10px] mt-1.5 text-center font-medium text-muted-foreground group-hover:text-foreground transition-colors w-16 truncate">
                {guide.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {selectedGuideIndex !== null && selectedGuide && stories.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              const x = e.clientX - rect.left;
              const width = rect.width;
              if (x < width / 3) goToPrevStory();
              else if (x > (width * 2) / 3) goToNextStory();
            }}
          >
            {/* Progress bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {stories.map((_, idx) => (
                <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-100"
                    style={{
                      width:
                        idx < currentStoryIndex
                          ? "100%"
                          : idx === currentStoryIndex
                          ? `${progress}%`
                          : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden">
                  {selectedGuide.image_url ? (
                    <img src={selectedGuide.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm flex items-center justify-center h-full">{selectedGuide.emoji}</span>
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{selectedGuide.title}</p>
                  {selectedGuide.subtitle && (
                    <p className="text-white/60 text-xs">{selectedGuide.subtitle}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
                  className="p-2 text-white/80 hover:text-white"
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); closeStoryViewer(); }}
                  className="p-2 text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Story Content */}
            <div className="w-full h-full flex items-center justify-center">
              {currentStory?.type === "video" ? (
                (() => {
                  const url = currentStory.url;
                  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^&\n?#]+)/);
                  if (ytMatch) {
                    const videoId = ytMatch[1];
                    return (
                      <iframe
                        key={currentStory.url}
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&loop=1&playlist=${videoId}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                  return (
                    <video
                      key={currentStory.url}
                      src={url}
                      autoPlay
                      muted
                      playsInline
                      className="max-w-full max-h-full object-contain"
                      onEnded={goToNextStory}
                    />
                  );
                })()
              ) : (
                <img
                  key={currentStory?.url}
                  src={currentStory?.url}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Navigation arrows */}
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevStory(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNextStory(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Link button */}
            {selectedGuide.link_url && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedGuide.link_type === "external") {
                    if (!isValidExternalUrl(selectedGuide.link_url!)) {
                      toast({ title: "Invalid Link", description: "This external link is not from a trusted source", variant: "destructive" });
                      return;
                    }
                    openExternalUrl(selectedGuide.link_url!);
                  } else {
                    closeStoryViewer();
                    navigate(selectedGuide.link_url!);
                  }
                }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-white text-black rounded-full font-medium text-sm hover:bg-white/90 transition-colors"
              >
                View More
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

CheersGuide.displayName = "CheersGuide";
export default CheersGuide;
