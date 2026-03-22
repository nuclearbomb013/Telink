/**
 * Follow Service - 关注服务
 *
 * 提供用户关注关系的建立、查询、好友列表等功能
 * 当前使用 Mock 数据，预留真实 API 接口
 */

import type {
  FollowRelation,
  FollowStatus,
  GetFollowListParams,
  FollowListResult,
  Friend,
  FollowStats,
  FollowServiceResponse,
} from './follow.types';

/**
 * localStorage 键名
 */
const STORAGE_KEYS = {
  FOLLOWS: 'techink_follows',
  COUNTER: 'techink_follow_counter',
} as const;

/**
 * Mock 初始关注关系数据
 */
const INITIAL_FOLLOWS: FollowRelation[] = [
  // 用户2关注了用户1
  { followerId: 2, followingId: 1, createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000 },
  // 用户3关注了用户1
  { followerId: 3, followingId: 1, createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000 },
  // 用户1关注了用户2
  { followerId: 1, followingId: 2, createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000 },
  // 用户4关注了用户1
  { followerId: 4, followingId: 1, createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000 },
  // 用户5关注了用户1
  { followerId: 5, followingId: 1, createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000 },
  // 用户1关注了用户5
  { followerId: 1, followingId: 5, createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000 },
  // 用户2关注了用户3
  { followerId: 2, followingId: 3, createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000 },
  // 用户3关注了用户2（互关）
  { followerId: 3, followingId: 2, createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000 },
];

/**
 * 关注服务类
 */
class FollowService {
  private follows: FollowRelation[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * 初始化服务
   */
  private async initialize(): Promise<void> {
    await this.loadFollows();
  }

  /**
   * 从 localStorage 加载关注关系
   */
  private async loadFollows(): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FOLLOWS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.follows = parsed;
          return;
        }
      }
      // 首次使用，加载初始数据
      this.follows = [...INITIAL_FOLLOWS];
      this.saveFollows();
    } catch (error) {
      console.warn('加载关注关系失败:', error);
      this.follows = [...INITIAL_FOLLOWS];
    }
  }

  /**
   * 保存关注关系到 localStorage
   */
  private saveFollows(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FOLLOWS, JSON.stringify(this.follows));
    } catch (error) {
      console.warn('保存关注关系失败:', error);
    }
  }

  /**
   * 模拟 API 延迟
   */
  private async simulateDelay(ms = 150): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 创建成功响应
   */
  private successResponse<T>(data: T): FollowServiceResponse<T> {
    return {
      success: true,
      data,
      timestamp: Date.now(),
    };
  }

  /**
   * 创建错误响应
   */
  private errorResponse(
    code: string,
    message: string,
    details?: unknown
  ): FollowServiceResponse<never> {
    return {
      success: false,
      error: { code, message, details },
      timestamp: Date.now(),
    };
  }

  // ==================== 公开 API ====================

  /**
   * 关注用户
   */
  async follow(
    followerId: number,
    followingId: number
  ): Promise<FollowServiceResponse<FollowRelation>> {
    try {
      await this.simulateDelay();

      // 不能关注自己
      if (followerId === followingId) {
        return this.errorResponse('INVALID_ACTION', '不能关注自己');
      }

      // 检查是否已关注
      const existing = this.follows.find(
        f => f.followerId === followerId && f.followingId === followingId
      );
      if (existing) {
        return this.errorResponse('ALREADY_FOLLOWING', '已经关注了该用户');
      }

      const relation: FollowRelation = {
        followerId,
        followingId,
        createdAt: Date.now(),
      };

      this.follows.push(relation);
      this.saveFollows();

      return this.successResponse(relation);
    } catch (error) {
      return this.errorResponse(
        'FOLLOW_ERROR',
        '关注失败',
        error
      );
    }
  }

  /**
   * 取消关注
   */
  async unfollow(
    followerId: number,
    followingId: number
  ): Promise<FollowServiceResponse<void>> {
    try {
      await this.simulateDelay();

      const index = this.follows.findIndex(
        f => f.followerId === followerId && f.followingId === followingId
      );

      if (index === -1) {
        return this.errorResponse('NOT_FOLLOWING', '未关注该用户');
      }

      this.follows.splice(index, 1);
      this.saveFollows();

      return this.successResponse(undefined);
    } catch (error) {
      return this.errorResponse(
        'UNFOLLOW_ERROR',
        '取消关注失败',
        error
      );
    }
  }

  /**
   * 检查关注状态
   */
  async getFollowStatus(
    targetUserId: number,
    currentUserId: number
  ): Promise<FollowServiceResponse<FollowStatus>> {
    try {
      await this.simulateDelay();

      const isFollowing = this.follows.some(
        f => f.followerId === currentUserId && f.followingId === targetUserId
      );

      const isFollowedBy = this.follows.some(
        f => f.followerId === targetUserId && f.followingId === currentUserId
      );

      const isMutual = isFollowing && isFollowedBy;

      const followerCount = this.follows.filter(
        f => f.followingId === targetUserId
      ).length;

      const followingCount = this.follows.filter(
        f => f.followerId === targetUserId
      ).length;

      return this.successResponse({
        userId: targetUserId,
        username: '', // 需要从用户服务获取
        avatar: undefined,
        bio: undefined,
        isFollowing,
        isMutual,
        followerCount,
        followingCount,
      });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取关注状态失败',
        error
      );
    }
  }

  /**
   * 检查是否互关（好友）
   */
  async isMutual(
    userId1: number,
    userId2: number
  ): Promise<boolean> {
    const isFollowing = this.follows.some(
      f => f.followerId === userId1 && f.followingId === userId2
    );
    const isFollowedBy = this.follows.some(
      f => f.followerId === userId2 && f.followingId === userId1
    );
    return isFollowing && isFollowedBy;
  }

  /**
   * 同步检查是否互关
   */
  isMutualSync(userId1: number, userId2: number): boolean {
    const isFollowing = this.follows.some(
      f => f.followerId === userId1 && f.followingId === userId2
    );
    const isFollowedBy = this.follows.some(
      f => f.followerId === userId2 && f.followingId === userId1
    );
    return isFollowing && isFollowedBy;
  }

  /**
   * 检查是否已关注
   */
  isFollowingSync(followerId: number, followingId: number): boolean {
    return this.follows.some(
      f => f.followerId === followerId && f.followingId === followingId
    );
  }

  /**
   * 获取用户关注的人的 ID 列表
   */
  getFollowingIdsSync(userId: number): number[] {
    return this.follows
      .filter(f => f.followerId === userId)
      .map(f => f.followingId);
  }

  /**
   * 获取用户的粉丝 ID 列表
   */
  getFollowerIdsSync(userId: number): number[] {
    return this.follows
      .filter(f => f.followingId === userId)
      .map(f => f.followerId);
  }

  /**
   * 获取好友列表（互关用户）
   */
  async getFriends(
    userId: number
  ): Promise<FollowServiceResponse<Friend[]>> {
    try {
      await this.simulateDelay();

      const followingIds = this.getFollowingIdsSync(userId);
      const followerIds = this.getFollowerIdsSync(userId);

      // 互关用户 ID
      const friendIds = followingIds.filter(id => followerIds.includes(id));

      const friends: Friend[] = friendIds.map(id => ({
        userId: id,
        username: '', // 需要从用户服务获取
        avatar: undefined,
        bio: undefined,
        lastActiveAt: undefined,
        isOnline: false,
      }));

      return this.successResponse(friends);
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取好友列表失败',
        error
      );
    }
  }

  /**
   * 获取好友 ID 列表（同步）
   */
  getFriendIdsSync(userId: number): number[] {
    const followingIds = this.getFollowingIdsSync(userId);
    const followerIds = this.getFollowerIdsSync(userId);
    return followingIds.filter(id => followerIds.includes(id));
  }

  /**
   * 获取关注列表
   */
  async getFollowingList(
    params: GetFollowListParams
  ): Promise<FollowServiceResponse<FollowListResult>> {
    try {
      await this.simulateDelay();

      const followingRelations = this.follows
        .filter(f => f.followerId === params.userId)
        .sort((a, b) => b.createdAt - a.createdAt);

      const followingIds = followingRelations.map(f => f.followingId);

      // 转换为 FollowStatus
      const users: FollowStatus[] = followingIds.map(targetId => {
        const isMutual = this.isMutualSync(params.userId, targetId);
        const followerCount = this.follows.filter(f => f.followingId === targetId).length;
        const followingCount = this.follows.filter(f => f.followerId === targetId).length;

        return {
          userId: targetId,
          username: '',
          avatar: undefined,
          bio: undefined,
          isFollowing: true,
          isMutual,
          followerCount,
          followingCount,
        };
      });

      // 分页
      const page = params.page || 1;
      const limit = params.limit || 20;
      const total = users.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = users.slice(startIndex, endIndex);

      return this.successResponse({
        users: paginatedUsers,
        total,
        page,
        limit,
        hasMore: endIndex < total,
      });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取关注列表失败',
        error
      );
    }
  }

  /**
   * 获取粉丝列表
   */
  async getFollowersList(
    params: GetFollowListParams
  ): Promise<FollowServiceResponse<FollowListResult>> {
    try {
      await this.simulateDelay();

      const followerRelations = this.follows
        .filter(f => f.followingId === params.userId)
        .sort((a, b) => b.createdAt - a.createdAt);

      const followerIds = followerRelations.map(f => f.followerId);

      // 转换为 FollowStatus
      const users: FollowStatus[] = followerIds.map(targetId => {
        const isFollowing = this.isFollowingSync(targetId, params.userId);
        const isMutual = this.isMutualSync(params.userId, targetId);
        const followerCount = this.follows.filter(f => f.followingId === targetId).length;
        const followingCount = this.follows.filter(f => f.followerId === targetId).length;

        return {
          userId: targetId,
          username: '',
          avatar: undefined,
          bio: undefined,
          isFollowing,
          isMutual,
          followerCount,
          followingCount,
        };
      });

      // 分页
      const page = params.page || 1;
      const limit = params.limit || 20;
      const total = users.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = users.slice(startIndex, endIndex);

      return this.successResponse({
        users: paginatedUsers,
        total,
        page,
        limit,
        hasMore: endIndex < total,
      });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取粉丝列表失败',
        error
      );
    }
  }

  /**
   * 获取关注统计
   */
  async getStats(
    userId: number
  ): Promise<FollowServiceResponse<FollowStats>> {
    try {
      await this.simulateDelay();

      const followerCount = this.follows.filter(
        f => f.followingId === userId
      ).length;

      const followingCount = this.follows.filter(
        f => f.followerId === userId
      ).length;

      const friendCount = this.getFriendIdsSync(userId).length;

      return this.successResponse({
        userId,
        followerCount,
        followingCount,
        friendCount,
      });
    } catch (error) {
      return this.errorResponse(
        'STATS_ERROR',
        '获取统计信息失败',
        error
      );
    }
  }

  /**
   * 获取关注统计（同步）
   */
  getStatsSync(userId: number): FollowStats {
    const followerCount = this.follows.filter(
      f => f.followingId === userId
    ).length;

    const followingCount = this.follows.filter(
      f => f.followerId === userId
    ).length;

    const friendCount = this.getFriendIdsSync(userId).length;

    return {
      userId,
      followerCount,
      followingCount,
      friendCount,
    };
  }
}

/**
 * 导出单例
 */
export const followService = new FollowService();