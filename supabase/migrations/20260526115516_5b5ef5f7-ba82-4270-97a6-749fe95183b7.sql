
-- Hot-path indexes for high-traffic read queries
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products (brand);
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON public.products (lower(name));
CREATE INDEX IF NOT EXISTS idx_products_trending_partial ON public.products (is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_prices_product_city ON public.product_prices (product_id, city_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_city_price ON public.product_prices (city_id, price);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_approved ON public.product_reviews (product_id, is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON public.product_reviews (user_id);

CREATE INDEX IF NOT EXISTS idx_video_reviews_product ON public.video_reviews (product_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_video_reviews_active_order ON public.video_reviews (is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_video_reviews_creator ON public.video_reviews (creator_id);
CREATE INDEX IF NOT EXISTS idx_video_reviews_category ON public.video_reviews (category_id);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts (is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts (slug);

CREATE INDEX IF NOT EXISTS idx_spiritz_magazine_published ON public.spiritz_magazine (is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_spiritz_magazine_slug ON public.spiritz_magazine (slug);

CREATE INDEX IF NOT EXISTS idx_cocktails_slug ON public.cocktails (slug);
CREATE INDEX IF NOT EXISTS idx_cocktails_featured ON public.cocktails (is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_sub_categories_active ON public.sub_categories (category_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_searches_user ON public.recent_searches (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles (user_id);

ANALYZE public.products;
ANALYZE public.product_prices;
ANALYZE public.product_reviews;
