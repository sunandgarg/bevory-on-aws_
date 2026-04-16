-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the images bucket
CREATE POLICY "Public images are viewable by everyone" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Create sub_categories table
CREATE TABLE public.sub_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  emoji TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add sub_category_id to products table
ALTER TABLE public.products ADD COLUMN sub_category_id UUID REFERENCES public.sub_categories(id) ON DELETE SET NULL;

-- Enable RLS on sub_categories
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sub_categories
CREATE POLICY "Sub-categories are viewable by everyone" 
ON public.sub_categories FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert sub-categories" 
ON public.sub_categories FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'content_manager'));

CREATE POLICY "Admins can update sub-categories" 
ON public.sub_categories FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'content_manager'));

CREATE POLICY "Admins can delete sub-categories" 
ON public.sub_categories FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_sub_categories_updated_at
BEFORE UPDATE ON public.sub_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_sub_categories_category_id ON public.sub_categories(category_id);
CREATE INDEX idx_products_sub_category_id ON public.products(sub_category_id);