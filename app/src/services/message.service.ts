/**
 * Message Service - 私信服务
 *
 * NOW BACKED BY REAL BACKEND API (no more localStorage mock).
 * All message data comes from the backend /messages endpoints.
 */

import { messageApi } from '@/lib/apiClient';
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

// ==================== Response Helpers ====================

function successResponse<T>(data: T): MessageServiceResponse<T> {
  return { success: true, data, timestamp: Date.now() };
}

function errorResponse(code: string, message: string, details?: unknown): MessageServiceResponse<never> {
  return { success: false, error: { code, message, details }, timestamp: Date.now() };
}

// ==================== Transform ====================

function toMessage(raw: {
  id: number; sender_id: number; receiver_id: number; content: string;
  status: string; is_deleted: boolean; created_at: number;
}): Message {
  return {
    id: raw.id,
    senderId: raw.sender_id,
    receiverId: raw.receiver_id,
    content: raw.content,
    status: (raw.status as Message['status']) || 'sent',
    isDeleted: raw.is_deleted,
    createdAt: raw.created_at,
  };
}

// ==================== Async API (Real Backend) ====================

async function canSendMessage(
  senderId: number,
  receiverId: number
): Promise<boolean> {
  return senderId !== receiverId;
}

function canSendMessageSync(senderId: number, receiverId: number): boolean {
  return senderId !== receiverId;
}

async function getConversations(
  _currentUserId: number
): Promise<MessageServiceResponse<Conversation[]>> {
  try {
    const response = await messageApi.getConversations();
    if (!response.success || !response.data) {
      return errorResponse('FETCH_ERROR', '获取会话列表失败');
    }
    const convs: Conversation[] = response.data.conversations.map(c => ({
      userId: c.user_id,
      username: c.username,
      avatar: c.avatar,
      lastMessage: c.last_message,
      lastMessageAt: c.last_message_at,
      unreadCount: c.unread_count,
      isFriend: false,
      isOnline: false,
    }));
    return successResponse(convs);
  } catch (err) {
    return errorResponse('FETCH_ERROR', '获取会话列表失败', err);
  }
}

async function getMessages(
  params: GetMessagesParams
): Promise<MessageServiceResponse<MessageListResult>> {
  try {
    const response = await messageApi.getConversationMessages(params.userId, {
      limit: params.limit,
      before_id: params.beforeId,
    });
    if (!response.success || !response.data) {
      return errorResponse('FETCH_ERROR', '获取消息列表失败');
    }
    const messages = response.data.messages.map(toMessage);
    return successResponse({
      messages,
      hasMore: response.data.has_more,
      nextCursor: messages.length > 0 ? messages[0]?.id : undefined,
    });
  } catch (err) {
    return errorResponse('FETCH_ERROR', '获取消息列表失败', err);
  }
}

async function sendMessage(
  data: SendMessageData,
  _senderId: number
): Promise<MessageServiceResponse<Message>> {
  try {
    if (!data.content.trim()) {
      return errorResponse('VALIDATION_ERROR', '消息内容不能为空');
    }
    const response = await messageApi.send(data.receiverId, data.content.trim());
    if (!response.success || !response.data) {
      return errorResponse('SEND_ERROR', response.error?.message || '发送失败');
    }
    return successResponse(toMessage(response.data));
  } catch (err) {
    return errorResponse('SEND_ERROR', '发送消息失败', err);
  }
}

async function getUnreadStats(
  _currentUserId: number
): Promise<MessageServiceResponse<UnreadMessageStats>> {
  try {
    const response = await messageApi.getUnreadCount();
    if (!response.success || !response.data) {
      return errorResponse('FETCH_ERROR', '获取未读统计失败');
    }
    return successResponse({
      totalUnread: response.data.total_unread,
      conversationUnreads: response.data.conversation_unreads.map(c => ({
        userId: c.user_id,
        unreadCount: c.unread_count,
      })),
    });
  } catch (err) {
    return errorResponse('STATS_ERROR', '获取未读统计失败', err);
  }
}

function getUnreadCountSync(_currentUserId: number): number {
  return 0; // Sync not supported with real API; use async getUnreadStats
}

async function markAllAsRead(
  _currentUserId: number,
  fromUserId?: number
): Promise<MessageServiceResponse<void>> {
  try {
    if (fromUserId) {
      await messageApi.markConversationRead(fromUserId);
    } else {
      return errorResponse('VALIDATION_ERROR', 'fromUserId is required to mark a conversation as read');
    }
    return successResponse(undefined);
  } catch (err) {
    return errorResponse('UPDATE_ERROR', '标记已读失败', err);
  }
}

async function deleteMessage(
  messageId: number,
  _userId: number
): Promise<MessageServiceResponse<void>> {
  try {
    const response = await messageApi.deleteMessage(messageId);
    if (!response.success) {
      return errorResponse('DELETE_ERROR', response.error?.message || '删除失败');
    }
    return successResponse(undefined);
  } catch (err) {
    return errorResponse('DELETE_ERROR', '删除消息失败', err);
  }
}

async function getChatWindowState(
  targetUserId: number,
  _currentUserId: number
): Promise<MessageServiceResponse<ChatWindowState>> {
  try {
    return successResponse({
      isOpen: true,
      userId: targetUserId,
      username: '',
      avatar: undefined,
      isFriend: false,
    });
  } catch (err) {
    return errorResponse('FETCH_ERROR', '获取聊天状态失败', err);
  }
}

export const messageService = {
  canSendMessage,
  canSendMessageSync,
  getConversations,
  getMessages,
  sendMessage,
  getUnreadStats,
  getUnreadCountSync,
  markAllAsRead,
  deleteMessage,
  getChatWindowState,
};
