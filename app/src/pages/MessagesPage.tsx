/**
 * MessagesPage - 消息页面
 *
 * 显示会话列表，点击进入聊天
 * 遵循水墨/E-ink风格设计
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/dateUtils';

import { useMessages } from '@/hooks/useMessages';
import { userService } from '@/services/user.service';
import type { CurrentUser, User as UserType } from '@/services/user.types';
import type { Conversation } from '@/services/message.types';

import UserAvatar from '@/components/Forum/UserAvatar';
import { Input } from '@/components/ui/input';

/**
 * 会话项组件
 */
const ConversationItem = ({
  conversation,
  user,
  onClick,
}: {
  conversation: Conversation;
  user?: UserType;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3',
        'hover:bg-brand-linen/50 transition-colors',
        'text-left border-b border-brand-border/20 last:border-b-0'
      )}
    >
      <div className="relative">
        <UserAvatar
          username={user?.username || conversation.username || '用户'}
          avatarUrl={user?.avatar || conversation.avatar}
          size="md"
        />
        {conversation.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
        {conversation.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-brand-text text-white text-xs rounded-full flex items-center justify-center px-1 font-roboto">
            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-roboto font-medium text-brand-text truncate">
            {user?.username || conversation.username || '用户'}
          </span>
          <time className="text-xs text-brand-dark-gray/60 font-roboto shrink-0 ml-2">
            {formatRelativeTime(conversation.lastMessageAt)}
          </time>
        </div>
        <p className="text-sm text-brand-dark-gray/60 truncate mt-0.5 font-roboto">
          {conversation.lastMessage}
        </p>
      </div>
    </button>
  );
};

/**
 * MessagesPage 组件
 */
const MessagesPage = () => {
  const navigate = useNavigate();

  // 用户状态
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // 搜索
  const [searchQuery, setSearchQuery] = useState('');

  // 用户缓存
  const [userCache, setUserCache] = useState<Record<number, UserType>>({});

  // 消息 Hook
  const { conversations, isLoading, error } = useMessages({
    currentUserId: currentUser?.id,
  });

  /**
   * 初始化用户
   */
  useEffect(() => {
    const user = userService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  /**
   * 加载用户信息
   */
  useEffect(() => {
    const loadUsers = async () => {
      for (const conv of conversations) {
        if (!userCache[conv.userId]) {
          const response = await userService.getUserById(conv.userId);
          if (response.success && response.data) {
            setUserCache((prev) => ({
              ...prev,
              [conv.userId]: response.data!,
            }));
          }
        }
      }
    };

    if (conversations.length > 0) {
      loadUsers();
    }
  }, [conversations, userCache]);

  /**
   * 过滤会话
   */
  const filteredConversations = conversations.filter((conv) => {
    const user = userCache[conv.userId];
    const name = user?.username || conv.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  /**
   * 处理点击会话
   */
  const handleConversationClick = (userId: number) => {
    navigate(`/messages/${userId}`);
  };

  // 未登录
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-brand-linen pt-32 pb-20">
        <div className="max-w-[480px] mx-auto px-4">
          <div className="text-center py-12 bg-white/90 border border-brand-border/30 rounded-sm">
            <User size={48} className="mx-auto text-brand-dark-gray/30 mb-4" />
            <h2 className="font-oswald text-xl text-brand-text mb-2">请先登录</h2>
            <p className="text-brand-dark-gray/60 font-roboto mb-4">
              登录后查看消息
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-brand-text text-white font-roboto hover:bg-brand-dark-gray transition-colors"
            >
              去登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-linen pt-32 pb-20">
      <div className="max-w-[480px] mx-auto px-4 lg:px-6">
        {/* 头部 */}
        <header className="mb-6">
          <h1 className="font-oswald font-light text-3xl text-brand-text">
            消息
          </h1>
          <p className="text-sm text-brand-dark-gray/60 font-roboto mt-1">
            与好友的聊天记录
          </p>
        </header>

        {/* 搜索框 */}
        <div className="mb-4 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark-gray/40"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索好友..."
            className="pl-9 border-brand-border/30 focus:border-brand-text"
          />
        </div>

        {/* 会话列表 */}
        <div className="bg-white/90 backdrop-blur-sm border border-brand-border/30 rounded-sm overflow-hidden">
          {/* 加载中 */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin text-brand-text">
                <span className="inline-block w-6 h-6 border-2 border-brand-text border-t-transparent rounded-full" />
              </div>
            </div>
          )}

          {/* 错误 */}
          {error && (
            <div className="text-center py-12 text-brand-dark-gray/60">
              <p className="font-roboto">{error}</p>
            </div>
          )}

          {/* 空状态 */}
          {!isLoading && !error && conversations.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare
                size={48}
                className="mx-auto text-brand-dark-gray/30 mb-4"
              />
              <h3 className="font-roboto text-brand-text mb-1">暂无消息</h3>
              <p className="text-sm text-brand-dark-gray/60">
                与好友互关后即可开始聊天
              </p>
            </div>
          )}

          {/* 会话列表 */}
          {!isLoading && filteredConversations.length > 0 && (
            <div>
              {filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv.userId}
                  conversation={conv}
                  user={userCache[conv.userId]}
                  onClick={() => handleConversationClick(conv.userId)}
                />
              ))}
            </div>
          )}

          {/* 搜索无结果 */}
          {!isLoading &&
            searchQuery &&
            filteredConversations.length === 0 &&
            conversations.length > 0 && (
              <div className="text-center py-8 text-brand-dark-gray/60">
                <p className="font-roboto">未找到"{searchQuery}"</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;