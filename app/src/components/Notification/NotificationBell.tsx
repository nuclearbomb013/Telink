/**
 * NotificationBell - 通知铃铛组件
 *
 * 显示通知图标、未读数量，点击展开通知下拉菜单
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Trash2, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/services/notification.types';

/**
 * 格式化相对时间
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  return `${Math.floor(diff / day)} 天前`;
}

/**
 * 获取通知类型的样式
 */
function getTypeStyles(type: Notification['type']): { bg: string; color: string; icon: string } {
  switch (type) {
    case 'success':
      return { bg: 'bg-green-100', color: 'text-green-600', icon: '✓' };
    case 'error':
      return { bg: 'bg-red-100', color: 'text-red-600', icon: '✕' };
    case 'warning':
      return { bg: 'bg-yellow-100', color: 'text-yellow-600', icon: '!' };
    case 'info':
      return { bg: 'bg-blue-100', color: 'text-blue-600', icon: 'i' };
  }
}

/**
 * NotificationBell 组件
 */
const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  // 下拉菜单状态
  const [isOpen, setIsOpen] = useState(false);

  /**
   * 处理通知点击
   */
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // 如果有 actionUrl，跳转
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    setIsOpen(false);
  };

  /**
   * 阻止事件传播
   */
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  return (
    <div className="relative">
      {/* 铃铛按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          isOpen
            ? 'bg-brand-text/10 text-brand-text'
            : 'text-brand-dark-gray/70 hover:bg-brand-linen hover:text-brand-text'
        )}
        aria-label="通知"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 下拉面板 */}
          <div className="absolute right-0 mt-2 w-80 max-h-[500px] bg-white rounded-lg shadow-xl border border-brand-border/30 z-50 flex flex-col overflow-hidden">
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border/30">
              <div className="flex items-center gap-2">
                <h3 className="font-oswald text-base font-light text-brand-text">
                  通知
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="p-1.5 text-brand-dark-gray/60 hover:text-brand-text hover:bg-brand-linen rounded transition-colors"
                    title="标记全部已读"
                  >
                    <Check size={14} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="p-1.5 text-brand-dark-gray/60 hover:text-red-500 hover:bg-brand-linen rounded transition-colors"
                    title="清空通知"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* 通知列表 */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell size={40} className="text-brand-light-gray mb-3" />
                  <p className="font-roboto text-sm text-brand-dark-gray/60">
                    暂无通知
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-brand-border/30">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={cn(
                        'p-4 hover:bg-brand-linen/50 transition-colors cursor-pointer',
                        !notification.read && 'bg-brand-linen/30'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        {/* 类型图标 */}
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            getTypeStyles(notification.type).bg,
                            getTypeStyles(notification.type).color
                          )}
                        >
                          <span className="text-sm font-medium">
                            {getTypeStyles(notification.type).icon}
                          </span>
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={cn(
                                'font-roboto text-sm font-medium',
                                !notification.read ? 'text-brand-text' : 'text-brand-dark-gray/70'
                              )}
                            >
                              {notification.title}
                            </h4>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteClick(e, notification.id)}
                              className="p-0.5 text-brand-light-gray hover:text-red-500 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <p className="font-roboto text-xs text-brand-dark-gray/60 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-roboto text-xs text-brand-light-gray">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-brand-text rounded-full" />
                            )}
                          </div>
                          {notification.actionLabel && notification.actionUrl && (
                            <Link
                              to={notification.actionUrl}
                              className="inline-block mt-2 text-xs text-brand-text hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {notification.actionLabel} →
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 底部链接 */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-brand-border/30 bg-brand-linen/30">
                <Link
                  to="/notifications"
                  className="block text-center font-roboto text-xs text-brand-text hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  查看全部通知 →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
