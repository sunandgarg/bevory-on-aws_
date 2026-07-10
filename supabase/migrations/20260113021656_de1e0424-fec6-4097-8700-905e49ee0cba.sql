-- Add meta_title and meta_description to brand_spotlights if they don't exist
ALTER TABLE public.brand_spotlights 
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text;

-- Add meta_title and meta_description to cocktails if they don't exist
ALTER TABLE public.cocktails 
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text;