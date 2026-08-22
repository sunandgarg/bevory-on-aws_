import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/integrations/api/client";
import type { Json } from "@/types/json";

export interface AgeVerificationSettings {
  enabled: boolean;
  defaultCity: string;
  title: string;
  description: string;
  confirmButtonText: string;
  declineButtonText: string;
  termsText: string;
}

const DEFAULT_AGE_SETTINGS: AgeVerificationSettings = {
  enabled: true,
  defaultCity: "Gurgaon",
  title: "Are you of legal drinking age?",
  description: "You must be of legal drinking age in your region to access this website.",
  confirmButtonText: "Yes, I am 21+",
  declineButtonText: "No, I am not",
  termsText: "By entering this website, you agree to our Terms of Service and Privacy Policy.",
};

export const useAppSettings = () => {
  const [ageSettings, setAgeSettings] = useState<AgeVerificationSettings>(DEFAULT_AGE_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await apiClient
        .from("app_settings")
        .select("*")
        .eq("key", "age_verification")
        .maybeSingle();

      if (!error && data?.value) {
        const value = data.value as unknown as AgeVerificationSettings;
        setAgeSettings({ ...DEFAULT_AGE_SETTINGS, ...value });
      }
    } catch (error) {
      console.error("Error fetching age settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateAgeSettings = async (newSettings: AgeVerificationSettings) => {
    try {
      const jsonValue = JSON.parse(JSON.stringify(newSettings)) as Json;
      
      const { data: existing } = await apiClient
        .from("app_settings")
        .select("id")
        .eq("key", "age_verification")
        .maybeSingle();

      if (existing) {
        const { error } = await apiClient
          .from("app_settings")
          .update({ value: jsonValue })
          .eq("key", "age_verification");
        if (error) throw error;
      } else {
        const { error } = await apiClient
          .from("app_settings")
          .insert([{ key: "age_verification", value: jsonValue, description: "Age verification popup settings" }]);
        if (error) throw error;
      }

      setAgeSettings(newSettings);
      return true;
    } catch (error) {
      console.error("Error updating age settings:", error);
      return false;
    }
  };

  return { ageSettings, loading, updateAgeSettings, DEFAULT_AGE_SETTINGS };
};
