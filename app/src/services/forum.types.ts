/**
 * Forum Types - 论坛功能类型定义
 */

/**
 * 论坛帖子分类
 */
export type ForumCategory =
  | 'announce'    // 公告
  | 'general'     // 综合讨论
  | 'help'        // 求助
  | 'showcase'    // 作品展示
  | 'jobs';       // 招聘求职

/**
 * 论坛帖子分类显示名称
 */
export const FORUM_CATEGORY_LABELS: Record<ForumCategory, string> = {
  announce: '公告',
  general: '综合讨论',
  help: '求助',
  showcase: '作品展示',
  jobs: '招聘求职',
};

/**
 * 论坛帖子分类图标
 */
export const FORUM_CATEGORY_ICONS: Record<ForumCategory, string> = {
  announce: '📢',
  general: '💬',
  help: '❓',
  showcase: '✨',
  jobs: '💼',
};

/**
 * 论坛帖子接口
 */
export interface ForumPost {
  id: number;
  title: string;
  slug?: string;
  content: string;
  category: ForumCategory;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  views: number;
  likes: number;
  replyCount: number;
  createdAt: number;
  updatedAt?: number;
  tags?: string[];
  isPinned?: boolean;
  isLocked?: boolean;
  coverImage?: string;
  excerpt?: string;
}

/**
 * 创建帖子数据
 */
export interface CreateForumPostData {
  title: string;
  content: string;
  category: ForumCategory;
  tags?: string[];
  coverImage?: string;
  excerpt?: string;
  authorId?: number;
  authorName?: string;
  authorAvatar?: string;
}

/**
 * 更新帖子数据
 */
export interface UpdateForumPostData extends Partial<CreateForumPostData> {
  id: number;
}

/**
 * 帖子列表查询参数
 */
export interface GetForumPostsParams {
  category?: ForumCategory;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'liked';
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
}

/**
 * 帖子列表结果
 */
export interface ForumPostListResult {
  posts: ForumPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 论坛统计信息
 */
export interface ForumStats {
  totalPosts: number;
  totalReplies: number;
  totalUsers: number;
  postsByCategory: Record<ForumCategory, number>;
  latestPostDate?: number;
  hotPosts: ForumPost[];
}

/**
 * 服务响应类型
 */
export interface ForumServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ForumServiceError;
  timestamp: number;
}

/**
 * 服务错误类型
 */
export interface ForumServiceError {
  code: string;
  message: string;
  details?: unknown;
}
