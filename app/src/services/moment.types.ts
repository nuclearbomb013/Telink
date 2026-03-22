/**
 * Moment Types - 动态功能类型定义
 *
 * 定义动态（朋友圈）相关的所有类型
 */

/**
 * 动态可见性
 * - public: 公开，所有人可见
 * - followers: 仅关注者可见
 * - private: 仅自己可见
 */
export type MomentVisibility = 'public' | 'followers' | 'private';

/**
 * 动态内容类型
 * - text: 纯文字
 * - image: 图文
 * - code: 代码片段
 * - mixed: 混合类型
 */
export type MomentContentType = 'text' | 'image' | 'code' | 'mixed';

/**
 * 动态图片
 */
export interface MomentImage {
  /** 图片 ID */
  id: number;
  /** 图片 URL */
  url: string;
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
  /** 图片说明 */
  caption?: string;
  /** 排序 */
  sortOrder?: number;
}

/**
 * 代码片段
 */
export interface CodeSnippet {
  /** 编程语言 */
  language: string;
  /** 代码内容 */
  code: string;
  /** 文件名 */
  filename?: string;
  /** 行数 */
  lineCount?: number;
}

/**
 * 动态接口
 */
export interface Moment {
  /** 动态 ID */
  id: number;
  /** 作者 ID */
  authorId: number;
  /** 作者名称 */
  authorName: string;
  /** 作者头像 */
  authorAvatar?: string;
  /** 动态内容 */
  content: string;
  /** 内容类型 */
  contentType: MomentContentType;
  /** 图片列表 */
  images?: MomentImage[];
  /** 代码片段 */
  codeSnippet?: CodeSnippet;
  /** 可见性 */
  visibility: MomentVisibility;
  /** 点赞数 */
  likes: number;
  /** 评论数 */
  commentCount: number;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt?: number;
  /** 是否已删除 */
  isDeleted?: boolean;
  /** 位置信息 */
  location?: string;
  /** 当前用户是否已点赞 */
  isLiked?: boolean;
}

/**
 * 创建动态数据
 */
export interface CreateMomentData {
  /** 动态内容 */
  content: string;
  /** 内容类型 */
  contentType?: MomentContentType;
  /** 图片列表 */
  images?: MomentImage[];
  /** 代码片段 */
  codeSnippet?: CodeSnippet;
  /** 可见性 */
  visibility?: MomentVisibility;
  /** 位置信息 */
  location?: string;
}

/**
 * 更新动态数据
 */
export interface UpdateMomentData extends Partial<CreateMomentData> {
  /** 动态 ID */
  id: number;
}

/**
 * 动态评论
 */
export interface MomentComment {
  /** 评论 ID */
  id: number;
  /** 动态 ID */
  momentId: number;
  /** 评论者 ID */
  authorId: number;
  /** 评论者名称 */
  authorName: string;
  /** 评论者头像 */
  authorAvatar?: string;
  /** 评论内容 */
  content: string;
  /** 点赞数 */
  likes: number;
  /** 创建时间 */
  createdAt: number;
  /** 回复的评论 ID */
  replyToId?: number;
  /** 回复的用户名 */
  replyToName?: string;
  /** 当前用户是否已点赞 */
  isLiked?: boolean;
}

/**
 * 动态列表查询参数
 */
export interface GetMomentsParams {
  /** 用户 ID（查看特定用户的动态） */
  userId?: number;
  /** 是否只看关注的用户 */
  followingOnly?: boolean;
  /** 排序方式 */
  sortBy?: 'newest' | 'popular';
  /** 页码 */
  page?: number;
  /** 每页数量 */
  limit?: number;
}

/**
 * 动态列表结果
 */
export interface MomentListResult {
  /** 动态列表 */
  moments: Moment[];
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
 * 动态服务响应类型
 */
export interface MomentServiceResponse<T> {
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
 * 动态点赞记录
 */
export interface MomentLike {
  /** 动态 ID */
  momentId: number;
  /** 用户 ID */
  userId: number;
  /** 点赞时间 */
  createdAt: number;
}