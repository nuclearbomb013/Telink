/**
 * Message Types - 私信功能类型定义
 *
 * 定义私信聊天相关的所有类型
 */

/**
 * 消息状态
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

/**
 * 消息接口
 */
export interface Message {
  /** 消息 ID */
  id: number;
  /** 发送者 ID */
  senderId: number;
  /** 接收者 ID */
  receiverId: number;
  /** 消息内容 */
  content: string;
  /** 消息状态 */
  status: MessageStatus;
  /** 创建时间 */
  createdAt: number;
  /** 是否已删除 */
  isDeleted?: boolean;
  /** 是否是自己发送的 */
  isOwn?: boolean;
}

/**
 * 会话接口
 */
export interface Conversation {
  /** 对方用户 ID */
  userId: number;
  /** 对方用户名 */
  username: string;
  /** 对方头像 */
  avatar?: string;
  /** 最后一条消息 */
  lastMessage: string;
  /** 最后消息时间 */
  lastMessageAt: number;
  /** 未读消息数 */
  unreadCount: number;
  /** 是否为好友（互关） */
  isFriend: boolean;
  /** 是否在线 */
  isOnline?: boolean;
}

/**
 * 会话列表结果
 */
export interface ConversationListResult {
  /** 会话列表 */
  conversations: Conversation[];
  /** 总数 */
  total: number;
  /** 是否有更多 */
  hasMore: boolean;
}

/**
 * 消息列表参数
 */
export interface GetMessagesParams {
  /** 对方用户 ID */
  userId: number;
  /** 当前用户 ID */
  currentUserId: number;
  /** 游标（用于分页，消息 ID） */
  beforeId?: number;
  /** 每页数量 */
  limit?: number;
}

/**
 * 消息列表结果
 */
export interface MessageListResult {
  /** 消息列表 */
  messages: Message[];
  /** 是否有更多 */
  hasMore: boolean;
  /** 下一页游标 */
  nextCursor?: number;
}

/**
 * 发送消息数据
 */
export interface SendMessageData {
  /** 接收者 ID */
  receiverId: number;
  /** 消息内容 */
  content: string;
}

/**
 * 消息服务响应类型
 */
export interface MessageServiceResponse<T> {
  /** 是否成功 */
  success: boolean;
  /** 数据 */
  data?: T;
  /** 错误信息 */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  /** 时间戳 */
  timestamp: number;
}

/**
 * 未读消息统计
 */
export interface UnreadMessageStats {
  /** 总未读数 */
  totalUnread: number;
  /** 各会话未读数 */
  conversationUnreads: {
    userId: number;
    unreadCount: number;
  }[];
}

/**
 * 聊天窗口状态
 */
export interface ChatWindowState {
  /** 是否打开 */
  isOpen: boolean;
  /** 对方用户 ID */
  userId?: number;
  /** 对方用户名 */
  username?: string;
  /** 对方头像 */
  avatar?: string;
  /** 是否为好友 */
  isFriend?: boolean;
}