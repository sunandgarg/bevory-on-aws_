import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/integrations/api/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface Favorite {
  id: string;
  product_id: string | null;
  cocktail_id: string | null;
  created_at: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const { data, error } = await apiClient
      .from("user_favorites")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      // Only log if it's not a network/auth issue (reduces console noise)
      if (error.code && error.code !== 'PGRST301') {
        console.error("Error fetching favorites:", error);
      }
    } else {
      setFavorites(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback(
    (productId?: string, cocktailId?: string) => {
      if (productId) {
        return favorites.some((f) => f.product_id === productId);
      }
      if (cocktailId) {
        return favorites.some((f) => f.cocktail_id === cocktailId);
      }
      return false;
    },
    [favorites]
  );

  const toggleFavorite = async (productId?: string, cocktailId?: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites",
        variant: "destructive",
      });
      return false;
    }

    const existing = favorites.find(
      (f) =>
        (productId && f.product_id === productId) ||
        (cocktailId && f.cocktail_id === cocktailId)
    );

    if (existing) {
      // Remove favorite
      const { error } = await apiClient
        .from("user_favorites")
        .delete()
        .eq("id", existing.id);

      if (error) {
        toast({
          title: "Error",
          description: "Could not remove from favorites",
          variant: "destructive",
        });
        return false;
      }

      setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      toast({ title: "Removed from favorites" });
      return false;
    } else {
      // Add favorite
      const newFavorite = {
        user_id: user.id,
        product_id: productId || null,
        cocktail_id: cocktailId || null,
      };

      const { data, error } = await apiClient
        .from("user_favorites")
        .insert(newFavorite)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Could not add to favorites",
          variant: "destructive",
        });
        return false;
      }

      setFavorites((prev) => [...prev, data]);
      toast({ title: "Added to favorites ❤️" });
      return true;
    }
  };

  const getFavoriteProducts = useCallback(() => {
    return favorites.filter((f) => f.product_id).map((f) => f.product_id!);
  }, [favorites]);

  const getFavoriteCocktails = useCallback(() => {
    return favorites.filter((f) => f.cocktail_id).map((f) => f.cocktail_id!);
  }, [favorites]);

  return {
    favorites,
    loading,
    isFavorite,
    toggleFavorite,
    getFavoriteProducts,
    getFavoriteCocktails,
    refetch: fetchFavorites,
  };
}