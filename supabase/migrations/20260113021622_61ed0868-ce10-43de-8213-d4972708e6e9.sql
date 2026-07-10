-- Drop existing insert policy for product_reviews
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.product_reviews;

-- Create new policy that allows anyone to create reviews (for anonymous reviews)
CREATE POLICY "Anyone can create reviews" 
ON public.product_reviews 
FOR INSERT 
WITH CHECK (true);

-- Update select policy to allow all reviews to be readable (approved ones publicly, users can see their own)
DROP POLICY IF EXISTS "Product reviews are publicly readable" ON public.product_reviews;
CREATE POLICY "Product reviews are publicly readable" 
ON public.product_reviews 
FOR SELECT 
USING (is_approved = true OR (user_id IS NOT NULL AND auth.uid() = user_id));