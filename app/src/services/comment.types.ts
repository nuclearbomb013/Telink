/**
 * Comment Types - 评论/回复功能类型定义
 */

/**
 * 评论接口
 */
export interface Comment {
  id: number;
  postId: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  content: string;
  likes: number;
  parentId?: number;
  replyToId?: number;
  replyToName?: string;
  createdAt: number;
  updatedAt?: number;
  /** 嵌套回复列表 (P8-100: 修复回复线程丢失问题) */
  replies?: Comment[];
}

/**
 * 创建评论数据
 */
export interface CreateCommentData {
  postId: number;
  content: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  parentId?: number;
  replyToId?: number;
  replyToName?: string;
}

/**
 * 更新评论数据
 */
export interface UpdateCommentData extends Partial<Pick<CreateCommentData, 'content'>> {
  id: number;
}

/**
 * 评论查询参数
 */
export interface GetCommentsParams {
  postId: number;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'popular';
}

/**
 * 评论列表结果
 */
export interface CommentListResult {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 服务响应类型（与 forum.types.ts 保持一致）
 */
export interface CommentServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: CommentServiceError;
  timestamp: number;
}

/**
 * 服务错误类型
 */
export interface CommentServiceError {
  code: string;
  message: string;
  details?: unknown;
}
