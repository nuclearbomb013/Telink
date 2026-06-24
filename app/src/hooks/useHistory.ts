/**
 * useHistory - 浏览历史记录 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { historyService, type HistoryEntry } from '@/services/history.service';
import { useAuth } from '@/hooks/useAuth';

interface UseHistoryReturn {
  history: HistoryEntry[];
  addToHistory: (contentType: string, contentId: number | string, title: string, slug?: string) => void;
  removeFromHistory: (contentType: string, contentId: number | string) => void;
  getHistoryEntry: (contentType: string, contentId: number | string) => HistoryEntry | null;
  updateScrollPosition: (contentType: string, contentId: number | string, scrollY: number) => void;
  clearHistory: () => void;
}

export function useHistory(): UseHistoryReturn {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHistory(historyService.getHistory(user?.id ?? null));
    }, 0);
    return () => clearTimeout(timer);
  }, [user?.id]);

  const addToHistory = useCallback(
    (contentType: string, contentId: number | string, title: string, slug?: string) => {
      historyService.addEntry(user?.id ?? null, {
        content_type: contentType,
        content_id: contentId,
        title,
        slug,
      });
      setHistory(historyService.getHistory(user?.id ?? null));
    },
    [user?.id]
  );

  const removeFromHistory = useCallback(
    (contentType: string, contentId: number | string) => {
      historyService.removeEntry(user?.id ?? null, contentType, contentId);
      setHistory(historyService.getHistory(user?.id ?? null));
    },
    [user?.id]
  );

  const getHistoryEntry = useCallback(
    (contentType: string, contentId: number | string) => {
      return historyService.getEntry(user?.id ?? null, contentType, contentId);
    },
    [user?.id]
  );

  const updateScrollPosition = useCallback(
    (contentType: string, contentId: number | string, scrollY: number) => {
      historyService.updateScrollPosition(user?.id ?? null, contentType, contentId, scrollY);
      setHistory(historyService.getHistory(user?.id ?? null));
    },
    [user?.id]
  );

  const clearHistory = useCallback(() => {
    historyService.clearHistory(user?.id ?? null);
    setHistory([]);
  }, [user?.id]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    getHistoryEntry,
    updateScrollPosition,
    clearHistory,
  };
}
