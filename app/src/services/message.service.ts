/**
 * Message Service - 消息服务
 *
 * 提供私信聊天功能，包括会话列表、消息收发等
 * 当前使用 Mock 数据，预留真实 API 接口
 *
 * 注意：仅好友（互关用户）可以发送消息
 */

import type {
  Message,
  Conversation,
  GetMessagesParams,
  MessageListResult,
  SendMessageData,
  ChatWindowState,
  UnreadMessageStats,
  MessageServiceResponse,
} from './message.types';
import { followService } from './follow.service';

/**
 * localStorage 键名
 */
const STORAGE_KEYS = {
  MESSAGES: 'techink_messages',
  CONVERSATIONS: 'techink_conversations',
  COUNTER: 'techink_message_counter',
} as const;

/**
 * Mock 初始消息数据
 */
const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    senderId: 2,
    receiverId: 1,
    content: '你好！看到你分享的 TypeScript 技巧很有帮助，想请教一个问题。',
    status: 'read',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 2,
    senderId: 1,
    receiverId: 2,
    content: '你好！什么问题？可以一起讨论。',
    status: 'read',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000,
  },
  {
    id: 3,
    senderId: 2,
    receiverId: 1,
    content: '关于泛型约束，如果我想限制一个类型必须是某个接口的实现，应该怎么写？',
    status: 'read',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000,
  },
  {
    id: 4,
    senderId: 5,
    receiverId: 1,
    content: '最近在研究 React 19 的新特性，有空交流一下？',
    status: 'read',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    id: 5,
    senderId: 1,
    receiverId: 5,
    content: '好的！React 19 的 Server Components 很有意思。',
    status: 'read',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
  },
];

/**
 * 消息服务类
 */
class MessageService {
  private messages: Message[] = [];
  private nextId = 1;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化服务
   */
  private async initialize(): Promise<void> {
    await this.loadMessages();
    this.loadCounter();
  }

  /**
   * 从 localStorage 加载消息
   */
  private async loadMessages(): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.messages = parsed;
          return;
        }
      }
      // 首次使用，加载初始数据
      this.messages = [...INITIAL_MESSAGES];
      this.saveMessages();
    } catch (error) {
      console.warn('加载消息失败:', error);
      this.messages = [...INITIAL_MESSAGES];
    }
  }

  /**
   * 保存消息到 localStorage
   */
  private saveMessages(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(this.messages));
    } catch (error) {
      console.warn('保存消息失败:', error);
    }
  }

  /**
   * 加载计数器
   */
  private loadCounter(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COUNTER);
      if (stored) {
        this.nextId = parseInt(stored, 10);
      } else {
        this.nextId = Math.max(...this.messages.map(m => m.id), 0) + 1;
      }
    } catch (error) {
      console.warn('加载计数器失败:', error);
      this.nextId = this.messages.length + 1;
    }
  }

  /**
   * 获取下一个 ID
   */
  private getNextId(): number {
    const id = this.nextId++;
    localStorage.setItem(STORAGE_KEYS.COUNTER, this.nextId.toString());
    return id;
  }

  /**
   * 模拟 API 延迟
   */
  private async simulateDelay(ms = 150): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 创建成功响应
   */
  private successResponse<T>(data: T): MessageServiceResponse<T> {
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
  ): MessageServiceResponse<never> {
    return {
      success: false,
      error: { code, message, details },
      timestamp: Date.now(),
    };
  }

  // ==================== 公开 API ====================

  /**
   * 检查是否可以发送消息（是否为好友）
   */
  async canSendMessage(
    senderId: number,
    receiverId: number
  ): Promise<boolean> {
    // 不能给自己发消息
    if (senderId === receiverId) {
      return false;
    }

    // 检查是否互关
    return followService.isMutualSync(senderId, receiverId);
  }

  /**
   * 同步检查是否可以发送消息
   */
  canSendMessageSync(senderId: number, receiverId: number): boolean {
    if (senderId === receiverId) {
      return false;
    }
    return followService.isMutualSync(senderId, receiverId);
  }

  /**
   * 获取会话列表
   */
  async getConversations(
    currentUserId: number
  ): Promise<MessageServiceResponse<Conversation[]>> {
    try {
      await this.simulateDelay();

      // 获取好友列表（只有好友才能发消息）
      const friendIds = followService.getFriendIdsSync(currentUserId);

      // 构建会话列表
      const conversations: Conversation[] = [];

      for (const friendId of friendIds) {
        // 获取与该好友的消息
        const messagesWithFriend = this.messages.filter(
          m =>
            (m.senderId === currentUserId && m.receiverId === friendId) ||
            (m.senderId === friendId && m.receiverId === currentUserId)
        );

        if (messagesWithFriend.length === 0) {
          continue; // 没有消息记录，不显示会话
        }

        // 按时间排序，获取最后一条消息
        const sortedMessages = messagesWithFriend.sort(
          (a, b) => b.createdAt - a.createdAt
        );
        const lastMessage = sortedMessages[0];

        // 计算未读数
        const unreadCount = messagesWithFriend.filter(
          m => m.receiverId === currentUserId && m.status !== 'read'
        ).length;

        conversations.push({
          userId: friendId,
          username: '', // 需要从用户服务获取
          avatar: undefined,
          lastMessage: lastMessage.content,
          lastMessageAt: lastMessage.createdAt,
          unreadCount,
          isFriend: true, // 已经是好友才能出现在会话列表
          isOnline: false,
        });
      }

      // 按最后消息时间排序
      conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

      return this.successResponse(conversations);
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取会话列表失败',
        error
      );
    }
  }

  /**
   * 获取消息列表
   */
  async getMessages(
    params: GetMessagesParams
  ): Promise<MessageServiceResponse<MessageListResult>> {
    try {
      await this.simulateDelay();

      // 检查是否为好友
      const isFriend = followService.isMutualSync(
        params.currentUserId,
        params.userId
      );

      if (!isFriend) {
        return this.errorResponse(
          'FORBIDDEN',
          '仅好友可以查看聊天记录'
        );
      }

      // 获取两人的消息
      let messages = this.messages.filter(
        m =>
          (m.senderId === params.currentUserId && m.receiverId === params.userId) ||
          (m.senderId === params.userId && m.receiverId === params.currentUserId)
      );

      // 排除已删除的消息
      messages = messages.filter(m => !m.isDeleted);

      // 按时间排序
      messages.sort((a, b) => b.createdAt - a.createdAt);

      // 游标分页
      if (params.beforeId) {
        const beforeIndex = messages.findIndex(m => m.id === params.beforeId);
        if (beforeIndex > -1) {
          messages = messages.slice(beforeIndex + 1);
        }
      }

      // 标记已读
      messages.forEach(m => {
        if (m.receiverId === params.currentUserId && m.status !== 'read') {
          m.status = 'read';
        }
      });
      this.saveMessages();

      // 分页
      const limit = params.limit || 20;
      const hasMore = messages.length > limit;
      const paginatedMessages = messages.slice(0, limit);

      // 标记是否是自己发送的
      paginatedMessages.forEach(m => {
        m.isOwn = m.senderId === params.currentUserId;
      });

      // 反转顺序，最早的在前
      paginatedMessages.reverse();

      return this.successResponse({
        messages: paginatedMessages,
        hasMore,
        nextCursor: hasMore ? paginatedMessages[paginatedMessages.length - 1]?.id : undefined,
      });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取消息列表失败',
        error
      );
    }
  }

  /**
   * 发送消息
   */
  async sendMessage(
    data: SendMessageData,
    senderId: number
  ): Promise<MessageServiceResponse<Message>> {
    try {
      await this.simulateDelay();

      // 验证内容
      if (!data.content.trim()) {
        return this.errorResponse('VALIDATION_ERROR', '消息内容不能为空');
      }

      // 检查是否为好友
      const isFriend = await this.canSendMessage(senderId, data.receiverId);
      if (!isFriend) {
        return this.errorResponse(
          'FORBIDDEN',
          '仅好友可以发送消息'
        );
      }

      const message: Message = {
        id: this.getNextId(),
        senderId,
        receiverId: data.receiverId,
        content: data.content.trim(),
        status: 'sent',
        createdAt: Date.now(),
        isOwn: true,
      };

      this.messages.push(message);
      this.saveMessages();

      // 模拟消息送达
      setTimeout(() => {
        const msg = this.messages.find(m => m.id === message.id);
        if (msg) {
          msg.status = 'delivered';
          this.saveMessages();
        }
      }, 500);

      return this.successResponse(message);
    } catch (error) {
      return this.errorResponse(
        'SEND_ERROR',
        '发送消息失败',
        error
      );
    }
  }

  /**
   * 获取未读消息统计
   */
  async getUnreadStats(
    currentUserId: number
  ): Promise<MessageServiceResponse<UnreadMessageStats>> {
    try {
      await this.simulateDelay();

      // 获取好友列表
      const friendIds = followService.getFriendIdsSync(currentUserId);

      // 统计未读消息
      const conversationUnreads: { userId: number; unreadCount: number }[] = [];
      let totalUnread = 0;

      for (const friendId of friendIds) {
        const unreadCount = this.messages.filter(
          m =>
            m.senderId === friendId &&
            m.receiverId === currentUserId &&
            m.status !== 'read' &&
            !m.isDeleted
        ).length;

        if (unreadCount > 0) {
          conversationUnreads.push({ userId: friendId, unreadCount });
          totalUnread += unreadCount;
        }
      }

      return this.successResponse({
        totalUnread,
        conversationUnreads,
      });
    } catch (error) {
      return this.errorResponse(
        'STATS_ERROR',
        '获取未读统计失败',
        error
      );
    }
  }

  /**
   * 获取未读消息数（同步）
   */
  getUnreadCountSync(currentUserId: number): number {
    return this.messages.filter(
      m =>
        m.receiverId === currentUserId &&
        m.status !== 'read' &&
        !m.isDeleted
    ).length;
  }

  /**
   * 标记所有消息为已读
   */
  async markAllAsRead(
    currentUserId: number,
    fromUserId?: number
  ): Promise<MessageServiceResponse<void>> {
    try {
      await this.simulateDelay();

      this.messages.forEach(m => {
        if (m.receiverId === currentUserId && m.status !== 'read') {
          if (!fromUserId || m.senderId === fromUserId) {
            m.status = 'read';
          }
        }
      });

      this.saveMessages();

      return this.successResponse(undefined);
    } catch (error) {
      return this.errorResponse(
        'UPDATE_ERROR',
        '标记已读失败',
        error
      );
    }
  }

  /**
   * 删除消息（软删除）
   */
  async deleteMessage(
    messageId: number,
    userId: number
  ): Promise<MessageServiceResponse<void>> {
    try {
      await this.simulateDelay();

      const message = this.messages.find(m => m.id === messageId);
      if (!message) {
        return this.errorResponse('NOT_FOUND', '消息不存在');
      }

      // 只能删除自己发送或接收的消息
      if (message.senderId !== userId && message.receiverId !== userId) {
        return this.errorResponse('FORBIDDEN', '无权删除此消息');
      }

      message.isDeleted = true;
      this.saveMessages();

      return this.successResponse(undefined);
    } catch (error) {
      return this.errorResponse(
        'DELETE_ERROR',
        '删除消息失败',
        error
      );
    }
  }

  /**
   * 获取聊天窗口状态
   */
  async getChatWindowState(
    targetUserId: number,
    currentUserId: number
  ): Promise<MessageServiceResponse<ChatWindowState>> {
    try {
      // 检查是否为好友
      const isFriend = followService.isMutualSync(currentUserId, targetUserId);

      return this.successResponse({
        isOpen: true,
        userId: targetUserId,
        username: '',
        avatar: undefined,
        isFriend,
      });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取聊天状态失败',
        error
      );
    }
  }
}

/**
 * 导出单例
 */
export const messageService = new MessageService();