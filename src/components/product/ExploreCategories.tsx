import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/integrations/api/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
}

interface ExploreCategoriesProps {
  currentCategoryId: string | null;
}

const ExploreCategories = ({ currentCategoryId }: ExploreCategoriesProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await apiClient
        .from("categories")
        .select("id, name, slug, emoji")
        .eq("is_active", true)
        .order("name");

      if (data) {
        setAllCategories(data);
        // Get 2 random categories excluding current
        const otherCategories = data.filter((c) => c.id !== currentCategoryId);
        const shuffled = otherCategories.sort(() => 0.5 - Math.random());
        setCategories(shuffled.slice(0, 2));
      }
    };
    fetchCategories();
  }, [currentCategoryId]);

  return (
    <div className="space-y-6">
      {/* Explore Other Categories */}
      {categories.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Explore Other Categories</h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/category/${cat.slug}`}>
                <div className="p-4 rounded-xl bg-card border border-border hover:border-accent/50 transition-colors text-center">
                  <span className="text-3xl block mb-2">{cat.emoji || "🍷"}</span>
                  <p className="font-medium text-sm">{cat.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Categories */}
      <div>
        <h3 className="font-semibold mb-3">All Categories</h3>
        <div className="flex gap-2 flex-wrap">
          {allCategories.map((cat) => (
            <Link key={cat.id} to={`/category/${cat.slug}`}>
              <div className={`px-3 py-2 rounded-full border transition-colors text-sm flex items-center gap-1 ${
                cat.id === currentCategoryId 
                  ? "bg-accent/10 border-accent text-accent" 
                  : "bg-card border-border hover:border-accent/50"
              }`}>
                <span>{cat.emoji || "🍷"}</span>
                <span>{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExploreCategories;
