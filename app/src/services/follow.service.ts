/**
 * Follow Service - 关注服务
 *
 * NOW BACKED BY REAL BACKEND API (no more localStorage mock).
 * All async methods call the backend /follow endpoints.
 *
 * Sync methods are deprecated and return conservative defaults.
 */

import { followApi } from '@/lib/apiClient';
import type {
  FollowRelation,
  FollowStatus,
  GetFollowListParams,
  FollowListResult,
  Friend,
  FollowStats,
  FollowServiceResponse,
} from './follow.types';

// ==================== Response Helpers ====================

function successResponse<T>(data: T): FollowServiceResponse<T> {
  return { success: true, data, timestamp: Date.now() };
}

function errorResponse(code: string, message: string, details?: unknown): FollowServiceResponse<never> {
  return { success: false, error: { code, message, details }, timestamp: Date.now() };
}

// ==================== Async API (Real Backend) ====================

/**
 * Follow a user.
 *
 * IMPORTANT: The `_followerId` parameter is IGNORED — the backend determines
 * the follower from the authenticated session token. The `followerId` in the
 * response may NOT match the caller-provided value. Always use the current
 * user's ID (from auth context) as the authoritative follower identity.
 *
 * @param _followerId - Deprecated, kept for backward compatibility. IGNORED.
 * @param followingId - The user to follow
 */
async function follow(
  _followerId: number,
  followingId: number
): Promise<FollowServiceResponse<FollowRelation>> {
  try {
    const response = await followApi.follow(followingId);
    if (response.success) {
      return successResponse({
        followerId: _followerId,
        followingId,
        createdAt: Date.now(),
      });
    }
    return errorResponse(response.error?.code || 'FOLLOW_ERROR', response.error?.message || 'Follow failed');
  } catch (err) {
    return errorResponse('FOLLOW_ERROR', '关注失败', err);
  }
}

/**
 * Unfollow a user.
 */
async function unfollow(
  _followerId: number,
  followingId: number
): Promise<FollowServiceResponse<void>> {
  try {
    const response = await followApi.unfollow(followingId);
    if (response.success) {
      return successResponse(undefined);
    }
    return errorResponse(response.error?.code || 'UNFOLLOW_ERROR', response.error?.message || 'Unfollow failed');
  } catch (err) {
    return errorResponse('UNFOLLOW_ERROR', '取消关注失败', err);
  }
}

/**
 * Get follow status between current user and target.
 */
async function getFollowStatus(
  targetUserId: number,
  _currentUserId?: number
): Promise<FollowServiceResponse<FollowStatus>> {
  try {
    const response = await followApi.getStatus(targetUserId);
    if (response.success && response.data) {
      return successResponse({
        userId: response.data.user_id,
        username: response.data.username,
        avatar: response.data.avatar,
        bio: response.data.bio,
        isFollowing: response.data.is_following,
        isMutual: response.data.is_mutual,
        followerCount: response.data.follower_count,
        followingCount: response.data.following_count,
      });
    }
    return errorResponse('FETCH_ERROR', '获取关注状态失败');
  } catch (err) {
    return errorResponse('FETCH_ERROR', '获取关注状态失败', err);
  }
}

/**
 * Check if the currently authenticated user and targetUserId are mutual follows.
 * Uses the backend /follow/{targetUserId}/status endpoint which checks the auth session.
 */
async function isMutualWithCurrentUser(targetUserId: number): Promise<boolean> {
  try {
    const response = await followApi.getStatus(targetUserId);
    return response.success && response.data?.is_mutual === true;
  } catch {
    return false;
  }
}

/**
 * Get following list for a user (paginated).
 */
async function getFollowingList(
  params: GetFollowListParams
): Promise<FollowServiceResponse<FollowListResult>> {
  try {
    const response = await followApi.getFollowing(params.userId, {
      page: params.page,
      limit: params.limit,
    });
    if (response.success && response.data) {
      return successResponse({
        users: response.data.users.map(u => ({
          userId: u.id,
          username: u.username,
          avatar: u.avatar,
          bio: u.bio,
          isFollowing: u.is_following,
          isMutual: u.is_mutual,
          followerCount: u.follower_count,
          followingCount: u.following_count,
          momentCount: u.moment_count,
        })),
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        hasMore: response.data.has_more,
      });
    }
    return errorResponse('FETCH_ERROR', '获取关注列表失败');
  } catch (err) {
    return errorResponse('FETCH_ERROR', '获取关注列表失败', err);
  }
}

/**
 * Get followers list for a user (paginated).
 */
async function getFollowersList(
  params: GetFollowListParams
): Promise<FollowServiceResponse<FollowListResult>> {
  try {
    const response = await followApi.getFollowers(params.userId, {
      page: params.page,
      limit: params.limit,
    });
    if (response.success && response.data) {
      return successResponse({
        users: response.data.users.map(u => ({
          userId: u.id,
          username: u.username,
          avatar: u.avatar,
          bio: u.bio,
          isFollowing: u.is_following,
          isMutual: u.is_mutual,
          followerCount: u.follower_count,
          followingCount: u.following_count,
          momentCount: u.moment_count,
        })),
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        hasMore: response.data.has_more,
      });
    }
    return errorResponse('FETCH_ERROR', '获取粉丝列表失败');
  } catch (err) {
    return errorResponse('FETCH_ERROR', '获取粉丝列表失败', err);
  }
}

/**
 * Get mutual follows (friends) for a user.
 */
async function getFriends(
  userId: number
): Promise<FollowServiceResponse<Friend[]>> {
  try {
    const response = await followApi.getFriends(userId, { limit: 100 });
    if (response.success && response.data) {
      return successResponse(
        response.data.users.map(u => ({
          userId: u.id,
          username: u.username,
          avatar: u.avatar,
          bio: u.bio,
          lastActiveAt: undefined,
          isOnline: false,
        }))
      );
    }
    return errorResponse('FETCH_ERROR', '获取好友列表失败');
  } catch (err) {
    return errorResponse('FETCH_ERROR', '获取好友列表失败', err);
  }
}

/**
 * Get follow statistics for a user.
 */
async function getStats(
  userId: number
): Promise<FollowServiceResponse<FollowStats>> {
  try {
    const response = await followApi.getStats(userId);
    if (response.success && response.data) {
      return successResponse({
        userId: response.data.user_id,
        followerCount: response.data.follower_count,
        followingCount: response.data.following_count,
        friendCount: response.data.friend_count,
      });
    }
    return errorResponse('STATS_ERROR', '获取统计信息失败');
  } catch (err) {
    return errorResponse('STATS_ERROR', '获取统计信息失败', err);
  }
}

// ==================== Deprecated Sync Methods ====================

/**
 * @deprecated Use async getFollowStatus() instead.
 * Sync methods cannot work with real backend API. Returns false.
 */
function isMutualSync(_userId1: number, _userId2: number): boolean {
  console.warn('[follow.service] isMutualSync is deprecated. Use async isMutual() instead.');
  return false;
}

/**
 * @deprecated Use async getFollowStatus() instead.
 * Sync methods cannot work with real backend API. Returns false.
 */
function isFollowingSync(_followerId: number, _followingId: number): boolean {
  console.warn('[follow.service] isFollowingSync is deprecated.');
  return false;
}

/**
 * @deprecated Use async getFollowingList() instead.
 * Sync methods cannot work with real backend API. Returns empty array.
 */
function getFollowingIdsSync(_userId: number): number[] {
  console.warn('[follow.service] getFollowingIdsSync is deprecated. Use async getFollowingList() instead.');
  return [];
}

/**
 * @deprecated Use async getFollowingList() with type='following' instead.
 */
function getFollowerIdsSync(_userId: number): number[] {
  console.warn('[follow.service] getFollowerIdsSync is deprecated.');
  return [];
}

/**
 * @deprecated Use async getFriends() instead.
 * Sync methods cannot work with real backend API. Returns empty array.
 */
function getFriendIdsSync(_userId: number): number[] {
  console.warn('[follow.service] getFriendIdsSync is deprecated. Use async getFriends() instead.');
  return [];
}

/**
 * @deprecated Use async getStats() instead.
 * Sync methods cannot work with real backend API. Returns zeroed stats.
 */
function getStatsSync(_userId: number): FollowStats {
  console.warn('[follow.service] getStatsSync is deprecated. Use async getStats() instead.');
  return { userId: _userId, followerCount: 0, followingCount: 0, friendCount: 0 };
}

// ==================== Singleton Export ====================

export const followService = {
  // Real async API
  follow,
  unfollow,
  getFollowStatus,
  isMutualWithCurrentUser,
  getFollowingList,
  getFollowersList,
  getFriends,
  getStats,

  // Deprecated sync stubs (for backward compatibility)
  isMutualSync,
  isFollowingSync,
  getFollowingIdsSync,
  getFollowerIdsSync,
  getFriendIdsSync,
  getStatsSync,
};
