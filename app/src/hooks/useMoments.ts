/**
 * useMoments - 动态状态管理 Hook
 *
 * 提供动态列表、发布、点赞、删除等功能的统一接口
 */

import { useState, useEffect, useCallback } from 'react';
import { momentService } from '@/services/moment.service';
import { followService } from '@/services/follow.service';
import type {
  Moment,
  GetMomentsParams,
  CreateMomentData,
  MomentServiceResponse,
} from '@/services/moment.types';

/**
 * useMoments Hook 返回值
 */
interface UseMomentsReturn {
  // 状态
  /** 动态列表 */
  moments: Moment[];
  /** 是否有更多 */
  hasMore: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否正在加载更多 */
  isLoadingMore: boolean;
  /** 错误信息 */
  error: string | null;
  /** 总数 */
  total: number;

  // 方法
  /** 加载更多 */
  loadMore: () => Promise<void>;
  /** 刷新列表 */
  refresh: () => Promise<void>;
  /** 发布动态 */
  createMoment: (data: CreateMomentData, authorId: number, authorName: string, authorAvatar?: string) => Promise<MomentServiceResponse<Moment>>;
  /** 点赞 */
  toggleLike: (momentId: number, userId: number) => Promise<void>;
  /** 删除动态 */
  deleteMoment: (momentId: number, userId: number) => Promise<boolean>;
  /** 清除错误 */
  clearError: () => void;
}

/**
 * useMoments Hook 参数
 */
interface UseMomentsParams {
  /** 当前用户 ID */
  currentUserId?: number;
  /** 查看特定用户的动态 */
  targetUserId?: number;
  /** 是否只看关注的人 */
  followingOnly?: boolean;
  /** 排序方式 */
  sortBy?: 'newest' | 'popular';
  /** 每页数量 */
  limit?: number;
}

/**
 * useMoments Hook
 *
 * @example
 * ```tsx
 * const { moments, isLoading, loadMore, createMoment, toggleLike } = useMoments({
 *   currentUserId: 1,
 * });
 *
 * // 发布动态
 * await createMoment({ content: 'Hello!' }, 1, 'User');
 *
 * // 加载更多
 * await loadMore();
 * ```
 */
export function useMoments({
  currentUserId,
  targetUserId,
  followingOnly = false,
  sortBy = 'newest',
  limit = 10,
}: UseMomentsParams = {}): UseMomentsReturn {
  // 状态
  const [moments, setMoments] = useState<Moment[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  /**
   * 获取关注的用户 ID 列表
   */
  const getFollowingIds = useCallback((): number[] => {
    if (!currentUserId) return [];
    return followService.getFollowingIdsSync(currentUserId);
  }, [currentUserId]);

  /**
   * 加载动态列表
   */
  const loadMoments = useCallback(async (pageNum: number, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    const params: GetMomentsParams = {
      page: pageNum,
      limit,
      sortBy,
      userId: targetUserId,
      followingOnly,
    };

    const followingIds = getFollowingIds();

    try {
      const response = await momentService.getMoments(
        params,
        currentUserId,
        followingIds
      );

      if (response.success && response.data) {
        const { moments: newMoments, hasMore: more, total: totalCount } = response.data;

        if (append) {
          setMoments(prev => [...prev, ...newMoments]);
        } else {
          setMoments(newMoments);
        }

        setHasMore(more);
        setTotal(totalCount);
        setPage(pageNum);
      } else {
        setError(response.error?.message || '加载动态失败');
      }
    } catch (err: any) {
      setError(err.message || '加载动态失败');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [currentUserId, targetUserId, followingOnly, sortBy, limit, getFollowingIds]);

  /**
   * 初始化加载
   */
  useEffect(() => {
    loadMoments(1);
  }, [loadMoments]);

  /**
   * 加载更多
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    await loadMoments(page + 1, true);
  }, [isLoadingMore, hasMore, page, loadMoments]);

  /**
   * 刷新列表
   */
  const refresh = useCallback(async () => {
    await loadMoments(1);
  }, [loadMoments]);

  /**
   * 发布动态
   */
  const createMoment = useCallback(
    async (
      data: CreateMomentData,
      authorId: number,
      authorName: string,
      authorAvatar?: string
    ): Promise<MomentServiceResponse<Moment>> => {
      const response = await momentService.createMoment(data, authorId, authorName, authorAvatar);

      if (response.success && response.data) {
        // 添加到列表顶部
        setMoments(prev => [response.data!, ...prev]);
        setTotal(prev => prev + 1);
      }

      return response;
    },
    []
  );

  /**
   * 点赞
   */
  const toggleLike = useCallback(
    async (momentId: number, userId: number) => {
      const response = await momentService.toggleLike(momentId, userId);

      if (response.success && response.data) {
        setMoments(prev =>
          prev.map(m =>
            m.id === momentId
              ? { ...m, isLiked: response.data!.liked, likes: response.data!.likes }
              : m
          )
        );
      }
    },
    []
  );

  /**
   * 删除动态
   */
  const deleteMoment = useCallback(
    async (momentId: number, userId: number): Promise<boolean> => {
      const response = await momentService.deleteMoment(momentId, userId);

      if (response.success) {
        setMoments(prev => prev.filter(m => m.id !== momentId));
        setTotal(prev => Math.max(0, prev - 1));
        return true;
      }

      return false;
    },
    []
  );

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 状态
    moments,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    total,

    // 方法
    loadMore,
    refresh,
    createMoment,
    toggleLike,
    deleteMoment,
    clearError,
  };
}

export default useMoments;