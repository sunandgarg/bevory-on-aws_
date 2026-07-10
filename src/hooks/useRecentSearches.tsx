import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface RecentSearch {
  id: string;
  search_query: string;
  search_type: string;
  created_at: string;
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSearches = useCallback(async () => {
    if (!user) {
      setSearches([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("recent_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setSearches(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  const addSearch = async (query: string, type: string = "product") => {
    if (!user || !query.trim()) return;

    // Check if same query already exists
    const existing = searches.find(
      (s) => s.search_query.toLowerCase() === query.toLowerCase()
    );
    if (existing) {
      // Remove old entry
      await supabase.from("recent_searches").delete().eq("id", existing.id);
    }

    const { data, error } = await supabase
      .from("recent_searches")
      .insert({ user_id: user.id, search_query: query, search_type: type })
      .select()
      .single();

    if (!error && data) {
      setSearches((prev) => [data, ...prev.filter((s) => s.id !== existing?.id)].slice(0, 20));
    }
  };

  const removeSearch = async (id: string) => {
    if (!user) return;
    await supabase.from("recent_searches").delete().eq("id", id);
    setSearches((prev) => prev.filter((s) => s.id !== id));
  };

  const clearAll = async () => {
    if (!user) return;
    await supabase.from("recent_searches").delete().eq("user_id", user.id);
    setSearches([]);
  };

  return { searches, loading, addSearch, removeSearch, clearAll, refetch: fetchSearches };
}
