/**
 * Notification Service - 通知服务
 *
 * 提供通知的 CRUD 操作、未读计数等功能
 * 连接后端 FastAPI API
 */

import type { Notification, NotificationType, CreateNotificationData, NotificationState } from './notification.types';
import {
  notificationApi,
  type Notification as ApiNotification,
} from '@/lib/apiClient';
import { authService } from './auth.service';

/**
 * 通知服务类
 */
class NotificationService {
  private listeners: Set<() => void> = new Set();
  private cachedNotifications: Notification[] = [];
  private cachedUnreadCount: number = 0;

  /**
   * 将 API Notification 转换为本地 Notification 格式
   */
  private mapApiNotificationToNotification(apiNotif: ApiNotification): Notification {
    return {
      id: String(apiNotif.id),
      type: apiNotif.type as NotificationType,
      title: apiNotif.title,
      message: apiNotif.message,
      createdAt: apiNotif.created_at,
      read: apiNotif.is_read,
      actionUrl: apiNotif.link,
    };
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  // ==================== 公开 API ====================

  /**
   * 订阅通知变化
   */
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 从服务器获取通知状态
   */
  async fetchState(): Promise<NotificationState> {
    try {
      if (!authService.isAuthenticated()) {
        return { notifications: [], unreadCount: 0 };
      }

      const response = await notificationApi.getNotifications({ limit: 50 });

      if (!response.success || !response.data) {
        return { notifications: this.cachedNotifications, unreadCount: this.cachedUnreadCount };
      }

      const data = response.data;
      this.cachedNotifications = data.notifications.map(this.mapApiNotificationToNotification);
      this.cachedUnreadCount = data.unread_count;

      this.notifyListeners();

      return {
        notifications: this.cachedNotifications,
        unreadCount: this.cachedUnreadCount,
      };
    } catch (error) {
      console.warn('获取通知失败:', error);
      return { notifications: this.cachedNotifications, unreadCount: this.cachedUnreadCount };
    }
  }

  /**
   * 获取通知状态（使用缓存）
   */
  getState(): NotificationState {
    return {
      notifications: this.cachedNotifications,
      unreadCount: this.cachedUnreadCount,
    };
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(): Promise<number> {
    try {
      if (!authService.isAuthenticated()) {
        return 0;
      }

      const response = await notificationApi.getUnreadCount();

      if (!response.success || !response.data) {
        return this.cachedUnreadCount;
      }

      this.cachedUnreadCount = response.data.count;
      return this.cachedUnreadCount;
    } catch (error) {
      console.warn('获取未读数量失败:', error);
      return this.cachedUnreadCount;
    }
  }

  /**
   * 标记为已读
   */
  async markAsRead(id: string): Promise<void> {
    try {
      if (!authService.isAuthenticated()) {
        return;
      }

      const response = await notificationApi.markAsRead(parseInt(id, 10));

      if (response.success) {
        // 更新本地缓存
        const notification = this.cachedNotifications.find((n) => n.id === id);
        if (notification && !notification.read) {
          notification.read = true;
          this.cachedUnreadCount = Math.max(0, this.cachedUnreadCount - 1);
          this.notifyListeners();
        }
      }
    } catch (error) {
      console.warn('标记已读失败:', error);
    }
  }

  /**
   * 标记全部为已读
   */
  async markAllAsRead(): Promise<void> {
    try {
      if (!authService.isAuthenticated()) {
        return;
      }

      const response = await notificationApi.markAllAsRead();

      if (response.success) {
        // 更新本地缓存
        this.cachedNotifications.forEach((n) => {
          n.read = true;
        });
        this.cachedUnreadCount = 0;
        this.notifyListeners();
      }
    } catch (error) {
      console.warn('标记全部已读失败:', error);
    }
  }

  /**
   * 删除通知
   */
  async deleteNotification(id: string): Promise<void> {
    try {
      if (!authService.isAuthenticated()) {
        return;
      }

      const response = await notificationApi.deleteNotification(parseInt(id, 10));

      if (response.success) {
        // 更新本地缓存
        const index = this.cachedNotifications.findIndex((n) => n.id === id);
        if (index !== -1) {
          const notification = this.cachedNotifications[index];
          if (!notification.read) {
            this.cachedUnreadCount = Math.max(0, this.cachedUnreadCount - 1);
          }
          this.cachedNotifications.splice(index, 1);
          this.notifyListeners();
        }
      }
    } catch (error) {
      console.warn('删除通知失败:', error);
    }
  }

  /**
   * 清空所有通知（本地操作，需后端支持批量删除）
   */
  async clearAll(): Promise<void> {
    // 逐个删除
    for (const notification of this.cachedNotifications) {
      await this.deleteNotification(notification.id);
    }
    this.cachedNotifications = [];
    this.cachedUnreadCount = 0;
    this.notifyListeners();
  }

  /**
   * 删除已读通知
   */
  async clearRead(): Promise<void> {
    const readNotifications = this.cachedNotifications.filter((n) => n.read);
    for (const notification of readNotifications) {
      await this.deleteNotification(notification.id);
    }
  }

  /**
   * 获取所有通知（使用缓存）
   */
  getAllNotifications(): Notification[] {
    return [...this.cachedNotifications].sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 获取未读通知（使用缓存）
   */
  getUnreadNotifications(): Notification[] {
    return this.cachedNotifications
      .filter((n) => !n.read)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // ==================== 本地便捷方法 ====================
  // 这些方法用于显示临时的 UI 通知，不存储到后端

  /**
   * 创建本地通知（用于 UI 提示，不存储到后端）
   */
  addNotification(data: CreateNotificationData): Notification {
    const notification: Notification = {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: data.type,
      title: data.title,
      message: data.message,
      createdAt: Date.now(),
      read: false,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
    };

    // 添加到本地缓存开头
    this.cachedNotifications.unshift(notification);
    this.cachedUnreadCount++;
    this.notifyListeners();

    return notification;
  }

  /**
   * 成功通知（本地）
   */
  success(title: string, message: string, actionUrl?: string, actionLabel?: string): Notification {
    return this.addNotification({
      type: 'success',
      title,
      message,
      actionUrl,
      actionLabel,
    });
  }

  /**
   * 错误通知（本地）
   */
  error(title: string, message: string, actionUrl?: string, actionLabel?: string): Notification {
    return this.addNotification({
      type: 'error',
      title,
      message,
      actionUrl,
      actionLabel,
    });
  }

  /**
   * 警告通知（本地）
   */
  warning(title: string, message: string, actionUrl?: string, actionLabel?: string): Notification {
    return this.addNotification({
      type: 'warning',
      title,
      message,
      actionUrl,
      actionLabel,
    });
  }

  /**
   * 信息通知（本地）
   */
  info(title: string, message: string, actionUrl?: string, actionLabel?: string): Notification {
    return this.addNotification({
      type: 'info',
      title,
      message,
      actionUrl,
      actionLabel,
    });
  }

  /**
   * 销毁服务实例（兼容性保留）
   */
  public destroy(): void {
    this.listeners.clear();
    this.cachedNotifications = [];
    this.cachedUnreadCount = 0;
  }
}

/**
 * 导出单例
 */
export const notificationService = new NotificationService();