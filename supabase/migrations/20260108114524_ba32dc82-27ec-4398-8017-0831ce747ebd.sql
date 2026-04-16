-- Create video_creators table for creator profiles
CREATE TABLE IF NOT EXISTS public.video_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    youtube_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create video_categories table
CREATE TABLE IF NOT EXISTS public.video_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    emoji TEXT DEFAULT '🎬',
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add creator_id and category_id columns to video_reviews
ALTER TABLE public.video_reviews 
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.video_creators(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.video_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration TEXT;

-- Enable RLS
ALTER TABLE public.video_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_categories ENABLE ROW LEVEL SECURITY;

-- Policies for video_creators
CREATE POLICY "Video creators are viewable by everyone"
ON public.video_creators
FOR SELECT
TO authenticated, anon
USING (is_active = true);

CREATE POLICY "Admins can manage video creators"
ON public.video_creators
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policies for video_categories
CREATE POLICY "Video categories are viewable by everyone"
ON public.video_categories
FOR SELECT
TO authenticated, anon
USING (is_active = true);

CREATE POLICY "Admins can manage video categories"
ON public.video_categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_video_creators_updated_at
    BEFORE UPDATE ON public.video_creators
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default video categories based on reference
INSERT INTO public.video_categories (name, slug, emoji, order_index) VALUES
('Alcohol Trivia', 'alcohol-trivia', '🎯', 1),
('All About Hangovers', 'hangovers', '🤕', 2),
('Beer Masterclass', 'beer-masterclass', '🍺', 3),
('Brandy Masterclass', 'brandy-masterclass', '🥃', 4),
('Cocktail Recipes', 'cocktail-recipes', '🍸', 5),
('Gin Masterclass', 'gin-masterclass', '🫒', 6),
('Rum Masterclass', 'rum-masterclass', '🏝️', 7),
('Tequila Masterclass', 'tequila-masterclass', '🌵', 8),
('Vodka Masterclass', 'vodka-masterclass', '🧊', 9),
('Whiskey Masterclass', 'whiskey-masterclass', '🥃', 10),
('Wine Masterclass', 'wine-masterclass', '🍷', 11),
('Product Reviews', 'product-reviews', '⭐', 12)
ON CONFLICT (slug) DO NOTHING;