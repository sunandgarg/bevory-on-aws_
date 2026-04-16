import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FavoriteButton from "@/components/FavoriteButton";
import CompareButton from "@/components/product/CompareButton";

interface Product {
  id: string;
  name: string;
  brand: string;
  slug: string | null;
  image_url: string | null;
  image_emoji: string | null;
  rating: number | null;
  volume: string | null;
}

interface Cocktail {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  image_emoji: string | null;
  difficulty: string | null;
  prep_time: string | null;
}

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const { getFavoriteProducts, getFavoriteCocktails, loading: favLoading } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteItems = async () => {
      if (!user || favLoading) return;

      const productIds = getFavoriteProducts();
      const cocktailIds = getFavoriteCocktails();

      const [productsRes, cocktailsRes] = await Promise.all([
        productIds.length > 0
          ? supabase
              .from("products")
              .select("id, name, brand, slug, image_url, image_emoji, rating, volume")
              .in("id", productIds)
          : Promise.resolve({ data: [] }),
        cocktailIds.length > 0
          ? supabase
              .from("cocktails")
              .select("id, name, slug, image_url, image_emoji, difficulty, prep_time")
              .in("id", cocktailIds)
          : Promise.resolve({ data: [] }),
      ]);

      setProducts(productsRes.data || []);
      setCocktails(cocktailsRes.data || []);
      setLoading(false);
    };

    fetchFavoriteItems();
  }, [user, favLoading, getFavoriteProducts, getFavoriteCocktails]);

  if (authLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout>
        <div className="p-4 text-center space-y-4">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-serif font-bold">Your Favorites</h1>
          <p className="text-muted-foreground">
            Sign in to save your favorite products and cocktails
          </p>
          <Link to="/auth">
            <Button className="w-full max-w-xs">Sign In</Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  const isEmpty = products.length === 0 && cocktails.length === 0;

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          <h1 className="text-2xl font-serif font-bold">Your Favorites</h1>
        </div>

        {loading || favLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="text-center py-12 space-y-4">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              No favorites yet. Start exploring and save items you love!
            </p>
            <Link to="/">
              <Button variant="outline">Explore Products</Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products">
                Products ({products.length})
              </TabsTrigger>
              <TabsTrigger value="cocktails">
                Cocktails ({cocktails.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-3 mt-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.slug || product.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-accent/50 transition-colors"
                >
                  <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{product.image_emoji || "🥃"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {product.brand} {product.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {product.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-accent text-accent" />
                          {product.rating}
                        </span>
                      )}
                      {product.volume && <span>{product.volume}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <CompareButton productId={product.id} size="sm" variant="icon" />
                    <FavoriteButton productId={product.id} size="sm" />
                  </div>
                </Link>
              ))}
            </TabsContent>

            <TabsContent value="cocktails" className="space-y-3 mt-4">
              {cocktails.map((cocktail) => (
                <Link
                  key={cocktail.id}
                  to={`/cocktails/${cocktail.slug || cocktail.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-accent/50 transition-colors"
                >
                  <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                    {cocktail.image_url ? (
                      <img
                        src={cocktail.image_url}
                        alt={cocktail.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{cocktail.image_emoji || "🍸"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{cocktail.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {cocktail.difficulty && <span>{cocktail.difficulty}</span>}
                      {cocktail.prep_time && <span>• {cocktail.prep_time}</span>}
                    </div>
                  </div>
                  <FavoriteButton cocktailId={cocktail.id} size="sm" />
                </Link>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MobileLayout>
  );
};

export default Favorites;