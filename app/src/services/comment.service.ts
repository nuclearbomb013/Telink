/**
 * Comment Service - 评论/回复服务
 *
 * 提供评论的 CRUD 操作、点赞等功能
 * 当前使用 Mock 数据，预留真实 API 接口
 */

import type {
  Comment,
  CreateCommentData,
  UpdateCommentData,
  GetCommentsParams,
  CommentListResult,
  CommentServiceResponse,
} from './comment.types';

/**
 * localStorage 键名
 */
const STORAGE_KEYS = {
  COMMENTS: 'techink_forum_comments',
  COMMENT_LIKES: 'techink_comment_likes',
  COMMENT_COUNTER: 'techink_forum_comment_counter',
} as const;

/**
 * Mock 初始数据
 */
const INITIAL_mock_COMMENTS: Comment[] = [
  {
    id: 1,
    postId: 1,
    authorId: 2,
    authorName: 'React 爱好者',
    content: '感谢管理员的详细说明！论坛界面设计很简洁，很喜欢这种 E-ink 风格。',
    likes: 12,
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
  },
  {
    id: 2,
    postId: 1,
    authorId: 3,
    authorName: 'TS 新手',
    content: '终于找到一个高质量的技术论坛了，会经常来交流的！',
    likes: 8,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 3,
    postId: 2,
    authorId: 4,
    authorName: 'Rustacean',
    content: `关于 React 19 的 Actions，我觉得这个设计思路很好。

把数据突变抽象成一个原语，可以让状态管理变得更加可预测。不过确实需要一些时间来适应新的编程模式。

推荐看一下 React 官方的新文档，讲解得很详细。`,
    likes: 15,
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
  },
  {
    id: 4,
    postId: 2,
    authorId: 1,
    authorName: '管理员',
    content: '欢迎大家积极参与讨论！分享你们在项目中实际使用新特性的经验会更有价值。',
    likes: 6,
    parentId: 3,
    replyToId: 3,
    replyToName: 'Rustacean',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000 + 3600000,
  },
  {
    id: 5,
    postId: 3,
    authorId: 5,
    authorName: '前端老手',
    content: `泛型确实是 TS 初学者的一大难点。我用一个简单的例子来解释：

\`\`\`typescript
// 不用泛型 - 需要写多个重载
function identity(arg: number): number;
function identity(arg: string): string;
function identity(arg: any): any {
  return arg;
}

// 使用泛型 - 一个函数搞定
function identity<T>(arg: T): T {
  return arg;
}
\`\`\`

泛型和 any 的区别：
- any 是完全放弃类型检查
- 泛型是在保持类型安全的前提下，提供灵活性`,
    likes: 24,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 6,
    postId: 4,
    authorId: 2,
    authorName: 'React 爱好者',
    content: '工具很实用！已 Star。建议可以添加一个 dry-run 模式，先预览修改结果再执行。',
    likes: 5,
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
];

/**
 * 评论服务类
 */
class CommentService {
  private comments: Comment[] = [];
  private nextId = 1;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化服务
   */
  private async initialize(): Promise<void> {
    await this.loadComments();
    this.loadCounter();
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
      this.comments = [...INITIAL_mock_COMMENTS];
      this.saveComments();
    } catch (error) {
      console.warn('加载评论失败:', error);
      this.comments = [...INITIAL_mock_COMMENTS];
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
      const stored = localStorage.getItem(STORAGE_KEYS.COMMENT_COUNTER);
      if (stored) {
        this.nextId = parseInt(stored, 10);
      } else {
        this.nextId = this.comments.length + 1;
      }
    } catch (error) {
      console.warn('加载计数器失败:', error);
      this.nextId = this.comments.length + 1;
    }
  }

  /**
   * 获取下一个 ID
   */
  private getNextId(): number {
    const id = this.nextId++;
    localStorage.setItem(STORAGE_KEYS.COMMENT_COUNTER, this.nextId.toString());
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
  private successResponse<T>(data: T): CommentServiceResponse<T> {
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
  ): CommentServiceResponse<never> {
    return {
      success: false,
      error: { code, message, details },
      timestamp: Date.now(),
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
      await this.simulateDelay();

      let results = this.comments.filter(c => c.postId === params.postId);

      // 只获取顶级评论（没有 parent 的）
      const topLevelComments = results.filter(c => !c.parentId);

      // 排序
      switch (params.sortBy) {
        case 'newest':
          topLevelComments.sort((a, b) => b.createdAt - a.createdAt);
          break;
        case 'popular':
          topLevelComments.sort((a, b) => b.likes - a.likes);
          break;
        default:
          topLevelComments.sort((a, b) => a.createdAt - b.createdAt);
      }

      // 为每个顶级评论附加回复
      const commentsWithReplies = topLevelComments.map(comment => {
        const replies = results
          .filter(c => c.parentId === comment.id)
          .sort((a, b) => a.createdAt - b.createdAt);
        return { comment, replies };
      });

      // 扁平化结果
      const flatComments = commentsWithReplies.flatMap(({ comment, replies }) => [
        comment,
        ...replies,
      ]);

      // 分页
      const page = params.page || 1;
      const limit = params.limit || 50;
      const total = flatComments.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = flatComments.slice(startIndex, endIndex);

      return this.successResponse({
        comments: paginatedResults,
        total,
        page,
        limit,
        totalPages,
      });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取评论失败',
        error
      );
    }
  }

  /**
   * 根据 ID 获取评论
   */
  async getCommentById(
    id: number
  ): Promise<CommentServiceResponse<Comment>> {
    try {
      await this.simulateDelay();

      const comment = this.comments.find(c => c.id === id);
      if (!comment) {
        return this.errorResponse('NOT_FOUND', '评论不存在');
      }

      return this.successResponse({ ...comment });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取评论失败',
        error
      );
    }
  }

  /**
   * 创建评论
   */
  async createComment(
    data: CreateCommentData
  ): Promise<CommentServiceResponse<Comment>> {
    try {
      await this.simulateDelay();

      // 验证必填字段
      if (!data.content.trim()) {
        return this.errorResponse('VALIDATION_ERROR', '内容不能为空');
      }

      const comment: Comment = {
        id: this.getNextId(),
        postId: data.postId,
        authorId: data.authorId,
        authorName: data.authorName,
        authorAvatar: data.authorAvatar,
        content: data.content.trim(),
        likes: 0,
        parentId: data.parentId,
        replyToId: data.replyToId,
        replyToName: data.replyToName,
        createdAt: Date.now(),
      };

      this.comments.push(comment);
      this.saveComments();

      return this.successResponse(comment);
    } catch (error) {
      return this.errorResponse(
        'CREATE_ERROR',
        '创建评论失败',
        error
      );
    }
  }

  /**
   * 更新评论
   */
  async updateComment(
    data: UpdateCommentData
  ): Promise<CommentServiceResponse<Comment>> {
    try {
      await this.simulateDelay();

      const index = this.comments.findIndex(c => c.id === data.id);
      if (index === -1) {
        return this.errorResponse('NOT_FOUND', '评论不存在');
      }

      // 只能更新内容
      const updatedComment: Comment = {
        ...this.comments[index],
        content: data.content!,
        updatedAt: Date.now(),
      };

      this.comments[index] = updatedComment;
      this.saveComments();

      return this.successResponse(updatedComment);
    } catch (error) {
      return this.errorResponse(
        'UPDATE_ERROR',
        '更新评论失败',
        error
      );
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(id: number): Promise<CommentServiceResponse<void>> {
    try {
      await this.simulateDelay();

      const index = this.comments.findIndex(c => c.id === id);
      if (index === -1) {
        return this.errorResponse('NOT_FOUND', '评论不存在');
      }

      this.comments.splice(index, 1);
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

  /**
   * 切换点赞状态
   */
  async toggleLike(
    commentId: number,
    userId: number
  ): Promise<CommentServiceResponse<{ liked: boolean }>> {
    try {
      await this.simulateDelay();

      const comment = this.comments.find(c => c.id === commentId);
      if (!comment) {
        return this.errorResponse('NOT_FOUND', '评论不存在');
      }

      // 获取用户点赞记录
      const key = `${STORAGE_KEYS.COMMENT_LIKES}_${userId}`;
      const likedComments = JSON.parse(localStorage.getItem(key) || '[]');
      const hasLiked = likedComments.includes(commentId);

      if (hasLiked) {
        comment.likes--;
        const index = likedComments.indexOf(commentId);
        likedComments.splice(index, 1);
      } else {
        comment.likes++;
        likedComments.push(commentId);
      }

      localStorage.setItem(key, JSON.stringify(likedComments));
      this.saveComments();

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
   * 获取用户的评论
   */
  async getCommentsByUser(
    userId: number,
    limit = 20
  ): Promise<CommentServiceResponse<Comment[]>> {
    try {
      await this.simulateDelay();

      const comments = this.comments
        .filter(c => c.authorId === userId)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);

      return this.successResponse(comments);
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取用户评论失败',
        error
      );
    }
  }

  /**
   * 统计用户的评论数
   */
  countByUser(userId: number): number {
    return this.comments.filter(c => c.authorId === userId).length;
  }
}

/**
 * 导出单例
 */
export const commentService = new CommentService();
