/**
 * Moment Service - 动态服务
 *
 * 提供动态（朋友圈）的 CRUD 操作、点赞、评论等功能
 * 当前使用 Mock 数据，预留真实 API 接口
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

/**
 * localStorage 键名
 */
const STORAGE_KEYS = {
  MOMENTS: 'techink_moments',
  COMMENTS: 'techink_moment_comments',
  LIKES: 'techink_moment_likes',
  COUNTER: 'techink_moment_counter',
} as const;

/**
 * Mock 初始动态数据 (已清空)
 */
const INITIAL_MOMENTS: Moment[] = [];

/**
 * Mock 初始评论数据 (已清空)
 */
const INITIAL_COMMENTS: MomentComment[] = [];

/**
 * 动态服务类
 */
class MomentService {
  private moments: Moment[] = [];
  private comments: MomentComment[] = [];
  private nextMomentId = 1;
  private nextCommentId = 1;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化服务
   */
  private async initialize(): Promise<void> {
    await this.loadMoments();
    await this.loadComments();
    this.loadCounter();
  }

  /**
   * 从 localStorage 加载动态
   */
  private async loadMoments(): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MOMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.moments = parsed;
          return;
        }
      }
      // 首次使用，加载初始数据
      this.moments = [...INITIAL_MOMENTS];
      this.saveMoments();
    } catch (error) {
      console.warn('加载动态失败:', error);
      this.moments = [...INITIAL_MOMENTS];
    }
  }

  /**
   * 保存动态到 localStorage
   */
  private saveMoments(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MOMENTS, JSON.stringify(this.moments));
    } catch (error) {
      console.warn('保存动态失败:', error);
    }
  }

  /**
   * 从 localStorage 加载评论
   */
  private async loadComments(): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.comments = parsed;
          return;
        }
      }
      // 首次使用，加载初始数据
      this.comments = [...INITIAL_COMMENTS];
      this.saveComments();
    } catch (error) {
      console.warn('加载评论失败:', error);
      this.comments = [...INITIAL_COMMENTS];
    }
  }

  /**
   * 保存评论到 localStorage
   */
  private saveComments(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(this.comments));
    } catch (error) {
      console.warn('保存评论失败:', error);
    }
  }

  /**
   * 加载计数器
   */
  private loadCounter(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COUNTER);
      if (stored) {
        const { momentId, commentId } = JSON.parse(stored);
        this.nextMomentId = momentId || this.moments.length + 1;
        this.nextCommentId = commentId || this.comments.length + 1;
      } else {
        this.nextMomentId = Math.max(...this.moments.map(m => m.id), 0) + 1;
        this.nextCommentId = Math.max(...this.comments.map(c => c.id), 0) + 1;
      }
    } catch (error) {
      console.warn('加载计数器失败:', error);
      this.nextMomentId = this.moments.length + 1;
      this.nextCommentId = this.comments.length + 1;
    }
  }

  /**
   * 保存计数器
   */
  private saveCounter(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COUNTER, JSON.stringify({
        momentId: this.nextMomentId,
        commentId: this.nextCommentId,
      }));
    } catch (error) {
      console.warn('保存计数器失败:', error);
    }
  }

  /**
   * 获取下一个动态 ID
   */
  private getNextMomentId(): number {
    const id = this.nextMomentId++;
    this.saveCounter();
    return id;
  }

  /**
   * 获取下一个评论 ID
   */
  private getNextCommentId(): number {
    const id = this.nextCommentId++;
    this.saveCounter();
    return id;
  }

  /**
   * 模拟 API 延迟
   */
  private async simulateDelay(ms = 200): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 创建成功响应
   */
  private successResponse<T>(data: T): MomentServiceResponse<T> {
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
  ): MomentServiceResponse<never> {
    return {
      success: false,
      error: { code, message, details },
      timestamp: Date.now(),
    };
  }

  // ==================== 公开 API ====================

  /**
   * 获取动态列表
   * @param params 查询参数
   * @param currentUserId 当前用户 ID（用于判断可见性和点赞状态）
   * @param followingIds 当前用户关注的用户 ID 列表
   */
  async getMoments(
    params: GetMomentsParams = {},
    currentUserId?: number,
    followingIds: number[] = []
  ): Promise<MomentServiceResponse<MomentListResult>> {
    try {
      await this.simulateDelay();

      let results = [...this.moments];

      // 过滤已删除的动态
      results = results.filter(m => !m.isDeleted);

      // 可见性过滤
      results = results.filter(m => {
        // 公开动态可见
        if (m.visibility === 'public') return true;
        // 仅关注者可见
        if (m.visibility === 'followers') {
          // 自己发的动态可见
          if (currentUserId && m.authorId === currentUserId) return true;
          // 关注了作者可见
          return followingIds.includes(m.authorId);
        }
        // 仅自己可见
        if (m.visibility === 'private') {
          return currentUserId && m.authorId === currentUserId;
        }
        return false;
      });

      // 查看特定用户的动态
      if (params.userId) {
        results = results.filter(m => m.authorId === params.userId);
      }

      // 仅看关注的用户
      if (params.followingOnly && followingIds.length > 0) {
        results = results.filter(m =>
          followingIds.includes(m.authorId) ||
          (currentUserId && m.authorId === currentUserId)
        );
      }

      // 排序
      switch (params.sortBy) {
        case 'popular':
          results.sort((a, b) => b.likes - a.likes);
          break;
        case 'newest':
        default:
          results.sort((a, b) => b.createdAt - a.createdAt);
      }

      // 分页
      const page = params.page || 1;
      const limit = params.limit || 10;
      const total = results.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = results.slice(startIndex, endIndex);

      // 检查点赞状态
      if (currentUserId) {
        const likedMomentIds = this.getUserLikedMoments(currentUserId);
        paginatedResults.forEach(m => {
          m.isLiked = likedMomentIds.includes(m.id);
        });
      }

      return this.successResponse({
        moments: paginatedResults,
        total,
        page,
        limit,
        hasMore: endIndex < total,
      });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取动态列表失败',
        error
      );
    }
  }

  /**
   * 获取单条动态
   */
  async getMomentById(
    id: number,
    currentUserId?: number
  ): Promise<MomentServiceResponse<Moment>> {
    try {
      await this.simulateDelay();

      const moment = this.moments.find(m => m.id === id && !m.isDeleted);
      if (!moment) {
        return this.errorResponse('NOT_FOUND', '动态不存在');
      }

      // 检查点赞状态
      if (currentUserId) {
        const likedMomentIds = this.getUserLikedMoments(currentUserId);
        moment.isLiked = likedMomentIds.includes(moment.id);
      }

      return this.successResponse({ ...moment });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取动态失败',
        error
      );
    }
  }

  /**
   * 创建动态
   */
  async createMoment(
    data: CreateMomentData,
    authorId: number,
    authorName: string,
    authorAvatar?: string
  ): Promise<MomentServiceResponse<Moment>> {
    try {
      await this.simulateDelay();

      // 验证必填字段
      if (!data.content.trim()) {
        return this.errorResponse('VALIDATION_ERROR', '内容不能为空');
      }

      // 确定内容类型
      let contentType = data.contentType;
      if (!contentType) {
        if (data.images && data.images.length > 0 && data.codeSnippet) {
          contentType = 'mixed';
        } else if (data.images && data.images.length > 0) {
          contentType = 'image';
        } else if (data.codeSnippet) {
          contentType = 'code';
        } else {
          contentType = 'text';
        }
      }

      const moment: Moment = {
        id: this.getNextMomentId(),
        authorId,
        authorName,
        authorAvatar,
        content: data.content.trim(),
        contentType,
        images: data.images,
        codeSnippet: data.codeSnippet,
        visibility: data.visibility || 'public',
        likes: 0,
        commentCount: 0,
        createdAt: Date.now(),
        location: data.location,
        isLiked: false,
      };

      this.moments.unshift(moment);
      this.saveMoments();

      return this.successResponse(moment);
    } catch (error) {
      return this.errorResponse(
        'CREATE_ERROR',
        '创建动态失败',
        error
      );
    }
  }

  /**
   * 更新动态
   */
  async updateMoment(
    data: UpdateMomentData
  ): Promise<MomentServiceResponse<Moment>> {
    try {
      await this.simulateDelay();

      const index = this.moments.findIndex(m => m.id === data.id && !m.isDeleted);
      if (index === -1) {
        return this.errorResponse('NOT_FOUND', '动态不存在');
      }

      const updatedMoment: Moment = {
        ...this.moments[index],
        ...data,
        updatedAt: Date.now(),
      };

      this.moments[index] = updatedMoment;
      this.saveMoments();

      return this.successResponse(updatedMoment);
    } catch (error) {
      return this.errorResponse(
        'UPDATE_ERROR',
        '更新动态失败',
        error
      );
    }
  }

  /**
   * 删除动态（软删除）
   */
  async deleteMoment(
    id: number,
    userId: number
  ): Promise<MomentServiceResponse<void>> {
    try {
      await this.simulateDelay();

      const moment = this.moments.find(m => m.id === id && !m.isDeleted);
      if (!moment) {
        return this.errorResponse('NOT_FOUND', '动态不存在');
      }

      // 检查权限
      if (moment.authorId !== userId) {
        return this.errorResponse('FORBIDDEN', '无权删除此动态');
      }

      moment.isDeleted = true;
      this.saveMoments();

      return this.successResponse(undefined);
    } catch (error) {
      return this.errorResponse(
        'DELETE_ERROR',
        '删除动态失败',
        error
      );
    }
  }

  /**
   * 切换点赞状态
   */
  async toggleLike(
    momentId: number,
    userId: number
  ): Promise<MomentServiceResponse<{ liked: boolean; likes: number }>> {
    try {
      await this.simulateDelay();

      const moment = this.moments.find(m => m.id === momentId && !m.isDeleted);
      if (!moment) {
        return this.errorResponse('NOT_FOUND', '动态不存在');
      }

      const likedMomentIds = this.getUserLikedMoments(userId);
      const hasLiked = likedMomentIds.includes(momentId);

      if (hasLiked) {
        // 取消点赞
        moment.likes = Math.max(0, moment.likes - 1);
        this.removeUserLike(momentId, userId);
      } else {
        // 添加点赞
        moment.likes++;
        this.addUserLike(momentId, userId);
      }

      this.saveMoments();

      return this.successResponse({
        liked: !hasLiked,
        likes: moment.likes,
      });
    } catch (error) {
      return this.errorResponse(
        'LIKE_ERROR',
        '点赞操作失败',
        error
      );
    }
  }

  /**
   * 获取动态的评论列表
   */
  async getComments(
    momentId: number
  ): Promise<MomentServiceResponse<MomentComment[]>> {
    try {
      await this.simulateDelay();

      const comments = this.comments
        .filter(c => c.momentId === momentId)
        .sort((a, b) => a.createdAt - b.createdAt);

      return this.successResponse(comments);
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取评论失败',
        error
      );
    }
  }

  /**
   * 添加评论
   */
  async addComment(
    momentId: number,
    content: string,
    authorId: number,
    authorName: string,
    authorAvatar?: string,
    replyToId?: number,
    replyToName?: string
  ): Promise<MomentServiceResponse<MomentComment>> {
    try {
      await this.simulateDelay();

      const moment = this.moments.find(m => m.id === momentId && !m.isDeleted);
      if (!moment) {
        return this.errorResponse('NOT_FOUND', '动态不存在');
      }

      const comment: MomentComment = {
        id: this.getNextCommentId(),
        momentId,
        authorId,
        authorName,
        authorAvatar,
        content: content.trim(),
        likes: 0,
        createdAt: Date.now(),
        replyToId,
        replyToName,
        isLiked: false,
      };

      this.comments.push(comment);
      moment.commentCount++;
      this.saveComments();
      this.saveMoments();

      return this.successResponse(comment);
    } catch (error) {
      return this.errorResponse(
        'CREATE_ERROR',
        '添加评论失败',
        error
      );
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(
    commentId: number,
    userId: number
  ): Promise<MomentServiceResponse<void>> {
    try {
      await this.simulateDelay();

      const commentIndex = this.comments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) {
        return this.errorResponse('NOT_FOUND', '评论不存在');
      }

      const comment = this.comments[commentIndex];

      // 检查权限
      if (comment.authorId !== userId) {
        return this.errorResponse('FORBIDDEN', '无权删除此评论');
      }

      // 更新动态的评论数
      const moment = this.moments.find(m => m.id === comment.momentId);
      if (moment) {
        moment.commentCount = Math.max(0, moment.commentCount - 1);
        this.saveMoments();
      }

      this.comments.splice(commentIndex, 1);
      this.saveComments();

      return this.successResponse(undefined);
    } catch (error) {
      return this.errorResponse(
        'DELETE_ERROR',
        '删除评论失败',
        error
      );
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 获取用户点赞的动态 ID 列表
   */
  private getUserLikedMoments(userId: number): number[] {
    try {
      const key = `${STORAGE_KEYS.LIKES}_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * 添加用户点赞记录
   */
  private addUserLike(momentId: number, userId: number): void {
    try {
      const key = `${STORAGE_KEYS.LIKES}_${userId}`;
      const likedIds = this.getUserLikedMoments(userId);
      if (!likedIds.includes(momentId)) {
        likedIds.push(momentId);
        localStorage.setItem(key, JSON.stringify(likedIds));
      }
    } catch (error) {
      console.warn('添加点赞记录失败:', error);
    }
  }

  /**
   * 移除用户点赞记录
   */
  private removeUserLike(momentId: number, userId: number): void {
    try {
      const key = `${STORAGE_KEYS.LIKES}_${userId}`;
      const likedIds = this.getUserLikedMoments(userId);
      const index = likedIds.indexOf(momentId);
      if (index > -1) {
        likedIds.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(likedIds));
      }
    } catch (error) {
      console.warn('移除点赞记录失败:', error);
    }
  }
}

/**
 * 导出单例
 */
export const momentService = new MomentService();