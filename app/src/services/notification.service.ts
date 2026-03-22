/**
 * Notification Service - 通知服务
 *
 * 提供通知的 CRUD 操作、未读计数等功能
 * 使用 localStorage 持久化存储
 */

import type { Notification, CreateNotificationData, NotificationState } from './notification.types';

/**
 * localStorage 键名
 */
const STORAGE_KEYS = {
  NOTIFICATIONS: 'techink_notifications',
} as const;

/**
 * 通知最大保留数量
 */
const MAX_NOTIFICATIONS = 50;

/**
 * 通知有效期（毫秒）- 7 天
 */
const NOTIFICATION_EXPIRY = 7 * 24 * 60 * 60 * 1000;

/**
 * 通知服务类
 * 使用引用计数和页面可见性 API 优化定时器管理
 */
class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Set<() => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private visibilityHandler: (() => void) | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化服务
   */
  private initialize(): void {
    this.loadNotifications();
    this.cleanupExpired();

    // 监听页面可见性变化
    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        this.startCleanupTimer();
        this.cleanupExpired(); // 页面可见时立即清理一次
      } else {
        this.stopCleanupTimer();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    // 初始启动定时器（如果页面可见）
    if (document.visibilityState === 'visible') {
      this.startCleanupTimer();
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.intervalId) return; // 已在运行
    this.intervalId = setInterval(() => this.cleanupExpired(), 60 * 1000);
  }

  /**
   * 停止清理定时器
   */
  private stopCleanupTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 销毁服务实例，清理所有资源
   */
  public destroy(): void {
    this.stopCleanupTimer();
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.listeners.clear();
  }

  /**
   * 从 localStorage 加载通知
   */
  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.notifications = parsed;
          this.notifyListeners();
          return;
        }
      }
      this.notifications = [];
    } catch (error) {
      console.warn('加载通知失败:', error);
      this.notifications = [];
    }
  }

  /**
   * 保存通知到 localStorage
   */
  private saveNotifications(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      this.notifyListeners();
    } catch (error) {
      console.warn('保存通知失败:', error);
    }
  }

  /**
   * 清理过期通知
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const beforeCount = this.notifications.length;

    this.notifications = this.notifications.filter(
      (n) => now - n.createdAt < NOTIFICATION_EXPIRY
    );

    if (this.notifications.length !== beforeCount) {
      this.saveNotifications();
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
   * 获取通知状态
   */
  getState(): NotificationState {
    const notifications = [...this.notifications];
    const unreadCount = notifications.filter((n) => !n.read).length;
    return { notifications, unreadCount };
  }

  /**
   * 获取未读通知数量
   */
  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  /**
   * 创建通知
   */
  addNotification(data: CreateNotificationData): Notification {
    const notification: Notification = {
      id: this.generateId(),
      type: data.type,
      title: data.title,
      message: data.message,
      createdAt: Date.now(),
      read: false,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
    };

    // 添加到列表开头
    this.notifications.unshift(notification);

    // 限制数量
    if (this.notifications.length > MAX_NOTIFICATIONS) {
      this.notifications = this.notifications.slice(0, MAX_NOTIFICATIONS);
    }

    this.saveNotifications();
    return notification;
  }

  /**
   * 标记为已读
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  /**
   * 标记全部为已读
   */
  markAllAsRead(): void {
    let changed = false;
    this.notifications.forEach((n) => {
      if (!n.read) {
        n.read = true;
        changed = true;
      }
    });
    if (changed) {
      this.saveNotifications();
    }
  }

  /**
   * 删除通知
   */
  deleteNotification(id: string): void {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveNotifications();
    }
  }

  /**
   * 清空所有通知
   */
  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  /**
   * 删除已读通知
   */
  clearRead(): void {
    const beforeCount = this.notifications.length;
    this.notifications = this.notifications.filter((n) => !n.read);
    if (this.notifications.length !== beforeCount) {
      this.saveNotifications();
    }
  }

  /**
   * 获取所有通知（按时间排序）
   */
  getAllNotifications(): Notification[] {
    return [...this.notifications].sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 获取未读通知
   */
  getUnreadNotifications(): Notification[] {
    return this.notifications
      .filter((n) => !n.read)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // ==================== 便捷方法 ====================

  /**
   * 成功通知
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
   * 错误通知
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
   * 警告通知
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
   * 信息通知
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
}

/**
 * 导出单例
 */
export const notificationService = new NotificationService();
