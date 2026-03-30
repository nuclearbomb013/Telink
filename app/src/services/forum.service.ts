/**
 * Forum Service - 论坛帖子服务
 *
 * 提供论坛帖子的 CRUD 操作、搜索、统计等功能
 * 连接后端 FastAPI API
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
import {
  forumApi,
  type Post,
  type PostListResult,
  type CreatePostData,
} from '@/lib/apiClient';

/**
 * 论坛服务类
 */
class ForumService {
  /**
   * 将 API Post 转换为本地 ForumPost 格式
   */
  private mapApiPostToForumPost(apiPost: Post): ForumPost {
    return {
      id: apiPost.id,
      title: apiPost.title,
      slug: apiPost.slug,
      content: apiPost.content,
      category: apiPost.category as ForumCategory,
      authorId: apiPost.authorId,
      authorName: apiPost.authorName,
      authorAvatar: apiPost.authorAvatar,
      views: apiPost.views,
      likes: apiPost.likes,
      replyCount: apiPost.replyCount,
      createdAt: apiPost.createdAt,
      updatedAt: apiPost.updatedAt,
      tags: apiPost.tags,
      isPinned: apiPost.isPinned,
      isLocked: apiPost.isLocked,
      coverImage: apiPost.coverImage,
      excerpt: apiPost.excerpt,
    };
  }

  /**
   * 将本地 CreateForumPostData 转换为 API CreatePostData
   */
  private mapCreateDataToApi(data: CreateForumPostData): CreatePostData {
    return {
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags,
      coverImage: data.coverImage,
      excerpt: data.excerpt,
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
      const response = await forumApi.getPosts({
        category: params.category,
        sortBy: params.sortBy,
        page: params.page,
        limit: params.limit,
        search: params.search,
        tags: params.tags?.join(','),
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'FETCH_ERROR', message: '获取帖子列表失败' },
          timestamp: Date.now(),
        };
      }

      const data: PostListResult = response.data;
      const posts = data.posts.map(this.mapApiPostToForumPost);

      return {
        success: true,
        data: {
          posts,
          total: data.total,
          page: data.page,
          limit: data.limit,
          totalPages: data.totalPages,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : '获取帖子列表失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 根据 ID 获取帖子
   */
  async getPostById(id: number): Promise<ForumServiceResponse<ForumPost>> {
    try {
      const response = await forumApi.getPostById(id);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'NOT_FOUND', message: '帖子不存在' },
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        data: this.mapApiPostToForumPost(response.data),
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : '获取帖子失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 根据 slug 获取帖子
   */
  async getPostBySlug(slug: string): Promise<ForumServiceResponse<ForumPost>> {
    try {
      const response = await forumApi.getPostBySlug(slug);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'NOT_FOUND', message: '帖子不存在' },
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        data: this.mapApiPostToForumPost(response.data),
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : '获取帖子失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 创建帖子
   */
  async createPost(data: CreateForumPostData): Promise<ForumServiceResponse<ForumPost>> {
    try {
      // 验证必填字段
      if (!data.title.trim()) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '标题不能为空' },
          timestamp: Date.now(),
        };
      }
      if (!data.content.trim()) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '内容不能为空' },
          timestamp: Date.now(),
        };
      }

      const response = await forumApi.createPost(this.mapCreateDataToApi(data));

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'CREATE_ERROR', message: '创建帖子失败' },
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        data: this.mapApiPostToForumPost(response.data),
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : '创建帖子失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 更新帖子
   */
  async updatePost(data: UpdateForumPostData): Promise<ForumServiceResponse<ForumPost>> {
    try {
      const updateData: Partial<CreatePostData> = {};
      if (data.title) updateData.title = data.title;
      if (data.content) updateData.content = data.content;
      if (data.category) updateData.category = data.category;
      if (data.tags) updateData.tags = data.tags;
      if (data.coverImage) updateData.coverImage = data.coverImage;
      if (data.excerpt) updateData.excerpt = data.excerpt;

      const response = await forumApi.updatePost(data.id, updateData);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'NOT_FOUND', message: '帖子不存在' },
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        data: this.mapApiPostToForumPost(response.data),
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : '更新帖子失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 删除帖子
   */
  async deletePost(id: number): Promise<ForumServiceResponse<void>> {
    try {
      const response = await forumApi.deletePost(id);

      if (!response.success) {
        return {
          success: false,
          error: response.error || { code: 'NOT_FOUND', message: '帖子不存在' },
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        data: undefined,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : '删除帖子失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 增加浏览数（后端自动处理，此方法保留以兼容）
   */
  async incrementViews(_id: number): Promise<void> {
    // 后端在获取帖子详情时自动增加浏览数
    // 此方法保留以保持 API 兼容性
  }

  /**
   * 切换点赞状态
   */
  async toggleLike(
    postId: number,
    _userId: number
  ): Promise<ForumServiceResponse<{ liked: boolean; likes: number }>> {
    try {
      const response = await forumApi.toggleLike(postId);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'LIKE_ERROR', message: '点赞操作失败' },
          timestamp: Date.now(),
        };
      }

      // P10-114: Return full response with likes count
      return {
        success: true,
        data: { liked: response.data.liked, likes: response.data.likes },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LIKE_ERROR',
          message: error instanceof Error ? error.message : '点赞操作失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 切换置顶状态
   */
  async togglePin(postId: number): Promise<ForumServiceResponse<{ isPinned: boolean }>> {
    try {
      const response = await forumApi.togglePin(postId);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'PIN_ERROR', message: '置顶操作失败' },
          timestamp: Date.now(),
        };
      }

      // P9-113: Return the toggle response directly instead of fetching the post
      // This prevents incrementing the view count during pin/lock operations
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PIN_ERROR',
          message: error instanceof Error ? error.message : '置顶操作失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 切换锁定状态
   */
  async toggleLock(postId: number): Promise<ForumServiceResponse<{ isLocked: boolean }>> {
    try {
      const response = await forumApi.toggleLock(postId);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'LOCK_ERROR', message: '锁定操作失败' },
          timestamp: Date.now(),
        };
      }

      // P9-113: Return the toggle response directly instead of fetching the post
      // This prevents incrementing the view count during pin/lock operations
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LOCK_ERROR',
          message: error instanceof Error ? error.message : '锁定操作失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 增加回复数（后端自动处理，此方法保留以兼容）
   */
  async incrementReplyCount(_postId: number): Promise<void> {
    // 后端在创建评论时自动增加回复数
  }

  /**
   * 减少回复数（后端自动处理，此方法保留以兼容）
   */
  async decrementReplyCount(_postId: number): Promise<void> {
    // 后端在删除评论时自动减少回复数
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<ForumServiceResponse<ForumStats>> {
    try {
      const response = await forumApi.getStats();

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'STATS_ERROR', message: '获取统计信息失败' },
          timestamp: Date.now(),
        };
      }

      const data = response.data;
      const postsByCategory: Record<ForumCategory, number> = {
        announce: data.postsByCategory?.announce || 0,
        general: data.postsByCategory?.general || 0,
        help: data.postsByCategory?.help || 0,
        showcase: data.postsByCategory?.showcase || 0,
        jobs: data.postsByCategory?.jobs || 0,
      };

      // 获取热门帖子
      const hotPostsResponse = await this.getPosts({
        sortBy: 'liked',
        limit: 5,
      });

      return {
        success: true,
        data: {
          totalPosts: data.totalPosts,
          totalReplies: data.totalReplies,
          totalUsers: data.totalUsers,
          postsByCategory,
          hotPosts: hotPostsResponse.success && hotPostsResponse.data
            ? hotPostsResponse.data.posts
            : [],
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: error instanceof Error ? error.message : '获取统计信息失败',
        },
        timestamp: Date.now(),
      };
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
      // 使用搜索功能按作者筛选
      const response = await this.getPosts({
        limit,
        sortBy: 'newest',
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error,
          timestamp: Date.now(),
        };
      }

      // 过滤出该作者的帖子
      const authorPosts = response.data.posts.filter(post => post.authorId === authorId);

      return {
        success: true,
        data: authorPosts,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : '获取作者帖子失败',
        },
        timestamp: Date.now(),
      };
    }
  }
}

/**
 * 导出单例
 */
export const forumService = new ForumService();
