-- Create video_reviews table for YouTube shorts/videos on homepage
CREATE TABLE public.video_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  reviewer_name TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_reviews ENABLE ROW LEVEL SECURITY;

-- Public read access (for homepage display)
CREATE POLICY "Video reviews are viewable by everyone"
ON public.video_reviews
FOR SELECT
USING (true);

-- Admin-only write access
CREATE POLICY "Admins can manage video reviews"
ON public.video_reviews
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_video_reviews_updated_at
BEFORE UPDATE ON public.video_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();