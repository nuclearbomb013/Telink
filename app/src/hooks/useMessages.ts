/**
 * useMessages - 消息状态管理 Hook
 *
 * 提供消息列表、会话列表、发送消息等功能的统一接口
 */

import { useState, useEffect, useCallback } from 'react';
import { messageService } from '@/services/message.service';
import type {
  Message,
  Conversation,
  UnreadMessageStats,
  SendMessageData,
  MessageServiceResponse,
} from '@/services/message.types';

/**
 * useMessages Hook 返回值
 */
interface UseMessagesReturn {
  // 状态
  /** 会话列表 */
  conversations: Conversation[];
  /** 当前会话的消息列表 */
  messages: Message[];
  /** 未读统计 */
  unreadStats: UnreadMessageStats | null;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;

  // 方法
  /** 加载会话列表 */
  loadConversations: () => Promise<void>;
  /** 加载消息列表 */
  loadMessages: (targetUserId: number) => Promise<void>;
  /** 发送消息 */
  sendMessage: (data: SendMessageData, senderId: number) => Promise<MessageServiceResponse<Message>>;
  /** 标记已读 */
  markAsRead: (fromUserId?: number) => Promise<void>;
  /** 刷新未读统计 */
  refreshUnreadStats: () => Promise<void>;
  /** 清除错误 */
  clearError: () => void;
}

/**
 * useMessages Hook 参数
 */
interface UseMessagesParams {
  /** 当前用户 ID */
  currentUserId?: number;
  /** 是否自动加载会话列表 */
  autoLoadConversations?: boolean;
}

/**
 * useMessages Hook
 *
 * @example
 * ```tsx
 * const { conversations, messages, sendMessage, loadMessages } = useMessages({
 *   currentUserId: 1,
 * });
 *
 * // 加载消息
 * await loadMessages(2);
 *
 * // 发送消息
 * await sendMessage({ receiverId: 2, content: 'Hello!' }, 1);
 * ```
 */
export function useMessages({
  currentUserId,
  autoLoadConversations = true,
}: UseMessagesParams = {}): UseMessagesReturn {
  // 状态
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadStats, setUnreadStats] = useState<UnreadMessageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载会话列表
   */
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await messageService.getConversations(currentUserId);

      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        setError(response.error?.message || '加载会话列表失败');
      }
    } catch (err: any) {
      setError(err.message || '加载会话列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  /**
   * 加载消息列表
   */
  const loadMessages = useCallback(
    async (targetUserId: number) => {
      if (!currentUserId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await messageService.getMessages({
          userId: targetUserId,
          currentUserId,
          limit: 50,
        });

        if (response.success && response.data) {
          setMessages(response.data.messages);
        } else {
          setError(response.error?.message || '加载消息失败');
        }
      } catch (err: any) {
        setError(err.message || '加载消息失败');
      } finally {
        setIsLoading(false);
      }
    },
    [currentUserId]
  );

  /**
   * 发送消息
   */
  const sendMessage = useCallback(
    async (
      data: SendMessageData,
      senderId: number
    ): Promise<MessageServiceResponse<Message>> => {
      const response = await messageService.sendMessage(data, senderId);

      if (response.success && response.data) {
        setMessages((prev) => [...prev, response.data!]);
      }

      return response;
    },
    []
  );

  /**
   * 标记已读
   */
  const markAsRead = useCallback(
    async (fromUserId?: number) => {
      if (!currentUserId) return;

      await messageService.markAllAsRead(currentUserId, fromUserId);

      // 更新会话列表中的未读数
      setConversations((prev) =>
        prev.map((conv) => {
          if (!fromUserId || conv.userId === fromUserId) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        })
      );
    },
    [currentUserId]
  );

  /**
   * 刷新未读统计
   */
  const refreshUnreadStats = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const response = await messageService.getUnreadStats(currentUserId);
      if (response.success && response.data) {
        setUnreadStats(response.data);
      }
    } catch (error) {
      console.warn('刷新未读统计失败:', error);
    }
  }, [currentUserId]);

  /**
   * 初始化加载
   */
  useEffect(() => {
    if (currentUserId && autoLoadConversations) {
      loadConversations();
      refreshUnreadStats();
    }
  }, [currentUserId, autoLoadConversations, loadConversations, refreshUnreadStats]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 状态
    conversations,
    messages,
    unreadStats,
    isLoading,
    error,

    // 方法
    loadConversations,
    loadMessages,
    sendMessage,
    markAsRead,
    refreshUnreadStats,
    clearError,
  };
}

/**
 * 获取未读消息数（同步版本）
 */
export const getUnreadCountSync = (userId: number): number => {
  return messageService.getUnreadCountSync(userId);
};

export default useMessages;