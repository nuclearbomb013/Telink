/**
 * 文章数据Hook
 *
 * 提供文章数据的统一状态管理，包括加载、搜索、筛选等功能。
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { articleService } from '@/services/articles.service';
import type {
  Article,
  SearchArticlesParams,
  ArticleServiceResponse,
} from '@/services/articles.types';

interface UseArticlesOptions {
  /** 初始搜索参数 */
  initialParams?: Partial<SearchArticlesParams>;
  /** 是否自动加载数据 */
  autoLoad?: boolean;
  /** 防抖延迟（毫秒） */
  debounceDelay?: number;
}

interface UseArticlesReturn {
  // 数据状态
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  // 加载状态
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;

  // 搜索参数
  searchParams: SearchArticlesParams;
  searchQuery: string;

  // 操作方法
  search: (query: string, filters?: Partial<SearchArticlesParams>) => Promise<void>;
  loadPage: (pageNumber: number) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;

  // 统计信息
  stats: {
    totalArticles: number;
    totalCategories: number;
    totalAuthors: number;
  } | null;
}

/**
 * 文章数据Hook
 */
const useArticles = ({
  initialParams = {},
  autoLoad = true,
  debounceDelay = 300,
}: UseArticlesOptions = {}): UseArticlesReturn => {
  // 数据状态
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialParams.page || 1);
  const [limit, setLimit] = useState(initialParams.limit || 12);
  const [totalPages, setTotalPages] = useState(0);

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 搜索参数
  const [searchParams, setSearchParams] = useState<SearchArticlesParams>({
    query: '',
    page: initialParams.page || 1,
    limit: initialParams.limit || 12,
    sortBy: 'newest',
    ...initialParams,
  });

  // 统计信息
  const [stats, setStats] = useState<UseArticlesReturn['stats']>(null);

  // 防抖定时器
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 处理服务响应
   */
  const handleServiceResponse = <T,>(
    response: ArticleServiceResponse<T>,
    successCallback: (data: T) => void
  ): boolean => {
    if (response.success && response.data !== undefined) {
      successCallback(response.data);
      setError(null);
      return true;
    } else {
      setError(response.error?.message || '操作失败');
      return false;
    }
  };

  /**
   * 加载统计数据
   */
  const loadStats = useCallback(async () => {
    const response = await articleService.getStats();
    handleServiceResponse(response, (data) => {
      setStats({
        totalArticles: data.totalArticles,
        totalCategories: data.totalCategories,
        totalAuthors: data.totalAuthors,
      });
    });
  }, []);

  /**
   * 执行搜索
   */
  const executeSearch = useCallback(async (params: SearchArticlesParams) => {
    setIsSearching(true);
    setError(null);

    const response = await articleService.searchArticles(params);

    const success = handleServiceResponse(response, (data) => {
      setArticles(data.articles);
      setTotal(data.total);
      setPage(data.page);
      setLimit(data.limit);
      setTotalPages(data.totalPages);
    });

    setIsSearching(false);
    return success;
  }, []);

  /**
   * 搜索文章
   */
  const search = useCallback(async (
    query: string,
    filters?: Partial<SearchArticlesParams>
  ) => {
    // 清除之前的防抖定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 如果查询为空，立即搜索
    if (!query.trim()) {
      const newParams: SearchArticlesParams = {
        ...searchParams,
        query: '',
        page: 1, // 重置到第一页
        ...filters,
      };

      setSearchParams(newParams);
      await executeSearch(newParams);
      return;
    }

    // 使用防抖
    return new Promise<void>((resolve) => {
      debounceTimerRef.current = setTimeout(async () => {
        const newParams: SearchArticlesParams = {
          ...searchParams,
          query,
          page: 1, // 重置到第一页
          ...filters,
        };

        setSearchParams(newParams);
        await executeSearch(newParams);
        resolve();
      }, debounceDelay);
    });
  }, [searchParams, executeSearch, debounceDelay]);

  /**
   * 加载指定页
   */
  const loadPage = useCallback(async (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) {
      return;
    }

    const newParams: SearchArticlesParams = {
      ...searchParams,
      page: pageNumber,
    };

    setSearchParams(newParams);
    await executeSearch(newParams);
  }, [searchParams, totalPages, executeSearch]);

  /**
   * 刷新数据
   */
  const refresh = useCallback(async () => {
    await executeSearch(searchParams);
  }, [searchParams, executeSearch]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 初始化加载
   */
  useEffect(() => {
    if (autoLoad) {
      const init = async () => {
        setIsLoading(true);
        await Promise.all([
          executeSearch(searchParams),
          loadStats(),
        ]);
        setIsLoading(false);
      };

      init();
    }
  }, [autoLoad, executeSearch, loadStats, searchParams]);

  /**
   * 清理防抖定时器
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    // 数据状态
    articles,
    total,
    page,
    limit,
    totalPages,

    // 加载状态
    isLoading,
    isSearching,
    error,

    // 搜索参数
    searchParams,
    searchQuery: searchParams.query || '',

    // 操作方法
    search,
    loadPage,
    refresh,
    clearError,

    // 统计信息
    stats,
  };
};

export default useArticles;