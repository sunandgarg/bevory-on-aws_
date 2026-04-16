import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const baseUrl = "https://www.bevory.in";
    const now = new Date().toISOString().split("T")[0];

    // Static pages
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/categories", priority: "0.9", changefreq: "weekly" },
      { loc: "/brands", priority: "0.8", changefreq: "weekly" },
      { loc: "/cocktails", priority: "0.8", changefreq: "weekly" },
      { loc: "/guide", priority: "0.7", changefreq: "weekly" },
      { loc: "/masterclass", priority: "0.7", changefreq: "weekly" },
      { loc: "/party-planner", priority: "0.7", changefreq: "monthly" },
      { loc: "/search", priority: "0.6", changefreq: "daily" },
      { loc: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
      { loc: "/terms", priority: "0.3", changefreq: "yearly" },
      { loc: "/disclaimer", priority: "0.3", changefreq: "yearly" },
      { loc: "/contact", priority: "0.4", changefreq: "yearly" },
    ];

    // City pages
    const { data: cities } = await supabase.from("cities").select("name").eq("is_visible", true);
    const cityPages = (cities || []).map((c) => ({
      loc: `/${c.name.toLowerCase().replace(/\s+/g, "-")}`,
      priority: "0.8",
      changefreq: "daily",
    }));

    // Products with category/subcategory for SEO URLs
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at, category_id, sub_category_id, categories(slug), sub_categories(slug)")
      .not("slug", "is", null)
      .limit(1000);

    // Get state for URL (default haryana)
    const productPages = (products || []).map((p: any) => {
      const catSlug = p.categories?.slug || "other";
      const subSlug = p.sub_categories?.slug || "general";
      return {
        loc: `/haryana/${catSlug}/${subSlug}/${p.slug}`,
        priority: "0.7",
        changefreq: "weekly",
        lastmod: p.updated_at?.split("T")[0] || now,
      };
    });

    // Categories
    const { data: categories } = await supabase.from("categories").select("slug");
    const categoryPages = (categories || []).map((c) => ({
      loc: `/category/${c.slug}`,
      priority: "0.8",
      changefreq: "weekly",
    }));

    // Brands
    const { data: brands } = await supabase.from("brand_spotlights").select("slug").eq("is_active", true).not("slug", "is", null);
    const brandPages = (brands || []).map((b) => ({
      loc: `/brand/${b.slug}`,
      priority: "0.6",
      changefreq: "monthly",
    }));

    // Cocktails
    const { data: cocktails } = await supabase.from("cocktails").select("slug").not("slug", "is", null);
    const cocktailPages = (cocktails || []).map((c) => ({
      loc: `/cocktails#${c.slug}`,
      priority: "0.5",
      changefreq: "monthly",
    }));

    // Blog / Guide
    const { data: blogs } = await supabase.from("blog_posts").select("slug, updated_at").eq("is_published", true);
    const blogPages = (blogs || []).map((b) => ({
      loc: `/guide/${b.slug}`,
      priority: "0.6",
      changefreq: "monthly",
      lastmod: b.updated_at?.split("T")[0] || now,
    }));

    // Video reviews
    const { data: videos } = await supabase.from("video_reviews").select("slug").eq("is_active", true).not("slug", "is", null);
    const videoPages = (videos || []).map((v) => ({
      loc: `/masterclass/${v.slug}`,
      priority: "0.5",
      changefreq: "monthly",
    }));

    const allPages = [...staticPages, ...cityPages, ...productPages, ...categoryPages, ...brandPages, ...cocktailPages, ...blogPages, ...videoPages];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `  <url>
    <loc>${baseUrl}${p.loc}</loc>
    <lastmod>${(p as any).lastmod || now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(`<!-- Error: ${message} -->`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});
