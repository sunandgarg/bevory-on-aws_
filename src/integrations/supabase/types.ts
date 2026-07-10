export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          message: string
          notification_channel: string | null
          scheduled_at: string | null
          sent_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          notification_channel?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          notification_channel?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          cover_emoji: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          linked_brand: string | null
          linked_product_id: string | null
          meta_description: string | null
          meta_title: string | null
          notification_channel: string | null
          notify_users: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_emoji?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          linked_brand?: string | null
          linked_product_id?: string | null
          meta_description?: string | null
          meta_title?: string | null
          notification_channel?: string | null
          notify_users?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_emoji?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          linked_brand?: string | null
          linked_product_id?: string | null
          meta_description?: string | null
          meta_title?: string | null
          notification_channel?: string | null
          notify_users?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_linked_product_id_fkey"
            columns: ["linked_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_spotlights: {
        Row: {
          brand_name: string
          country: string | null
          created_at: string
          description: string | null
          faqs: Json | null
          featured_product_id: string | null
          final_verdict: string | null
          how_to_enjoy: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_url: string | null
          logo_emoji: string | null
          logo_url: string | null
          meta_description: string | null
          meta_title: string | null
          order_index: number | null
          pairing_ideas: Json | null
          show_in_spotlight: boolean | null
          slug: string | null
          story: string | null
          tasting_notes: Json | null
          updated_at: string
          why_choose: string | null
        }
        Insert: {
          brand_name: string
          country?: string | null
          created_at?: string
          description?: string | null
          faqs?: Json | null
          featured_product_id?: string | null
          final_verdict?: string | null
          how_to_enjoy?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          logo_emoji?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number | null
          pairing_ideas?: Json | null
          show_in_spotlight?: boolean | null
          slug?: string | null
          story?: string | null
          tasting_notes?: Json | null
          updated_at?: string
          why_choose?: string | null
        }
        Update: {
          brand_name?: string
          country?: string | null
          created_at?: string
          description?: string | null
          faqs?: Json | null
          featured_product_id?: string | null
          final_verdict?: string | null
          how_to_enjoy?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          logo_emoji?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number | null
          pairing_ideas?: Json | null
          show_in_spotlight?: boolean | null
          slug?: string | null
          story?: string | null
          tasting_notes?: Json | null
          updated_at?: string
          why_choose?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_spotlights_featured_product_id_fkey"
            columns: ["featured_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          image_url: string | null
          is_trending: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          order_index: number | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_trending?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          order_index?: number | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_trending?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          order_index?: number | null
          slug?: string
        }
        Relationships: []
      }
      cheers_guides: {
        Row: {
          created_at: string
          display_duration: number | null
          emoji: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_type: string | null
          link_url: string | null
          media_type: string | null
          order_index: number | null
          slug: string | null
          stories: Json | null
          subtitle: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          display_duration?: number | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_type?: string | null
          link_url?: string | null
          media_type?: string | null
          order_index?: number | null
          slug?: string | null
          stories?: Json | null
          subtitle?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          display_duration?: number | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_type?: string | null
          link_url?: string | null
          media_type?: string | null
          order_index?: number | null
          slug?: string | null
          stories?: Json | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          id: string
          is_popular: boolean | null
          is_visible: boolean | null
          name: string
          state_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_popular?: boolean | null
          is_visible?: boolean | null
          name: string
          state_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_popular?: boolean | null
          is_visible?: boolean | null
          name?: string
          state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      cocktails: {
        Row: {
          base_spirit: string | null
          category: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          image_emoji: string | null
          image_url: string | null
          ingredients: string[] | null
          instructions: string | null
          is_featured: boolean | null
          is_popular: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          prep_time: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          base_spirit?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          image_emoji?: string | null
          image_url?: string | null
          ingredients?: string[] | null
          instructions?: string | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          prep_time?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          base_spirit?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          image_emoji?: string | null
          image_url?: string | null
          ingredients?: string[] | null
          instructions?: string | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          prep_time?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      comparisons: {
        Row: {
          city_id: string | null
          created_at: string
          id: string
          product_ids: string[]
          session_id: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          id?: string
          product_ids: string[]
          session_id: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          id?: string
          product_ids?: string[]
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparisons_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      content_drafts: {
        Row: {
          assigned_manager: string | null
          content_data: Json
          content_id: string | null
          content_type: string
          created_at: string | null
          created_by: string | null
          id: string
          review_notes: string | null
          reviewed_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_manager?: string | null
          content_data: Json
          content_id?: string | null
          content_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_manager?: string | null
          content_data?: Json
          content_id?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string
          flag: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          flag?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          flag?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      help_support_items: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          link_type: string | null
          link_url: string | null
          order_index: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          link_type?: string | null
          link_url?: string | null
          order_index?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          link_type?: string | null
          link_url?: string | null
          order_index?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          notification_channel: string | null
          related_id: string | null
          related_type: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          notification_channel?: string | null
          related_id?: string | null
          related_type?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          notification_channel?: string | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      party_recommendations: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          max_budget: number
          max_guests: number
          min_budget: number
          min_guests: number
          notes: string | null
          recommended_quantity: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          max_budget: number
          max_guests: number
          min_budget: number
          min_guests: number
          notes?: string | null
          recommended_quantity: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          max_budget?: number
          max_guests?: number
          min_budget?: number
          min_guests?: number
          notes?: string | null
          recommended_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "party_recommendations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      preferred_brands: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          priority: number | null
          product_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          product_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preferred_brands_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preferred_brands_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_prices: {
        Row: {
          city_id: string
          created_at: string
          id: string
          in_stock: boolean | null
          mrp: number | null
          price: number
          product_id: string
          updated_at: string
          volume: string | null
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          in_stock?: boolean | null
          mrp?: number | null
          price: number
          product_id: string
          updated_at?: string
          volume?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          in_stock?: boolean | null
          mrp?: number | null
          price?: number
          product_id?: string
          updated_at?: string
          volume?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          is_reported: boolean | null
          product_id: string | null
          rating: number | null
          rebuy_rating: number | null
          report_reason: string | null
          reported_at: string | null
          reviewer_name: string | null
          taste_rating: number | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          user_id: string | null
          value_rating: number | null
          youtube_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_reported?: boolean | null
          product_id?: string | null
          rating?: number | null
          rebuy_rating?: number | null
          report_reason?: string | null
          reported_at?: string | null
          reviewer_name?: string | null
          taste_rating?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
          value_rating?: number | null
          youtube_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_reported?: boolean | null
          product_id?: string | null
          rating?: number | null
          rebuy_rating?: number | null
          report_reason?: string | null
          reported_at?: string | null
          reviewer_name?: string | null
          taste_rating?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
          value_rating?: number | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          abv: number | null
          age: string | null
          brand: string
          category_id: string | null
          created_at: string
          description: string | null
          faqs: Json | null
          id: string
          image_emoji: string | null
          image_url: string | null
          is_all_time_favourite: boolean | null
          is_trending: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          origin: string | null
          origin_flag: string | null
          rating: number | null
          review_count: number | null
          slug: string | null
          sub_category_id: string | null
          taste_profile: string | null
          tasting_notes: string | null
          type_description: string | null
          type_id: string | null
          type_tag: string | null
          updated_at: string
          volume: string | null
        }
        Insert: {
          abv?: number | null
          age?: string | null
          brand: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          faqs?: Json | null
          id?: string
          image_emoji?: string | null
          image_url?: string | null
          is_all_time_favourite?: boolean | null
          is_trending?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          origin?: string | null
          origin_flag?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          sub_category_id?: string | null
          taste_profile?: string | null
          tasting_notes?: string | null
          type_description?: string | null
          type_id?: string | null
          type_tag?: string | null
          updated_at?: string
          volume?: string | null
        }
        Update: {
          abv?: number | null
          age?: string | null
          brand?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          faqs?: Json | null
          id?: string
          image_emoji?: string | null
          image_url?: string | null
          is_all_time_favourite?: boolean | null
          is_trending?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          origin?: string | null
          origin_flag?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          sub_category_id?: string | null
          taste_profile?: string | null
          tasting_notes?: string | null
          type_description?: string | null
          type_id?: string | null
          type_tag?: string | null
          updated_at?: string
          volume?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recent_searches: {
        Row: {
          created_at: string
          id: string
          search_query: string
          search_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          search_query: string
          search_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          search_query?: string
          search_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_locations: {
        Row: {
          city_id: string
          created_at: string
          id: string
          is_default: boolean | null
          label: string | null
          user_id: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          user_id: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_locations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      spiritz_magazine: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          cover_emoji: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          published_at: string | null
          slug: string | null
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_emoji?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          slug?: string | null
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_emoji?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          slug?: string | null
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      states: {
        Row: {
          code: string
          country_id: string
          created_at: string
          id: string
          is_popular: boolean | null
          is_visible: boolean | null
          name: string
        }
        Insert: {
          code: string
          country_id: string
          created_at?: string
          id?: string
          is_popular?: boolean | null
          is_visible?: boolean | null
          name: string
        }
        Update: {
          code?: string
          country_id?: string
          created_at?: string
          id?: string
          is_popular?: boolean | null
          is_visible?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "states_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_categories: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          order_index: number | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          order_index?: number | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          cocktail_id: string | null
          created_at: string
          id: string
          product_id: string | null
          user_id: string
        }
        Insert: {
          cocktail_id?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          user_id: string
        }
        Update: {
          cocktail_id?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "cocktails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_publish: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          section: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_publish?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          section: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_publish?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          section?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          preferences: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preferences?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preferences?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_categories: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          slug?: string | null
        }
        Relationships: []
      }
      video_creators: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          order_index: number | null
          slug: string | null
          twitter_url: string | null
          updated_at: string | null
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          order_index?: number | null
          slug?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          order_index?: number | null
          slug?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      video_reviews: {
        Row: {
          category_id: string | null
          created_at: string
          creator_id: string | null
          description: string | null
          duration: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          product_id: string | null
          reviewer_name: string | null
          slug: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          views_count: number | null
          youtube_url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          product_id?: string | null
          reviewer_name?: string | null
          slug?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          views_count?: number | null
          youtube_url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          product_id?: string | null
          reviewer_name?: string | null
          slug?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          views_count?: number | null
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_reviews_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "video_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_reviews_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "video_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_slug: { Args: { input_text: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_section_permission: {
        Args: { _permission?: string; _section: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "content_manager" | "content_writer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "content_manager", "content_writer"],
    },
  },
} as const
