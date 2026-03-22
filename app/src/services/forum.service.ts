/**
 * Forum Service - 论坛帖子服务
 *
 * 提供论坛帖子的 CRUD 操作、搜索、统计等功能
 * 当前使用 Mock 数据，预留真实 API 接口
 */

import type {
  ForumPost,
  ForumCategory,
  CreateForumPostData,
  UpdateForumPostData,
  GetForumPostsParams,
  ForumPostListResult,
  ForumStats,
  ForumServiceResponse,
} from './forum.types';
import { getInitialForumPosts } from './mock-data';

/**
 * localStorage 键名
 */
const STORAGE_KEYS = {
  POSTS: 'techink_forum_posts',
  LIKES: 'techink_forum_likes',
  POST_COUNTER: 'techink_forum_post_counter',
} as const;

/**
 * 论坛服务类
 */
class ForumService {
  private posts: ForumPost[] = [];
  private nextId = 1;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化服务
   */
  private async initialize(): Promise<void> {
    await this.loadPosts();
    this.loadCounter();
  }

  /**
   * 从 localStorage 加载帖子
   */
  private async loadPosts(): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.posts = parsed;
          return;
        }
      }
      // 首次使用，加载初始数据
      this.posts = getInitialForumPosts();
      this.savePosts();
    } catch (error) {
      console.warn('加载论坛帖子失败:', error);
      this.posts = getInitialForumPosts();
    }
  }

  /**
   * 保存帖子到 localStorage
   */
  private savePosts(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(this.posts));
    } catch (error) {
      console.warn('保存论坛帖子失败:', error);
    }
  }

  /**
   * 加载计数器
   */
  private loadCounter(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.POST_COUNTER);
      if (stored) {
        this.nextId = parseInt(stored, 10);
      } else {
        this.nextId = this.posts.length + 1;
      }
    } catch (error) {
      console.warn('加载计数器失败:', error);
      this.nextId = this.posts.length + 1;
    }
  }

  /**
   * 获取下一个 ID
   */
  private getNextId(): number {
    const id = this.nextId++;
    localStorage.setItem(STORAGE_KEYS.POST_COUNTER, this.nextId.toString());
    return id;
  }

  /**
   * 生成 slug
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  }

  /**
   * 模拟 API 延迟
   */
  private async simulateDelay(ms = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 创建成功响应
   */
  private successResponse<T>(data: T): ForumServiceResponse<T> {
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
  ): ForumServiceResponse<never> {
    return {
      success: false,
      error: { code, message, details },
      timestamp: Date.now(),
    };
  }

  // ==================== 公开 API ====================

  /**
   * 获取帖子列表
   */
  async getPosts(
    params: GetForumPostsParams
  ): Promise<ForumServiceResponse<ForumPostListResult>> {
    try {
      await this.simulateDelay();

      let results = [...this.posts];

      // 分类筛选
      if (params.category) {
        results = results.filter(post => post.category === params.category);
      }

      // 搜索
      if (params.search?.trim()) {
        const query = params.search.toLowerCase();
        results = results.filter(
          post =>
            post.title.toLowerCase().includes(query) ||
            post.content.toLowerCase().includes(query) ||
            post.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }

      // 标签筛选
      if (params.tags && params.tags.length > 0) {
        results = results.filter(post =>
          params.tags!.every(tag => post.tags?.includes(tag))
        );
      }

      // 排序
      switch (params.sortBy) {
        case 'newest':
          results.sort((a, b) => b.createdAt - a.createdAt);
          break;
        case 'oldest':
          results.sort((a, b) => a.createdAt - b.createdAt);
          break;
        case 'popular':
          results.sort((a, b) => b.views - a.views);
          break;
        case 'liked':
          results.sort((a, b) => b.likes - a.likes);
          break;
        default:
          // 默认：置顶优先，然后按时间倒序
          results.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.createdAt - a.createdAt;
          });
      }

      // 分页
      const page = params.page || 1;
      const limit = params.limit || 10;
      const total = results.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = results.slice(startIndex, endIndex);

      return this.successResponse({
        posts: paginatedResults,
        total,
        page,
        limit,
        totalPages,
      });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取帖子列表失败',
        error
      );
    }
  }

  /**
   * 根据 ID 获取帖子
   */
  async getPostById(
    id: number
  ): Promise<ForumServiceResponse<ForumPost>> {
    try {
      await this.simulateDelay();

      const post = this.posts.find(p => p.id === id);
      if (!post) {
        return this.errorResponse('NOT_FOUND', '帖子不存在');
      }

      // 增加浏览数
      this.incrementViews(id);

      return this.successResponse({ ...post });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取帖子失败',
        error
      );
    }
  }

  /**
   * 根据 slug 获取帖子
   */
  async getPostBySlug(
    slug: string
  ): Promise<ForumServiceResponse<ForumPost>> {
    try {
      await this.simulateDelay();

      const post = this.posts.find(p => p.slug === slug);
      if (!post) {
        return this.errorResponse('NOT_FOUND', '帖子不存在');
      }

      this.incrementViews(post.id);

      return this.successResponse({ ...post });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取帖子失败',
        error
      );
    }
  }

  /**
   * 创建帖子
   */
  async createPost(
    data: CreateForumPostData
  ): Promise<ForumServiceResponse<ForumPost>> {
    try {
      await this.simulateDelay();

      // 验证必填字段
      if (!data.title.trim()) {
        return this.errorResponse('VALIDATION_ERROR', '标题不能为空');
      }
      if (!data.content.trim()) {
        return this.errorResponse('VALIDATION_ERROR', '内容不能为空');
      }

      // 生成 slug
      const slug = this.generateSlug(data.title);
      const slugExists = this.posts.some(p => p.slug === slug);

      // 创建帖子
      const post: ForumPost = {
        id: this.getNextId(),
        title: data.title.trim(),
        slug: slugExists ? `${slug}-${Date.now()}` : slug,
        content: data.content.trim(),
        category: data.category,
        authorId: data.authorId || 1,
        authorName: data.authorName || '匿名用户',
        authorAvatar: data.authorAvatar,
        views: 0,
        likes: 0,
        replyCount: 0,
        createdAt: Date.now(),
        tags: data.tags,
        coverImage: data.coverImage,
        excerpt:
          data.excerpt ||
          data.content.slice(0, 200).replace(/[#*`]/g, '') + '...',
        isPinned: false,
        isLocked: false,
      };

      this.posts.unshift(post);
      this.savePosts();

      return this.successResponse(post);
    } catch (error) {
      return this.errorResponse(
        'CREATE_ERROR',
        '创建帖子失败',
        error
      );
    }
  }

  /**
   * 更新帖子
   */
  async updatePost(
    data: UpdateForumPostData
  ): Promise<ForumServiceResponse<ForumPost>> {
    try {
      await this.simulateDelay();

      const index = this.posts.findIndex(p => p.id === data.id);
      if (index === -1) {
        return this.errorResponse('NOT_FOUND', '帖子不存在');
      }

      // 如果标题更新，重新生成 slug
      let slug = this.posts[index].slug;
      if (data.title) {
        slug = this.generateSlug(data.title);
        const slugExists = this.posts.some(
          p => p.slug === slug && p.id !== data.id
        );
        if (slugExists) {
          slug = `${slug}-${Date.now()}`;
        }
      }

      const updatedPost: ForumPost = {
        ...this.posts[index],
        ...data,
        slug,
        updatedAt: Date.now(),
      };

      this.posts[index] = updatedPost;
      this.savePosts();

      return this.successResponse(updatedPost);
    } catch (error) {
      return this.errorResponse(
        'UPDATE_ERROR',
        '更新帖子失败',
        error
      );
    }
  }

  /**
   * 删除帖子
   */
  async deletePost(id: number): Promise<ForumServiceResponse<void>> {
    try {
      await this.simulateDelay();

      const index = this.posts.findIndex(p => p.id === id);
      if (index === -1) {
        return this.errorResponse('NOT_FOUND', '帖子不存在');
      }

      this.posts.splice(index, 1);
      this.savePosts();

      return this.successResponse(undefined);
    } catch (error) {
      return this.errorResponse(
        'DELETE_ERROR',
        '删除帖子失败',
        error
      );
    }
  }

  /**
   * 增加浏览数
   */
  async incrementViews(id: number): Promise<void> {
    try {
      const post = this.posts.find(p => p.id === id);
      if (post) {
        post.views++;
        this.savePosts();
      }
    } catch (error) {
      console.warn('增加浏览数失败:', error);
    }
  }

  /**
   * 切换点赞状态
   */
  async toggleLike(
    postId: number,
    userId: number
  ): Promise<ForumServiceResponse<{ liked: boolean }>> {
    try {
      await this.simulateDelay();

      const post = this.posts.find(p => p.id === postId);
      if (!post) {
        return this.errorResponse('NOT_FOUND', '帖子不存在');
      }

      // 获取用户点赞记录
      const key = `${STORAGE_KEYS.LIKES}_${userId}`;
      const likedPosts = JSON.parse(localStorage.getItem(key) || '[]');
      const hasLiked = likedPosts.includes(postId);

      if (hasLiked) {
        // 取消点赞
        post.likes--;
        const index = likedPosts.indexOf(postId);
        likedPosts.splice(index, 1);
      } else {
        // 添加点赞
        post.likes++;
        likedPosts.push(postId);
      }

      localStorage.setItem(key, JSON.stringify(likedPosts));
      this.savePosts();

      return this.successResponse({ liked: !hasLiked });
    } catch (error) {
      return this.errorResponse(
        'LIKE_ERROR',
        '点赞操作失败',
        error
      );
    }
  }

  /**
   * 切换置顶状态
   */
  async togglePin(postId: number): Promise<ForumServiceResponse<ForumPost>> {
    try {
      await this.simulateDelay();

      const post = this.posts.find(p => p.id === postId);
      if (!post) {
        return this.errorResponse('NOT_FOUND', '帖子不存在');
      }

      post.isPinned = !post.isPinned;
      this.savePosts();

      return this.successResponse(post);
    } catch (error) {
      return this.errorResponse(
        'PIN_ERROR',
        '置顶操作失败',
        error
      );
    }
  }

  /**
   * 切换锁定状态
   */
  async toggleLock(postId: number): Promise<ForumServiceResponse<ForumPost>> {
    try {
      await this.simulateDelay();

      const post = this.posts.find(p => p.id === postId);
      if (!post) {
        return this.errorResponse('NOT_FOUND', '帖子不存在');
      }

      post.isLocked = !post.isLocked;
      this.savePosts();

      return this.successResponse(post);
    } catch (error) {
      return this.errorResponse(
        'LOCK_ERROR',
        '锁定操作失败',
        error
      );
    }
  }

  /**
   * 增加回复数
   */
  async incrementReplyCount(postId: number): Promise<void> {
    try {
      const post = this.posts.find(p => p.id === postId);
      if (post) {
        post.replyCount++;
        this.savePosts();
      }
    } catch (error) {
      console.warn('增加回复数失败:', error);
    }
  }

  /**
   * 减少回复数
   */
  async decrementReplyCount(postId: number): Promise<void> {
    try {
      const post = this.posts.find(p => p.id === postId);
      if (post && post.replyCount > 0) {
        post.replyCount--;
        this.savePosts();
      }
    } catch (error) {
      console.warn('减少回复数失败:', error);
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<ForumServiceResponse<ForumStats>> {
    try {
      await this.simulateDelay();

      const categoriesByType: Record<ForumCategory, number> = {
        announce: 0,
        general: 0,
        help: 0,
        showcase: 0,
        jobs: 0,
      };

      this.posts.forEach(post => {
        categoriesByType[post.category]++;
      });

      // 获取热门帖子（按点赞排序）
      const hotPosts = [...this.posts]
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 5);

      return this.successResponse({
        totalPosts: this.posts.length,
        totalReplies: this.posts.reduce((sum, p) => sum + p.replyCount, 0),
        totalUsers: new Set(this.posts.map(p => p.authorId)).size,
        postsByCategory: categoriesByType,
        latestPostDate: this.posts.length > 0 ? this.posts[0].createdAt : undefined,
        hotPosts,
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
   * 获取作者的帖子列表
   */
  async getPostsByAuthor(
    authorId: number,
    limit = 10
  ): Promise<ForumServiceResponse<ForumPost[]>> {
    try {
      await this.simulateDelay();

      const posts = this.posts
        .filter(p => p.authorId === authorId)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);

      return this.successResponse(posts);
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取作者帖子失败',
        error
      );
    }
  }
}

/**
 * 导出单例
 */
export const forumService = new ForumService();
