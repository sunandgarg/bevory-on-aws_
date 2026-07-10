import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubCategoryDisplaySettings {
  enabled: boolean;
  showOnProductCards: boolean;
  showOnProductDetail: boolean;
  showOnSearch: boolean;
  showEmoji: boolean;
  badgeStyle: "filled" | "outline" | "ghost";
  colorScheme: "accent" | "secondary" | "primary" | "muted";
}

const DEFAULT_SETTINGS: SubCategoryDisplaySettings = {
  enabled: true,
  showOnProductCards: true,
  showOnProductDetail: true,
  showOnSearch: true,
  showEmoji: true,
  badgeStyle: "filled",
  colorScheme: "accent",
};

interface SubCategorySettingsContextType {
  settings: SubCategoryDisplaySettings;
  loading: boolean;
  getBadgeClassName: () => string;
}

const SubCategorySettingsContext = createContext<SubCategorySettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  getBadgeClassName: () => "",
});

export const SubCategorySettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SubCategoryDisplaySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "sub_category_display")
        .maybeSingle();

      if (data?.value) {
        setSettings({ ...DEFAULT_SETTINGS, ...(data.value as unknown as SubCategoryDisplaySettings) });
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const getBadgeClassName = () => {
    const styles: Record<string, Record<string, string>> = {
      filled: {
        accent: "bg-accent text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        primary: "bg-primary text-primary-foreground",
        muted: "bg-muted text-muted-foreground",
      },
      outline: {
        accent: "border-accent text-accent bg-transparent",
        secondary: "border-secondary text-secondary-foreground bg-transparent",
        primary: "border-primary text-primary bg-transparent",
        muted: "border-muted-foreground text-muted-foreground bg-transparent",
      },
      ghost: {
        accent: "bg-accent/10 text-accent border-0",
        secondary: "bg-secondary/50 text-secondary-foreground border-0",
        primary: "bg-primary/10 text-primary border-0",
        muted: "bg-muted/50 text-muted-foreground border-0",
      },
    };
    return styles[settings.badgeStyle]?.[settings.colorScheme] || styles.filled.accent;
  };

  return (
    <SubCategorySettingsContext.Provider value={{ settings, loading, getBadgeClassName }}>
      {children}
    </SubCategorySettingsContext.Provider>
  );
};

export const useSubCategorySettings = () => useContext(SubCategorySettingsContext);

export default useSubCategorySettings;
