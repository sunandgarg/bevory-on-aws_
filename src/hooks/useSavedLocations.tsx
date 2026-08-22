import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/integrations/api/client";
import { useAuth } from "./useAuth";

interface SavedLocation {
  id: string;
  city_id: string;
  label: string | null;
  is_default: boolean;
  created_at: string;
  city?: {
    id: string;
    name: string;
    state?: {
      name: string;
    };
  };
}

export function useSavedLocations() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLocations = useCallback(async () => {
    if (!user) {
      setLocations([]);
      setLoading(false);
      return;
    }

    const { data, error } = await apiClient
      .from("saved_locations")
      .select(`
        *,
        city:cities(id, name, state:states(name))
      `)
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    if (!error && data) {
      setLocations(data as SavedLocation[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const addLocation = async (cityId: string, label?: string) => {
    if (!user) return false;

    const { data, error } = await apiClient
      .from("saved_locations")
      .insert({ user_id: user.id, city_id: cityId, label: label || null })
      .select(`*, city:cities(id, name, state:states(name))`)
      .single();

    if (!error && data) {
      setLocations((prev) => [...prev, data as SavedLocation]);
      return true;
    }
    return false;
  };

  const removeLocation = async (id: string) => {
    if (!user) return;
    await apiClient.from("saved_locations").delete().eq("id", id);
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    
    // Unset all defaults first
    await apiClient
      .from("saved_locations")
      .update({ is_default: false })
      .eq("user_id", user.id);
    
    // Set new default
    await apiClient
      .from("saved_locations")
      .update({ is_default: true })
      .eq("id", id);
    
    setLocations((prev) =>
      prev.map((l) => ({ ...l, is_default: l.id === id }))
    );
  };

  return { locations, loading, addLocation, removeLocation, setDefault, refetch: fetchLocations };
}
