/**
 * useFavorites - 收藏功能 Hook
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { favoritesApi, type FavoriteItem } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';

interface UseFavoritesReturn {
  favorites: FavoriteItem[];
  isLoading: boolean;
  total: number;
  hasMore: boolean;
  loadFavorites: () => Promise<void>;
  loadMore: () => Promise<void>;
  addFavorite: (contentType: string, contentId: number, title?: string) => Promise<boolean>;
  removeFavorite: (favoriteId: number) => Promise<boolean>;
  removeFavoriteByContent: (contentType: string, contentId: number) => Promise<boolean>;
  isFavorited: (contentType: string, contentId: number) => boolean;
  checkFavorite: (contentType: string, contentId: number) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useFavorites(): UseFavoritesReturn {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const loadedRef = useRef(false);

  const fetchPage = useCallback(async (pageNum: number, append = false) => {
    if (!isAuthenticated) return;
    if (!apiClient.getToken()) return;
    setIsLoading(true);
    const response = await favoritesApi.list({ page: pageNum, limit: 20 });
    if (response.success && response.data) {
      if (append) {
        setFavorites(prev => [...prev, ...response.data!.items]);
      } else {
        setFavorites(response.data.items);
      }
      setTotal(response.data.total);
      setPage(pageNum);
    }
    setIsLoading(false);
  }, [isAuthenticated]);

  const loadFavorites = useCallback(async () => {
    await fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    await fetchPage(nextPage, true);
  }, [page, fetchPage]);

  const addFavorite = useCallback(async (contentType: string, contentId: number, title?: string): Promise<boolean> => {
    const response = await favoritesApi.add({ content_type: contentType, content_id: contentId, title });
    if (response.success && response.data) {
      setFavorites(prev => [response.data!, ...prev]);
      setTotal(prev => prev + 1);
      return true;
    }
    return false;
  }, []);

  const removeFavorite = useCallback(async (favoriteId: number): Promise<boolean> => {
    const response = await favoritesApi.remove(favoriteId);
    if (response.success) {
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      setTotal(prev => Math.max(0, prev - 1));
      return true;
    }
    return false;
  }, []);

  const removeFavoriteByContent = useCallback(async (contentType: string, contentId: number): Promise<boolean> => {
    const response = await favoritesApi.removeByContent(contentType, contentId);
    if (response.success) {
      setFavorites(prev => prev.filter(
        f => !(f.content_type === contentType && f.content_id === contentId)
      ));
      setTotal(prev => Math.max(0, prev - 1));
      return true;
    }
    return false;
  }, []);

  const isFavorited = useCallback((contentType: string, contentId: number): boolean => {
    return favorites.some(f => f.content_type === contentType && f.content_id === contentId);
  }, [favorites]);

  const checkFavorite = useCallback(async (contentType: string, contentId: number): Promise<boolean> => {
    const response = await favoritesApi.check(contentType, contentId);
    return response.success && response.data?.favorited === true;
  }, []);

  const refresh = useCallback(async () => {
    loadedRef.current = false;
    await fetchPage(1, false);
  }, [fetchPage]);

  useEffect(() => {
    if (isAuthenticated && !authLoading && apiClient.getToken() && !loadedRef.current) {
      loadedRef.current = true;
      const timer = setTimeout(() => { fetchPage(1, false); }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading, fetchPage]);

  return {
    favorites,
    isLoading,
    total,
    hasMore: favorites.length < total,
    loadFavorites,
    loadMore,
    addFavorite,
    removeFavorite,
    removeFavoriteByContent,
    isFavorited,
    checkFavorite,
    refresh,
  };
}
