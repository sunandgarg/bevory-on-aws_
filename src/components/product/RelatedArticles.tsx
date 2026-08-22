import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/integrations/api/client";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_emoji: string | null;
  cover_image_url: string | null;
}

interface RelatedArticlesProps {
  productId: string;
  brandName: string;
}

const RelatedArticles = ({ productId, brandName }: RelatedArticlesProps) => {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const fetchArticles = async () => {
      // Fetch articles linked to this product or brand
      const { data } = await apiClient
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_emoji, cover_image_url")
        .eq("is_published", true)
        .or(`linked_product_id.eq.${productId},linked_brand.ilike.%${brandName}%`)
        .order("published_at", { ascending: false })
        .limit(3);

      if (data) setArticles(data);
    };
    fetchArticles();
  }, [productId, brandName]);

  if (articles.length === 0) return null;

  return (
    <div>
      <h3 className="font-semibold mb-3">Related Articles</h3>
      <div className="space-y-3">
        {articles.map((article) => (
          <Link key={article.id} to={`/guide/${article.slug}`}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-accent/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                {article.cover_image_url ? (
                  <img src={article.cover_image_url} alt={article.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{article.cover_emoji || "📰"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{article.title}</p>
                {article.excerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{article.excerpt}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedArticles;
