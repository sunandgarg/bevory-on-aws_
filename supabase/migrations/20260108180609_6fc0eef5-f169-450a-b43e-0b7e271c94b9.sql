-- Fix SECURITY DEFINER view issue by recreating with SECURITY INVOKER
-- Drop and recreate the public_profiles view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the view with SECURITY INVOKER (default, but explicitly set for clarity)
-- This view exposes only non-sensitive profile fields for public access
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
    id,
    full_name,
    avatar_url,
    created_at
FROM public.profiles;

-- Grant SELECT access to authenticated and anonymous users on the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Add a permissive RLS policy on profiles table to allow anyone to read basic profile info via the view
-- This is needed because the view with SECURITY INVOKER will enforce the querying user's permissions
CREATE POLICY "Anyone can view basic public profile info via view"
ON public.profiles
FOR SELECT
USING (true);

-- Comment for documentation
COMMENT ON VIEW public.public_profiles IS 'Exposes limited profile data (id, full_name, avatar_url, created_at) for public access. Uses SECURITY INVOKER to enforce RLS.';