import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ReaderPreferences } from '@/services/reader.types';
import { DEFAULT_PREFERENCES, PREFERENCES_STORAGE_KEY } from '@/services/reader.types';
import { ReaderPreferencesContext } from './ReaderPreferencesContext';

function loadPrefs(): ReaderPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const p = JSON.parse(raw);
    return {
      theme: (['warm', 'gray', 'dark'] as const).includes(p.theme) ? p.theme : DEFAULT_PREFERENCES.theme,
      fontFamily: (['sans', 'serif'] as const).includes(p.fontFamily) ? p.fontFamily : DEFAULT_PREFERENCES.fontFamily,
      fontSize: ([16, 18, 20, 22] as const).includes(p.fontSize) ? p.fontSize : DEFAULT_PREFERENCES.fontSize,
      lineHeight: ([1.6, 1.7, 1.85, 2.0] as const).includes(p.lineHeight) ? p.lineHeight : DEFAULT_PREFERENCES.lineHeight,
      contentWidth: ([640, 720, 820] as const).includes(p.contentWidth) ? p.contentWidth : DEFAULT_PREFERENCES.contentWidth,
      codeWrap: typeof p.codeWrap === 'boolean' ? p.codeWrap : DEFAULT_PREFERENCES.codeWrap,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function ReaderPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<ReaderPreferences>(loadPrefs);

  const updatePreference = useCallback(<K extends keyof ReaderPreferences>(key: K, value: ReaderPreferences[K]) => {
    setPreferences(prev => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREFERENCES_STORAGE_KEY) {
        setPreferences(loadPrefs());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <ReaderPreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </ReaderPreferencesContext.Provider>
  );
}
