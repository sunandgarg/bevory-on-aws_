import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface GASettings {
  measurementId: string;
  propertyId: string;
  enabled: boolean;
  serviceAccountJson?: string;
}

export interface GAData {
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;
  dailyData: Array<{
    date: string;
    pageViews: number;
    uniqueVisitors: number;
    sessions: number;
  }>;
  topPages: Array<{
    page: string;
    views: number;
  }>;
  trafficSources: Array<{
    source: string;
    sessions: number;
  }>;
}

const DEFAULT_GA_SETTINGS: GASettings = {
  measurementId: '',
  propertyId: '',
  enabled: false,
  serviceAccountJson: '',
};

export const useGoogleAnalytics = () => {
  const [settings, setSettings] = useState<GASettings>(DEFAULT_GA_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'google_analytics')
        .single();

      if (data && !error) {
        setSettings(data.value as unknown as GASettings);
      }
    } catch (error) {
      console.error('Error fetching GA settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: GASettings): Promise<boolean> => {
    setSaving(true);
    try {
      // First check if the setting exists
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'google_analytics')
        .single();

      const valueAsJson = newSettings as unknown as Json;

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('app_settings')
          .update({
            value: valueAsJson,
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'google_analytics');

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('app_settings')
          .insert([{
            key: 'google_analytics',
            value: valueAsJson,
            description: 'Google Analytics 4 configuration',
          }]);

        if (error) throw error;
      }

      setSettings(newSettings);
      return true;
    } catch (error) {
      console.error('Error saving GA settings:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const fetchAnalyticsData = async (startDate: string, endDate: string): Promise<GAData | null> => {
    if (!settings.enabled || !settings.propertyId) {
      return null;
    }

    try {
      // SECURITY: Service account is now stored server-side only, not sent from client
      const { data, error } = await supabase.functions.invoke('google-analytics', {
        body: {
          propertyId: settings.propertyId,
          startDate,
          endDate,
        },
      });

      if (error) throw error;
      return data as GAData;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return null;
    }
  };

  const hasServiceAccount = !!settings.serviceAccountJson;

  return {
    settings,
    loading,
    saving,
    updateSettings,
    fetchAnalyticsData,
    isConfigured: settings.enabled && !!settings.propertyId && hasServiceAccount,
    hasServiceAccount,
  };
};
