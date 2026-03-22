/**
 * Notification Types - 通知系统类型定义
 */

/**
 * 通知类型
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * 通知接口
 */
export interface Notification {
  /** 通知 ID */
  id: string;
  /** 通知类型 */
  type: NotificationType;
  /** 通知标题 */
  title: string;
  /** 通知内容 */
  message: string;
  /** 创建时间戳 */
  createdAt: number;
  /** 是否已读 */
  read: boolean;
  /** 操作 URL（可选） */
  actionUrl?: string;
  /** 操作标签（可选） */
  actionLabel?: string;
}

/**
 * 通知状态
 */
export interface NotificationState {
  /** 所有通知 */
  notifications: Notification[];
  /** 未读通知数量 */
  unreadCount: number;
}

/**
 * 创建通知数据
 */
export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}
