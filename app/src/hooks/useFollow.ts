/**
 * useFollow - 关注状态管理 Hook
 *
 * 提供用户关注状态、关注/取消关注功能的统一接口
 */

import { useState, useEffect, useCallback } from 'react';
import { followService } from '@/services/follow.service';
import type { FollowStats } from '@/services/follow.types';

/**
 * useFollow Hook 返回值
 */
interface UseFollowReturn {
  // 状态
  /** 是否已关注 */
  isFollowing: boolean;
  /** 是否互关 */
  isMutual: boolean;
  /** 关注者数量 */
  followerCount: number;
  /** 正在关注数量 */
  followingCount: number;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;

  // 方法
  /** 关注 */
  follow: () => Promise<{ success: boolean; message?: string }>;
  /** 取消关注 */
  unfollow: () => Promise<{ success: boolean; message?: string }>;
  /** 切换关注状态 */
  toggle: () => Promise<{ success: boolean; message?: string }>;
  /** 刷新状态 */
  refresh: () => Promise<void>;
  /** 清除错误 */
  clearError: () => void;
}

/**
 * useFollow Hook 参数
 */
interface UseFollowParams {
  /** 目标用户 ID */
  targetUserId: number;
  /** 当前用户 ID */
  currentUserId: number | null;
  /** 初始关注状态（可选，用于优化首次渲染） */
  initialIsFollowing?: boolean;
  /** 初始互关状态 */
  initialIsMutual?: boolean;
}

/**
 * useFollow Hook
 *
 * @example
 * ```tsx
 * const { isFollowing, isMutual, follow, unfollow, toggle } = useFollow({
 *   targetUserId: 2,
 *   currentUserId: 1,
 * });
 *
 * // 关注
 * await follow();
 *
 * // 取消关注
 * await unfollow();
 *
 * // 切换
 * await toggle();
 * ```
 */
export function useFollow({
  targetUserId,
  currentUserId,
  initialIsFollowing = false,
  initialIsMutual = false,
}: UseFollowParams): UseFollowReturn {
  // 状态
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isMutual, setIsMutual] = useState(initialIsMutual);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载关注状态
   */
  const loadFollowStatus = useCallback(async () => {
    if (!currentUserId || !targetUserId) {
      setIsLoading(false);
      return;
    }

    // 不能关注自己
    if (currentUserId === targetUserId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await followService.getFollowStatus(targetUserId, currentUserId);

      if (response.success && response.data) {
        setIsFollowing(response.data.isFollowing);
        setIsMutual(response.data.isMutual);
        setFollowerCount(response.data.followerCount);
        setFollowingCount(response.data.followingCount);
      } else {
        setError(response.error?.message || '获取关注状态失败');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '获取关注状态失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId]);

  /**
   * 初始化时加载状态
   */
  useEffect(() => {
    loadFollowStatus();
  }, [loadFollowStatus]);

  /**
   * 关注
   */
  const follow = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    if (!currentUserId) {
      return { success: false, message: '请先登录' };
    }

    if (currentUserId === targetUserId) {
      return { success: false, message: '不能关注自己' };
    }

    if (isFollowing) {
      return { success: false, message: '已经关注了该用户' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await followService.follow(currentUserId, targetUserId);

      if (response.success) {
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);

        // 检查是否变成互关
        const mutual = followService.isMutualSync(currentUserId, targetUserId);
        setIsMutual(mutual);

        return { success: true, message: '关注成功' };
      } else {
        const errorMessage = response.error?.message || '关注失败';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '关注失败';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId, isFollowing]);

  /**
   * 取消关注
   */
  const unfollow = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    if (!currentUserId) {
      return { success: false, message: '请先登录' };
    }

    if (!isFollowing) {
      return { success: false, message: '未关注该用户' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await followService.unfollow(currentUserId, targetUserId);

      if (response.success) {
        setIsFollowing(false);
        setIsMutual(false);
        setFollowerCount(prev => Math.max(0, prev - 1));

        return { success: true, message: '已取消关注' };
      } else {
        const errorMessage = response.error?.message || '取消关注失败';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '取消关注失败';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId, isFollowing]);

  /**
   * 切换关注状态
   */
  const toggle = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    if (isFollowing) {
      return unfollow();
    } else {
      return follow();
    }
  }, [isFollowing, follow, unfollow]);

  /**
   * 刷新状态
   */
  const refresh = useCallback(async () => {
    await loadFollowStatus();
  }, [loadFollowStatus]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 状态
    isFollowing,
    isMutual,
    followerCount,
    followingCount,
    isLoading,
    error,

    // 方法
    follow,
    unfollow,
    toggle,
    refresh,
    clearError,
  };
}

/**
 * 获取用户关注统计（同步版本）
 */
export const getFollowStatsSync = (userId: number): FollowStats => {
  return followService.getStatsSync(userId);
};

/**
 * 检查是否互关（同步版本）
 */
export const isMutualSync = (userId1: number, userId2: number): boolean => {
  return followService.isMutualSync(userId1, userId2);
};

export default useFollow;