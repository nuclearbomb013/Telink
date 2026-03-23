/**
 * useNotifications - 通知状态管理 Hook
 *
 * 提供通知状态、添加通知、标记已读等功能的统一接口
 */

import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notification.service';
import type { Notification, CreateNotificationData, NotificationState } from '@/services/notification.types';

/**
 * useNotifications Hook 返回值
 */
interface UseNotificationsReturn {
  // 状态
  /** 所有通知 */
  notifications: Notification[];
  /** 未读通知数量 */
  unreadCount: number;

  // 方法
  /** 添加通知 */
  addNotification: (data: CreateNotificationData) => Notification;
  /** 标记为已读 */
  markAsRead: (id: string) => void;
  /** 标记全部为已读 */
  markAllAsRead: () => void;
  /** 删除通知 */
  deleteNotification: (id: string) => void;
  /** 清空所有通知 */
  clearAll: () => void;
  /** 清空已读通知 */
  clearRead: () => void;

  // 便捷方法
  /** 成功通知 */
  success: (title: string, message: string, actionUrl?: string, actionLabel?: string) => Notification;
  /** 错误通知 */
  error: (title: string, message: string, actionUrl?: string, actionLabel?: string) => Notification;
  /** 警告通知 */
  warning: (title: string, message: string, actionUrl?: string, actionLabel?: string) => Notification;
  /** 信息通知 */
  info: (title: string, message: string, actionUrl?: string, actionLabel?: string) => Notification;
}

/**
 * useNotifications Hook
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, addNotification, markAllAsRead } = useNotifications();
 *
 * // 添加通知
 * addNotification({ type: 'success', title: '发布成功', message: '您的帖子已成功发布' });
 *
 * // 标记全部已读
 * markAllAsRead();
 * ```
 */
export function useNotifications(): UseNotificationsReturn {
  // 状态
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
  });

  /**
   * 初始化并订阅通知变化
   * 这是有效的初始化模式，在组件挂载时同步通知状态
   */
  useEffect(() => {
    // 初始加载
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(notificationService.getState());

    // 订阅变化
    const unsubscribe = notificationService.subscribe(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(notificationService.getState());
    });

    return unsubscribe;
  }, []);

  /**
   * 添加通知
   */
  const addNotification = useCallback((data: CreateNotificationData): Notification => {
    return notificationService.addNotification(data);
  }, []);

  /**
   * 标记为已读
   */
  const markAsRead = useCallback((id: string): void => {
    notificationService.markAsRead(id);
  }, []);

  /**
   * 标记全部为已读
   */
  const markAllAsRead = useCallback((): void => {
    notificationService.markAllAsRead();
  }, []);

  /**
   * 删除通知
   */
  const deleteNotification = useCallback((id: string): void => {
    notificationService.deleteNotification(id);
  }, []);

  /**
   * 清空所有通知
   */
  const clearAll = useCallback((): void => {
    notificationService.clearAll();
  }, []);

  /**
   * 清空已读通知
   */
  const clearRead = useCallback((): void => {
    notificationService.clearRead();
  }, []);

  /**
   * 成功通知
   */
  const success = useCallback((
    title: string,
    message: string,
    actionUrl?: string,
    actionLabel?: string
  ): Notification => {
    return notificationService.success(title, message, actionUrl, actionLabel);
  }, []);

  /**
   * 错误通知
   */
  const error = useCallback((
    title: string,
    message: string,
    actionUrl?: string,
    actionLabel?: string
  ): Notification => {
    return notificationService.error(title, message, actionUrl, actionLabel);
  }, []);

  /**
   * 警告通知
   */
  const warning = useCallback((
    title: string,
    message: string,
    actionUrl?: string,
    actionLabel?: string
  ): Notification => {
    return notificationService.warning(title, message, actionUrl, actionLabel);
  }, []);

  /**
   * 信息通知
   */
  const info = useCallback((
    title: string,
    message: string,
    actionUrl?: string,
    actionLabel?: string
  ): Notification => {
    return notificationService.info(title, message, actionUrl, actionLabel);
  }, []);

  return {
    // 状态
    notifications: state.notifications,
    unreadCount: state.unreadCount,

    // 方法
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    clearRead,

    // 便捷方法
    success,
    error,
    warning,
    info,
  };
}

export default useNotifications;
