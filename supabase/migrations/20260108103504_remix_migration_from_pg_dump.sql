CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user',
    'content_manager',
    'content_writer'
);


--
-- Name: generate_slug(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_slug(input_text text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        trim(input_text),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NULL));
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    notification_channel text DEFAULT 'app'::text,
    is_active boolean DEFAULT true,
    scheduled_at timestamp with time zone,
    sent_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text,
    content text,
    cover_image_url text,
    cover_emoji text DEFAULT '📰'::text,
    author text,
    category text,
    tags text[] DEFAULT '{}'::text[],
    is_published boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    published_at timestamp with time zone,
    meta_title text,
    meta_description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    linked_product_id uuid,
    linked_brand text,
    notify_users boolean DEFAULT false,
    notification_channel text DEFAULT 'app'::text
);


--
-- Name: brand_spotlights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brand_spotlights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_name text NOT NULL,
    logo_emoji text DEFAULT '🏷️'::text,
    logo_url text,
    description text,
    featured_product_id uuid,
    link_url text,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    country text,
    image_url text,
    tasting_notes jsonb DEFAULT '[]'::jsonb,
    story text,
    how_to_enjoy jsonb DEFAULT '[]'::jsonb,
    pairing_ideas jsonb DEFAULT '[]'::jsonb,
    why_choose text,
    faqs jsonb DEFAULT '[]'::jsonb,
    final_verdict text,
    slug text,
    show_in_spotlight boolean DEFAULT true
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    emoji text,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    image_url text,
    is_trending boolean DEFAULT false
);


--
-- Name: cheers_guides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cheers_guides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    subtitle text,
    image_url text,
    emoji text DEFAULT '🥂'::text,
    link_url text,
    link_type text DEFAULT 'internal'::text,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    media_type text DEFAULT 'image'::text,
    video_url text,
    display_duration integer DEFAULT 5,
    stories jsonb DEFAULT '[]'::jsonb,
    slug text
);


--
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    state_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_visible boolean DEFAULT true,
    is_popular boolean DEFAULT false
);


--
-- Name: cocktails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cocktails (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    image_emoji text DEFAULT '🍸'::text,
    image_url text,
    ingredients text[] DEFAULT '{}'::text[],
    instructions text,
    difficulty text DEFAULT 'Easy'::text,
    prep_time text DEFAULT '5 mins'::text,
    category text DEFAULT 'Classic'::text,
    base_spirit text,
    is_featured boolean DEFAULT false,
    is_popular boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text
);


--
-- Name: comparisons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comparisons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text NOT NULL,
    product_ids uuid[] NOT NULL,
    city_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    flag text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: help_support_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.help_support_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    icon text DEFAULT 'HelpCircle'::text,
    link_url text,
    link_type text DEFAULT 'internal'::text,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'announcement'::text,
    related_id uuid,
    related_type text,
    is_read boolean DEFAULT false,
    notification_channel text DEFAULT 'app'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: party_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.party_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    min_guests integer NOT NULL,
    max_guests integer NOT NULL,
    min_budget numeric(10,2) NOT NULL,
    max_budget numeric(10,2) NOT NULL,
    category_id uuid,
    recommended_quantity integer NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: preferred_brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preferred_brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid,
    product_id uuid,
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    city_id uuid NOT NULL,
    price numeric(10,2) NOT NULL,
    mrp numeric(10,2),
    in_stock boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    volume text DEFAULT '750ml'::text
);


--
-- Name: product_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    user_id uuid,
    title text,
    content text,
    rating integer,
    youtube_url text,
    thumbnail_url text,
    is_featured boolean DEFAULT false,
    is_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    taste_rating integer,
    value_rating integer,
    rebuy_rating integer,
    reviewer_name text,
    is_reported boolean DEFAULT false,
    report_reason text,
    reported_at timestamp with time zone,
    CONSTRAINT product_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT product_reviews_rebuy_rating_check CHECK (((rebuy_rating >= 1) AND (rebuy_rating <= 5))),
    CONSTRAINT product_reviews_taste_rating_check CHECK (((taste_rating >= 1) AND (taste_rating <= 5))),
    CONSTRAINT product_reviews_value_rating_check CHECK (((value_rating >= 1) AND (value_rating <= 5)))
);


--
-- Name: product_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    brand text NOT NULL,
    category_id uuid,
    description text,
    volume text,
    abv numeric(5,2),
    age text,
    origin text,
    origin_flag text,
    taste_profile text,
    image_emoji text DEFAULT '🥃'::text,
    rating numeric(2,1) DEFAULT 0,
    review_count integer DEFAULT 0,
    is_trending boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    type_tag text,
    type_description text,
    image_url text,
    tasting_notes text,
    type_id uuid,
    faqs jsonb DEFAULT '[]'::jsonb,
    is_all_time_favourite boolean DEFAULT false,
    slug text
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: recent_searches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recent_searches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    search_query text NOT NULL,
    search_type text DEFAULT 'product'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: saved_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    city_id uuid NOT NULL,
    label text,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: spiritz_magazine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spiritz_magazine (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    excerpt text,
    content text,
    cover_url text,
    cover_emoji text DEFAULT '📰'::text,
    author text,
    category text,
    youtube_url text,
    is_featured boolean DEFAULT false,
    is_published boolean DEFAULT false,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text
);


--
-- Name: states; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.states (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    country_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_visible boolean DEFAULT true,
    is_popular boolean DEFAULT false
);


--
-- Name: user_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid,
    cocktail_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_one_item CHECK ((((product_id IS NOT NULL) AND (cocktail_id IS NULL)) OR ((product_id IS NULL) AND (cocktail_id IS NOT NULL))))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_key_key UNIQUE (key);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: brand_spotlights brand_spotlights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_spotlights
    ADD CONSTRAINT brand_spotlights_pkey PRIMARY KEY (id);


--
-- Name: brand_spotlights brand_spotlights_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_spotlights
    ADD CONSTRAINT brand_spotlights_slug_key UNIQUE (slug);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: cheers_guides cheers_guides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cheers_guides
    ADD CONSTRAINT cheers_guides_pkey PRIMARY KEY (id);


--
-- Name: cheers_guides cheers_guides_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cheers_guides
    ADD CONSTRAINT cheers_guides_slug_key UNIQUE (slug);


--
-- Name: cities cities_name_state_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_name_state_id_key UNIQUE (name, state_id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: cocktails cocktails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cocktails
    ADD CONSTRAINT cocktails_pkey PRIMARY KEY (id);


--
-- Name: cocktails cocktails_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cocktails
    ADD CONSTRAINT cocktails_slug_key UNIQUE (slug);


--
-- Name: comparisons comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comparisons
    ADD CONSTRAINT comparisons_pkey PRIMARY KEY (id);


--
-- Name: countries countries_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_code_key UNIQUE (code);


--
-- Name: countries countries_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_name_key UNIQUE (name);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: help_support_items help_support_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.help_support_items
    ADD CONSTRAINT help_support_items_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: party_recommendations party_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.party_recommendations
    ADD CONSTRAINT party_recommendations_pkey PRIMARY KEY (id);


--
-- Name: preferred_brands preferred_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferred_brands
    ADD CONSTRAINT preferred_brands_pkey PRIMARY KEY (id);


--
-- Name: product_prices product_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_pkey PRIMARY KEY (id);


--
-- Name: product_reviews product_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_pkey PRIMARY KEY (id);


--
-- Name: product_types product_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: recent_searches recent_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recent_searches
    ADD CONSTRAINT recent_searches_pkey PRIMARY KEY (id);


--
-- Name: saved_locations saved_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_locations
    ADD CONSTRAINT saved_locations_pkey PRIMARY KEY (id);


--
-- Name: spiritz_magazine spiritz_magazine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spiritz_magazine
    ADD CONSTRAINT spiritz_magazine_pkey PRIMARY KEY (id);


--
-- Name: spiritz_magazine spiritz_magazine_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spiritz_magazine
    ADD CONSTRAINT spiritz_magazine_slug_key UNIQUE (slug);


--
-- Name: states states_name_country_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_name_country_id_key UNIQUE (name, country_id);


--
-- Name: states states_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_pkey PRIMARY KEY (id);


--
-- Name: user_favorites unique_user_cocktail; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT unique_user_cocktail UNIQUE (user_id, cocktail_id);


--
-- Name: user_favorites unique_user_product; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT unique_user_product UNIQUE (user_id, product_id);


--
-- Name: user_favorites user_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_blog_posts_linked_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_linked_brand ON public.blog_posts USING btree (linked_brand);


--
-- Name: idx_blog_posts_linked_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_linked_product ON public.blog_posts USING btree (linked_product_id);


--
-- Name: idx_brand_spotlights_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_brand_spotlights_slug ON public.brand_spotlights USING btree (slug);


--
-- Name: idx_cheers_guides_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cheers_guides_slug ON public.cheers_guides USING btree (slug);


--
-- Name: idx_cities_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cities_state ON public.cities USING btree (state_id);


--
-- Name: idx_cocktails_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cocktails_slug ON public.cocktails USING btree (slug);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_party_recommendations_budget; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_party_recommendations_budget ON public.party_recommendations USING btree (min_budget, max_budget);


--
-- Name: idx_party_recommendations_guests; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_party_recommendations_guests ON public.party_recommendations USING btree (min_guests, max_guests);


--
-- Name: idx_product_prices_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_prices_city ON public.product_prices USING btree (city_id);


--
-- Name: idx_product_prices_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_prices_product ON public.product_prices USING btree (product_id);


--
-- Name: idx_product_prices_volume; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_prices_volume ON public.product_prices USING btree (product_id, city_id, volume);


--
-- Name: idx_product_reviews_reported; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_reviews_reported ON public.product_reviews USING btree (is_reported) WHERE (is_reported = true);


--
-- Name: idx_products_all_time_favourite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_all_time_favourite ON public.products USING btree (is_all_time_favourite) WHERE (is_all_time_favourite = true);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_products_faqs; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_faqs ON public.products USING gin (faqs);


--
-- Name: idx_products_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_slug ON public.products USING btree (slug);


--
-- Name: idx_products_trending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_trending ON public.products USING btree (is_trending);


--
-- Name: idx_recent_searches_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recent_searches_user_id ON public.recent_searches USING btree (user_id);


--
-- Name: idx_saved_locations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_locations_user_id ON public.saved_locations USING btree (user_id);


--
-- Name: idx_spiritz_magazine_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spiritz_magazine_slug ON public.spiritz_magazine USING btree (slug);


--
-- Name: idx_states_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_states_country ON public.states USING btree (country_id);


--
-- Name: idx_user_favorites_cocktail_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_favorites_cocktail_id ON public.user_favorites USING btree (cocktail_id);


--
-- Name: idx_user_favorites_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_favorites_product_id ON public.user_favorites USING btree (product_id);


--
-- Name: idx_user_favorites_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_favorites_user_id ON public.user_favorites USING btree (user_id);


--
-- Name: product_prices_product_city_volume_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX product_prices_product_city_volume_unique ON public.product_prices USING btree (product_id, city_id, volume);


--
-- Name: announcements update_announcements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: blog_posts update_blog_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cocktails update_cocktails_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cocktails_updated_at BEFORE UPDATE ON public.cocktails FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: help_support_items update_help_support_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_help_support_items_updated_at BEFORE UPDATE ON public.help_support_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: product_prices update_product_prices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_prices_updated_at BEFORE UPDATE ON public.product_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: blog_posts blog_posts_linked_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_linked_product_id_fkey FOREIGN KEY (linked_product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: brand_spotlights brand_spotlights_featured_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_spotlights
    ADD CONSTRAINT brand_spotlights_featured_product_id_fkey FOREIGN KEY (featured_product_id) REFERENCES public.products(id);


--
-- Name: cities cities_state_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_state_id_fkey FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE CASCADE;


--
-- Name: comparisons comparisons_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comparisons
    ADD CONSTRAINT comparisons_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id);


--
-- Name: party_recommendations party_recommendations_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.party_recommendations
    ADD CONSTRAINT party_recommendations_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: preferred_brands preferred_brands_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferred_brands
    ADD CONSTRAINT preferred_brands_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: preferred_brands preferred_brands_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferred_brands
    ADD CONSTRAINT preferred_brands_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_prices product_prices_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: product_prices product_prices_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_reviews product_reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: products products_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.product_types(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: saved_locations saved_locations_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_locations
    ADD CONSTRAINT saved_locations_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: states states_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_cocktail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_cocktail_id_fkey FOREIGN KEY (cocktail_id) REFERENCES public.cocktails(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: app_settings Admins can delete app_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete app_settings" ON public.app_settings FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blog_posts Admins can delete blog_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete blog_posts" ON public.blog_posts FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: brand_spotlights Admins can delete brand_spotlights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete brand_spotlights" ON public.brand_spotlights FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: categories Admins can delete categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cheers_guides Admins can delete cheers_guides; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete cheers_guides" ON public.cheers_guides FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cities Admins can delete cities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete cities" ON public.cities FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cocktails Admins can delete cocktails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete cocktails" ON public.cocktails FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: countries Admins can delete countries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete countries" ON public.countries FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: party_recommendations Admins can delete party_recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete party_recommendations" ON public.party_recommendations FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: preferred_brands Admins can delete preferred_brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete preferred_brands" ON public.preferred_brands FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_prices Admins can delete product_prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete product_prices" ON public.product_prices FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_reviews Admins can delete product_reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete product_reviews" ON public.product_reviews FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_types Admins can delete product_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete product_types" ON public.product_types FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can delete products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: spiritz_magazine Admins can delete spiritz_magazine; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete spiritz_magazine" ON public.spiritz_magazine FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: states Admins can delete states; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete states" ON public.states FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: app_settings Admins can insert app_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert app_settings" ON public.app_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blog_posts Admins can insert blog_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert blog_posts" ON public.blog_posts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: brand_spotlights Admins can insert brand_spotlights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert brand_spotlights" ON public.brand_spotlights FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: categories Admins can insert categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cheers_guides Admins can insert cheers_guides; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert cheers_guides" ON public.cheers_guides FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cities Admins can insert cities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert cities" ON public.cities FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cocktails Admins can insert cocktails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert cocktails" ON public.cocktails FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: countries Admins can insert countries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert countries" ON public.countries FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notifications Admins can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: party_recommendations Admins can insert party_recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert party_recommendations" ON public.party_recommendations FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: preferred_brands Admins can insert preferred_brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert preferred_brands" ON public.preferred_brands FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_prices Admins can insert product_prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert product_prices" ON public.product_prices FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_types Admins can insert product_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert product_types" ON public.product_types FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can insert products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: spiritz_magazine Admins can insert spiritz_magazine; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert spiritz_magazine" ON public.spiritz_magazine FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: states Admins can insert states; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert states" ON public.states FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: announcements Admins can manage announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage announcements" ON public.announcements USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: help_support_items Admins can manage help items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage help items" ON public.help_support_items USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blog_posts Admins can select all blog_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can select all blog_posts" ON public.blog_posts FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: spiritz_magazine Admins can select all spiritz_magazine; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can select all spiritz_magazine" ON public.spiritz_magazine FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: app_settings Admins can update app_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update app_settings" ON public.app_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blog_posts Admins can update blog_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update blog_posts" ON public.blog_posts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: brand_spotlights Admins can update brand_spotlights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update brand_spotlights" ON public.brand_spotlights FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: categories Admins can update categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cheers_guides Admins can update cheers_guides; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update cheers_guides" ON public.cheers_guides FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cities Admins can update cities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update cities" ON public.cities FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cocktails Admins can update cocktails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update cocktails" ON public.cocktails FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: countries Admins can update countries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update countries" ON public.countries FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: party_recommendations Admins can update party_recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update party_recommendations" ON public.party_recommendations FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: preferred_brands Admins can update preferred_brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update preferred_brands" ON public.preferred_brands FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_prices Admins can update product_prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update product_prices" ON public.product_prices FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_reviews Admins can update product_reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update product_reviews" ON public.product_reviews FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_types Admins can update product_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update product_types" ON public.product_types FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can update products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: spiritz_magazine Admins can update spiritz_magazine; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update spiritz_magazine" ON public.spiritz_magazine FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: states Admins can update states; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update states" ON public.states FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles All users can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: app_settings App settings are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "App settings are publicly readable" ON public.app_settings FOR SELECT USING (true);


--
-- Name: brand_spotlights Brand spotlights are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Brand spotlights are publicly readable" ON public.brand_spotlights FOR SELECT USING (true);


--
-- Name: categories Categories are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);


--
-- Name: cheers_guides Cheers guides are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cheers guides are publicly readable" ON public.cheers_guides FOR SELECT USING (true);


--
-- Name: cities Cities are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cities are publicly readable" ON public.cities FOR SELECT USING (true);


--
-- Name: cocktails Cocktails are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cocktails are publicly readable" ON public.cocktails FOR SELECT USING (true);


--
-- Name: comparisons Comparisons are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Comparisons are publicly readable" ON public.comparisons FOR SELECT USING (true);


--
-- Name: comparisons Comparisons can be created by anyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Comparisons can be created by anyone" ON public.comparisons FOR INSERT WITH CHECK (true);


--
-- Name: countries Countries are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Countries are publicly readable" ON public.countries FOR SELECT USING (true);


--
-- Name: announcements Everyone can view active announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active announcements" ON public.announcements FOR SELECT USING ((is_active = true));


--
-- Name: help_support_items Everyone can view active help items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active help items" ON public.help_support_items FOR SELECT USING ((is_active = true));


--
-- Name: party_recommendations Party recommendations are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Party recommendations are publicly readable" ON public.party_recommendations FOR SELECT USING (true);


--
-- Name: preferred_brands Preferred brands are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Preferred brands are publicly readable" ON public.preferred_brands FOR SELECT USING (true);


--
-- Name: product_prices Product prices are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Product prices are publicly readable" ON public.product_prices FOR SELECT USING (true);


--
-- Name: product_reviews Product reviews are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Product reviews are publicly readable" ON public.product_reviews FOR SELECT USING (((is_approved = true) OR ((user_id IS NOT NULL) AND (auth.uid() = user_id))));


--
-- Name: product_types Product types are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Product types are publicly readable" ON public.product_types FOR SELECT USING (true);


--
-- Name: products Products are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);


--
-- Name: blog_posts Published blog posts are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published blog posts are publicly readable" ON public.blog_posts FOR SELECT USING ((is_published = true));


--
-- Name: spiritz_magazine Spiritz magazine are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Spiritz magazine are publicly readable" ON public.spiritz_magazine FOR SELECT USING ((is_published = true));


--
-- Name: states States are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "States are publicly readable" ON public.states FOR SELECT USING (true);


--
-- Name: profiles System can insert profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);


--
-- Name: user_favorites Users can add own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add own favorites" ON public.user_favorites FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: product_reviews Users can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);


--
-- Name: user_favorites Users can delete own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own favorites" ON public.user_favorites FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: notifications Users can delete their notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their notifications" ON public.notifications FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: recent_searches Users can delete their own recent searches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own recent searches" ON public.recent_searches FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: saved_locations Users can delete their saved locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their saved locations" ON public.saved_locations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: recent_searches Users can insert their own recent searches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own recent searches" ON public.recent_searches FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: saved_locations Users can insert their saved locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their saved locations" ON public.saved_locations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: product_reviews Users can update own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own reviews" ON public.product_reviews FOR UPDATE USING (((user_id IS NOT NULL) AND (auth.uid() = user_id)));


--
-- Name: notifications Users can update their notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: saved_locations Users can update their saved locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their saved locations" ON public.saved_locations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_favorites Users can view own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own favorites" ON public.user_favorites FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view their notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: recent_searches Users can view their own recent searches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own recent searches" ON public.recent_searches FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: saved_locations Users can view their saved locations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their saved locations" ON public.saved_locations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: brand_spotlights; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brand_spotlights ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: cheers_guides; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cheers_guides ENABLE ROW LEVEL SECURITY;

--
-- Name: cities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

--
-- Name: cocktails; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cocktails ENABLE ROW LEVEL SECURITY;

--
-- Name: comparisons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;

--
-- Name: countries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

--
-- Name: help_support_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.help_support_items ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: party_recommendations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.party_recommendations ENABLE ROW LEVEL SECURITY;

--
-- Name: preferred_brands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.preferred_brands ENABLE ROW LEVEL SECURITY;

--
-- Name: product_prices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

--
-- Name: product_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: product_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: recent_searches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recent_searches ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

--
-- Name: spiritz_magazine; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.spiritz_magazine ENABLE ROW LEVEL SECURITY;

--
-- Name: states; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;

--
-- Name: user_favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;