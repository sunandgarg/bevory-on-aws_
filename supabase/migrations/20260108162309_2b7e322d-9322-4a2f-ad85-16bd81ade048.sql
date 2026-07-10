-- Fix 1: Drop the overly permissive "All users can view profiles" policy
DROP POLICY IF EXISTS "All users can view profiles" ON public.profiles;

-- Create a view for public profile data (excludes sensitive fields like email)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  created_at
FROM public.profiles;

-- Grant SELECT on view to authenticated and anon users for public profile display
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;