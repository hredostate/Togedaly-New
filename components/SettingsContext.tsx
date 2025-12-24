
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { getUserSettings, updateUserSettings } from '../services/notificationService';
import type { UserSettings } from '../types';
import { supabase } from '../supabaseClient';

interface SettingsContextType {
  settings: Partial<UserSettings>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Partial<UserSettings> = {
  ui_language: 'en',
  coach_tone: 'playful',
  screen_reader_mode: false,
  high_contrast_mode: false
};

export const SettingsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Initialize from localStorage if available
  const [settings, setSettings] = useState<Partial<UserSettings>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('togedaly_settings');
        if (saved) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.warn('Failed to parse settings from localStorage', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Auth listener to get user ID
    const getUser = async () => {
        // FIX: v1 compatibility wrapper for getUser
        const auth = supabase.auth as any;
        const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
        
       if (user) {
         setUserId(user.id);
       } else {
         setLoading(false);
       }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      getUserSettings(userId).then(s => {
        setSettings(prev => {
          const next = { ...prev, ...s };
          // Cache fresh server data to localStorage
          localStorage.setItem('togedaly_settings', JSON.stringify(next));
          return next;
        });
        setLoading(false);
      });
    }
  }, [userId]);

  // Apply global effects
  useEffect(() => {
    if (settings.high_contrast_mode) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [settings.high_contrast_mode]);

  const update = async (newSettings: Partial<UserSettings>) => {
    // Optimistic update
    setSettings(prev => {
      const next = { ...prev, ...newSettings };
      localStorage.setItem('togedaly_settings', JSON.stringify(next));
      return next;
    });

    if (userId) {
      try {
        await updateUserSettings(userId, newSettings);
      } catch (e) {
        console.error("Failed to save settings", e);
        // Optionally revert local state/storage here if critical
      }
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings: update, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};
