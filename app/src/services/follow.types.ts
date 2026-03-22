/**
 * Follow Types - 关注关系类型定义
 *
 * 定义用户关注关系相关的所有类型
 */

/**
 * 关注关系接口
 */
export interface FollowRelation {
  /** 关注者 ID */
  followerId: number;
  /** 被关注者 ID */
  followingId: number;
  /** 关注时间 */
  createdAt: number;
}

/**
 * 用户关注状态
 */
export interface FollowStatus {
  /** 用户 ID */
  userId: number;
  /** 用户名 */
  username: string;
  /** 头像 */
  avatar?: string;
  /** 简介 */
  bio?: string;
  /** 是否已关注 */
  isFollowing: boolean;
  /** 是否互关 */
  isMutual: boolean;
  /** 粉丝数 */
  followerCount: number;
  /** 关注数 */
  followingCount: number;
  /** 动态数 */
  momentCount?: number;
}

/**
 * 关注列表参数
 */
export interface GetFollowListParams {
  /** 用户 ID */
  userId: number;
  /** 列表类型 */
  type: 'followers' | 'following';
  /** 页码 */
  page?: number;
  /** 每页数量 */
  limit?: number;
}

/**
 * 关注列表结果
 */
export interface FollowListResult {
  /** 用户列表 */
  users: FollowStatus[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 是否有更多 */
  hasMore: boolean;
}

/**
 * 关注服务响应类型
 */
export interface FollowServiceResponse<T> {
  /** 是否成功 */
  success: boolean;
  /** 数据 */
  data?: T;
  /** 错误信息 */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  /** 时间戳 */
  timestamp: number;
}

/**
 * 好友（互关用户）
 */
export interface Friend {
  /** 用户 ID */
  userId: number;
  /** 用户名 */
  username: string;
  /** 头像 */
  avatar?: string;
  /** 简介 */
  bio?: string;
  /** 最后活跃时间 */
  lastActiveAt?: number;
  /** 是否在线 */
  isOnline?: boolean;
}

/**
 * 关注统计
 */
export interface FollowStats {
  /** 用户 ID */
  userId: number;
  /** 粉丝数 */
  followerCount: number;
  /** 关注数 */
  followingCount: number;
  /** 好友数（互关） */
  friendCount: number;
}