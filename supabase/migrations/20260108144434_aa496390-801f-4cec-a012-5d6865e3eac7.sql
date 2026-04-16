-- Add order_index column to categories table for custom ordering
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;