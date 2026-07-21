-- Remove credentials that older admin screens stored in publicly readable JSON.
UPDATE public.app_settings
SET value = value
  - 'openai_api_key'
  - 'claude_api_key'
  - 'perplexity_api_key'
WHERE key = 'ai_recommendation_settings';

UPDATE public.app_settings
SET value = value - 'serviceAccountJson'
WHERE key = 'google_analytics';

-- Only explicitly non-sensitive presentation settings may be read publicly.
DROP POLICY IF EXISTS "App settings are publicly readable" ON public.app_settings;
DROP POLICY IF EXISTS "Public can read safe app settings" ON public.app_settings;
CREATE POLICY "Public can read safe app settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (
  key IN (
    'age_verification',
    'branding',
    'image_optimization',
    'sub_category_display',
    'trending_default_category'
  )
);

DROP POLICY IF EXISTS "Admins can select all app_settings" ON public.app_settings;
CREATE POLICY "Admins can select all app_settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- The previous public-profile view policy applied USING (true) to the base
-- table, which exposed email addresses as well as the intended public fields.
DROP POLICY IF EXISTS "Anyone can view basic public profile info via view" ON public.profiles;
DROP POLICY IF EXISTS "All users can view profiles" ON public.profiles;
DROP VIEW IF EXISTS public.public_profiles;

-- Existing policies continue to permit users to read their own profile and
-- admins to read all profiles.
