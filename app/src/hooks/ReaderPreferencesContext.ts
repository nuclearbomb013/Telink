import { createContext, useContext } from 'react';
import type { ReaderPreferences } from '@/services/reader.types';

export interface ReaderPreferencesContextValue {
  preferences: ReaderPreferences;
  updatePreference: <K extends keyof ReaderPreferences>(key: K, value: ReaderPreferences[K]) => void;
}

export const ReaderPreferencesContext = createContext<ReaderPreferencesContextValue | null>(null);

export function useReaderPreferencesContext(): ReaderPreferencesContextValue {
  const ctx = useContext(ReaderPreferencesContext);
  if (!ctx) throw new Error('useReaderPreferencesContext must be inside ReaderPreferencesProvider');
  return ctx;
}

export function useOptionalReaderPreferencesContext(): ReaderPreferencesContextValue | null {
  return useContext(ReaderPreferencesContext);
}
