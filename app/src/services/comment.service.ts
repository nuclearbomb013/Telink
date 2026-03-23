/**
 * Comment Service - 评论/回复服务
 *
 * 提供评论的 CRUD 操作、点赞等功能
 * 连接后端 FastAPI API
 */

import type {
  Comment,
  CreateCommentData,
  UpdateCommentData,
  GetCommentsParams,
  CommentListResult,
  CommentServiceResponse,
} from './comment.types';
import {
  commentApi,
  type Comment as ApiComment,
  type CreateCommentData as ApiCreateCommentData,
} from '@/lib/apiClient';

/**
 * 评论服务类
 */
class CommentService {
  /**
   * 将 API Comment 转换为本地 Comment 格式
   */
  private mapApiCommentToComment(apiComment: ApiComment): Comment {
    return {
      id: apiComment.id,
      postId: apiComment.post_id,
      authorId: apiComment.author_id,
      authorName: apiComment.author_name,
      authorAvatar: apiComment.author_avatar,
      content: apiComment.content,
      likes: apiComment.likes,
      parentId: apiComment.parent_id,
      replyToId: apiComment.reply_to_id,
      replyToName: apiComment.reply_to_name,
      createdAt: apiComment.created_at,
      updatedAt: apiComment.updated_at,
    };
  }

  // ==================== 公开 API ====================

  /**
   * 获取评论列表
   */
  async getComments(
    params: GetCommentsParams
  ): Promise<CommentServiceResponse<CommentListResult>> {
    try {
      const response = await commentApi.getComments(params.postId, {
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'FETCH_ERROR', message: '获取评论失败' },
          timestamp: Date.now(),
        };
      }

      const data = response.data;
      const comments = data.comments.map(this.mapApiCommentToComment);

      return {
        success: true,
        data: {
          comments,
          total: data.total,
          page: data.page,
          limit: data.limit,
          totalPages: data.total_pages,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : '获取评论失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 根据 ID 获取评论
   */
  async getCommentById(_id: number): Promise<CommentServiceResponse<Comment>> {
    try {
      // 通过列表获取（后端没有单独的获取评论接口）
      // 这是一个简化实现，实际可能需要后端支持
      return {
        success: false,
        error: { code: 'NOT_IMPLEMENTED', message: '请使用 getComments 获取评论' },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : '获取评论失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 创建评论
   */
  async createComment(data: CreateCommentData): Promise<CommentServiceResponse<Comment>> {
    try {
      // 验证必填字段
      if (!data.content.trim()) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '内容不能为空' },
          timestamp: Date.now(),
        };
      }

      const apiData: ApiCreateCommentData = {
        post_id: data.postId,
        content: data.content.trim(),
        parent_id: data.parentId,
        reply_to_id: data.replyToId,
        reply_to_name: data.replyToName,
      };

      const response = await commentApi.createComment(apiData);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'CREATE_ERROR', message: '创建评论失败' },
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        data: this.mapApiCommentToComment(response.data),
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : '创建评论失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 更新评论
   */
  async updateComment(data: UpdateCommentData): Promise<CommentServiceResponse<Comment>> {
    try {
      if (!data.content?.trim()) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '内容不能为空' },
          timestamp: Date.now(),
        };
      }

      const response = await commentApi.updateComment(data.id, data.content);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'NOT_FOUND', message: '评论不存在' },
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        data: this.mapApiCommentToComment(response.data),
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : '更新评论失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(id: number): Promise<CommentServiceResponse<void>> {
    try {
      const response = await commentApi.deleteComment(id);

      if (!response.success) {
        return {
          success: false,
          error: response.error || { code: 'NOT_FOUND', message: '评论不存在' },
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
          message: error instanceof Error ? error.message : '删除评论失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 切换点赞状态
   */
  async toggleLike(
    commentId: number,
    _userId: number
  ): Promise<CommentServiceResponse<{ liked: boolean }>> {
    try {
      const response = await commentApi.toggleLike(commentId);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'LIKE_ERROR', message: '点赞操作失败' },
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        data: { liked: response.data.liked },
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
   * 获取用户的评论
   */
  async getCommentsByUser(
    _userId: number,
    _limit = 20
  ): Promise<CommentServiceResponse<Comment[]>> {
    try {
      // 后端暂不支持按用户获取评论，返回空列表
      return {
        success: true,
        data: [],
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : '获取用户评论失败',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 统计用户的评论数（同步方法，返回 0）
   */
  countByUser(_userId: number): number {
    // 后端暂不支持，返回 0
    return 0;
  }
}

/**
 * 导出单例
 */
export const commentService = new CommentService();