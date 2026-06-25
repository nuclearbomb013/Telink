/**
 * Moment Service - 动态服务
 *
 * Provides CRUD, like, and comment operations for moments.
 * NOW BACKED BY REAL BACKEND API (no more localStorage).
 */

import type {
  Moment,
  CreateMomentData,
  UpdateMomentData,
  GetMomentsParams,
  MomentListResult,
  MomentComment,
  MomentServiceResponse,
} from './moment.types';
import {
  momentApi,
  type MomentData,
} from '@/lib/apiClient';

/**
 * Convert backend snake_case moment to frontend camelCase Moment.
 */
function transformMoment(raw: MomentData): Moment {
  return {
    id: raw.id,
    authorId: raw.author_id,
    authorName: raw.author_name,
    authorAvatar: raw.author_avatar,
    content: raw.content,
    contentType: (raw.content_type as Moment['contentType']) || 'text',
    images: raw.images?.map((img, i) => ({
      id: i,
      url: img.url,
      caption: img.alt,
    })),
    codeSnippet: raw.code_snippet ? {
      language: raw.code_snippet.language,
      code: raw.code_snippet.code,
      filename: raw.code_snippet.filename,
    } : undefined,
    visibility: (raw.visibility as Moment['visibility']) || 'public',
    likes: raw.likes,
    commentCount: raw.comment_count,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at ?? undefined,
    location: raw.location ?? undefined,
    isLiked: raw.is_liked,
  };
}

/**
 * Convert frontend create data to backend API format.
 */
function toApiCreateData(data: CreateMomentData) {
  return {
    content: data.content,
    content_type: data.contentType,
    visibility: data.visibility,
    code_snippet: data.codeSnippet ? {
      filename: data.codeSnippet.filename || '',
      language: data.codeSnippet.language,
      code: data.codeSnippet.code,
    } : undefined,
    images: data.images?.map(img => ({ url: img.url, alt: img.caption || '' })),
    location: data.location,
  };
}

/**
 * MomentService class - wraps the backend API with a clean frontend interface.
 */
class MomentService {
  /**
   * Get a paginated list of moments.
   */
  async getMoments(
    params: GetMomentsParams = {}
  ): Promise<MomentServiceResponse<MomentListResult>> {
    try {
      const response = await momentApi.getMoments({
        page: params.page,
        limit: params.limit,
        sort_by: params.sortBy,
        user_id: params.userId,
        following_only: params.followingOnly,
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'FETCH_ERROR', message: 'Failed to fetch moments' },
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        data: {
          moments: response.data.moments.map(transformMoment),
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          hasMore: response.data.has_more,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch moments',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get a single moment by ID. Uses the dedicated GET /moments/{id} endpoint.
   */
  async getMomentById(
    id: number,
    _currentUserId?: number
  ): Promise<MomentServiceResponse<Moment>> {
    try {
      const response = await momentApi.getMomentById(id);
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'NOT_FOUND', message: 'Moment not found' },
          timestamp: Date.now(),
        };
      }
      return { success: true, data: transformMoment(response.data), timestamp: Date.now() };
    } catch (error) {
      return {
        success: false,
        error: { code: 'FETCH_ERROR', message: error instanceof Error ? error.message : 'Failed' },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Create a new moment.
   */
  async createMoment(
    data: CreateMomentData,
    _authorId: number,
    _authorName: string,
    _authorAvatar?: string
  ): Promise<MomentServiceResponse<Moment>> {
    try {
      if (!data.content.trim()) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Content is required' }, timestamp: Date.now() };
      }

      const response = await momentApi.createMoment(toApiCreateData(data));

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'CREATE_ERROR', message: 'Failed to create moment' },
          timestamp: Date.now(),
        };
      }

      return { success: true, data: transformMoment(response.data), timestamp: Date.now() };
    } catch (error) {
      return {
        success: false,
        error: { code: 'CREATE_ERROR', message: error instanceof Error ? error.message : 'Failed' },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Update a moment.
   */
  async updateMoment(data: UpdateMomentData): Promise<MomentServiceResponse<Moment>> {
    try {
      const updateBody: Record<string, unknown> = {};
      if (data.content !== undefined) updateBody.content = data.content;
      if (data.contentType !== undefined) updateBody.content_type = data.contentType;
      if (data.visibility !== undefined) updateBody.visibility = data.visibility;
      if (data.codeSnippet !== undefined) updateBody.code_snippet = {
        filename: data.codeSnippet.filename || '',
        language: data.codeSnippet.language,
        code: data.codeSnippet.code,
      };
      if (data.images !== undefined) updateBody.images = data.images.map(img => ({ url: img.url, alt: img.caption || '' }));
      if (data.location !== undefined) updateBody.location = data.location;
      const response = await momentApi.updateMoment(data.id, updateBody);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'UPDATE_ERROR', message: 'Failed to update moment' },
          timestamp: Date.now(),
        };
      }

      return { success: true, data: transformMoment(response.data), timestamp: Date.now() };
    } catch (error) {
      return {
        success: false,
        error: { code: 'UPDATE_ERROR', message: error instanceof Error ? error.message : 'Failed' },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Delete a moment (soft delete).
   */
  async deleteMoment(id: number, _userId: number): Promise<MomentServiceResponse<void>> {
    try {
      const response = await momentApi.deleteMoment(id);

      if (!response.success) {
        return {
          success: false,
          error: response.error || { code: 'DELETE_ERROR', message: 'Failed to delete moment' },
          timestamp: Date.now(),
        };
      }

      return { success: true, timestamp: Date.now() };
    } catch (error) {
      return {
        success: false,
        error: { code: 'DELETE_ERROR', message: error instanceof Error ? error.message : 'Failed' },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Like a moment. Idempotent — no-op if already liked.
   */
  async like(
    momentId: number,
  ): Promise<MomentServiceResponse<{ liked: boolean; likes: number }>> {
    try {
      const response = await momentApi.like(momentId);
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'LIKE_ERROR', message: 'Like operation failed' },
          timestamp: Date.now(),
        };
      }
      return { success: true, data: response.data, timestamp: Date.now() };
    } catch (error) {
      return {
        success: false,
        error: { code: 'LIKE_ERROR', message: error instanceof Error ? error.message : 'Failed' },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Unlike a moment. Idempotent — no-op if not liked.
   */
  async unlike(
    momentId: number,
  ): Promise<MomentServiceResponse<{ liked: boolean; likes: number }>> {
    try {
      const response = await momentApi.unlike(momentId);
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'LIKE_ERROR', message: 'Unlike operation failed' },
          timestamp: Date.now(),
        };
      }
      return { success: true, data: response.data, timestamp: Date.now() };
    } catch (error) {
      return {
        success: false,
        error: { code: 'LIKE_ERROR', message: error instanceof Error ? error.message : 'Failed' },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Toggle like on a moment.
   * @param momentId - Moment ID
   * @param _userId - (unused, kept for backward compatibility)
   * @param isLiked - Whether the moment is currently liked by the user
   */
  async toggleLike(
    momentId: number,
    _userId: number,
    isLiked: boolean
  ): Promise<MomentServiceResponse<{ liked: boolean; likes: number }>> {
    if (isLiked) {
      return this.unlike(momentId);
    }
    return this.like(momentId);
  }

  /**
   * Get comments for a moment.
   * Now uses the real backend API.
   */
  async getComments(momentId: number): Promise<MomentServiceResponse<MomentComment[]>> {
    try {
      const response = await momentApi.getComments(momentId);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'FETCH_ERROR', message: 'Failed to fetch comments' },
          timestamp: Date.now(),
        };
      }

      return {
        success: true,
        data: response.data.map((raw: Record<string, unknown>) => ({
          id: raw.id as number,
          momentId: raw.moment_id as number,
          authorId: raw.author_id as number,
          authorName: raw.author_name as string,
          authorAvatar: raw.author_avatar as string | undefined,
          content: raw.content as string,
          likes: (raw.likes as number) || 0,
          createdAt: raw.created_at as number,
          replyToId: raw.reply_to_id as number | undefined,
          replyToName: raw.reply_to_name as string | undefined,
          isLiked: (raw.is_liked as boolean) || false,
        })),
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'FETCH_ERROR', message: error instanceof Error ? error.message : 'Failed' },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Add a comment to a moment.
   */
  async addComment(
    momentId: number,
    content: string,
    _authorId: number,
    _authorName: string,
    _authorAvatar?: string,
    replyToId?: number,
    replyToName?: string
  ): Promise<MomentServiceResponse<MomentComment>> {
    try {
      const response = await momentApi.createComment(momentId, {
        content: content.trim(),
        reply_to_id: replyToId,
        reply_to_name: replyToName,
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'CREATE_ERROR', message: 'Failed to add comment' },
          timestamp: Date.now(),
        };
      }

      const raw = response.data as Record<string, unknown>;
      return {
        success: true,
        data: {
          id: raw.id as number,
          momentId: raw.moment_id as number,
          authorId: raw.author_id as number,
          authorName: raw.author_name as string,
          authorAvatar: raw.author_avatar as string | undefined,
          content: raw.content as string,
          likes: (raw.likes as number) || 0,
          createdAt: raw.created_at as number,
          replyToId: raw.reply_to_id as number | undefined,
          replyToName: raw.reply_to_name as string | undefined,
          isLiked: false,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'CREATE_ERROR', message: error instanceof Error ? error.message : 'Failed' },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Delete a comment.
   */
  async deleteComment(commentId: number, _userId: number, momentId: number): Promise<MomentServiceResponse<void>> {
    try {
      const response = await momentApi.deleteComment(momentId, commentId);

      if (!response.success) {
        return {
          success: false,
          error: response.error || { code: 'DELETE_ERROR', message: 'Failed to delete comment' },
          timestamp: Date.now(),
        };
      }

      return { success: true, timestamp: Date.now() };
    } catch (error) {
      return {
        success: false,
        error: { code: 'DELETE_ERROR', message: error instanceof Error ? error.message : 'Failed' },
        timestamp: Date.now(),
      };
    }
  }
}

/**
 * Export singleton instance.
 */
export const momentService = new MomentService();
