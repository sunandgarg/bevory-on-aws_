-- Add sub_category_settings to app_settings with default values
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'sub_category_display',
  '{
    "enabled": true,
    "showOnProductCards": true,
    "showOnProductDetail": true,
    "showOnSearch": true,
    "showEmoji": true,
    "badgeStyle": "filled",
    "colorScheme": "accent"
  }'::jsonb,
  'Sub-category badge display settings for product cards and pages'
)
ON CONFLICT (key) DO NOTHING;