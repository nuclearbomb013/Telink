/**
 * ChatWindow - 聊天窗口组件
 *
 * 显示与好友的聊天对话，支持发送消息
 * 仅好友（互关用户）可以聊天
 * 遵循水墨/E-ink风格设计
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, MoreVertical, User, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/dateUtils';

import { messageService } from '@/services/message.service';
import { followService } from '@/services/follow.service';
import type { Message, MessageStatus } from '@/services/message.types';
import type { CurrentUser } from '@/services/user.types';

import UserAvatar from '@/components/Forum/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ChatWindowProps {
  /** 当前用户 */
  currentUser: CurrentUser;
  /** 对方用户 ID */
  targetUserId: number;
  /** 对方用户名 */
  targetUsername: string;
  /** 对方头像 */
  targetAvatar?: string;
  /** 返回回调 */
  onBack?: () => void;
  /** 查看用户资料回调 */
  onViewProfile?: (userId: number) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 消息状态图标
 */
const MessageStatusIcon = ({ status }: { status: MessageStatus }) => {
  switch (status) {
    case 'sending':
      return <span className="text-brand-dark-gray/40">·</span>;
    case 'sent':
      return <span className="text-brand-dark-gray/60">✓</span>;
    case 'delivered':
      return <span className="text-brand-dark-gray/60">✓✓</span>;
    case 'read':
      return <span className="text-brand-text">✓✓</span>;
    case 'failed':
      return <AlertCircle size={12} className="text-red-500" />;
    default:
      return null;
  }
};

/**
 * 单条消息组件
 */
const MessageBubble = ({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) => {
  return (
    <div
      className={cn(
        'flex gap-2 max-w-[80%]',
        isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {/* 气泡 */}
      <div
        className={cn(
          'px-3 py-2 rounded-sm',
          isOwn
            ? 'bg-brand-text text-white'
            : 'bg-white border border-brand-border/30 text-brand-text'
        )}
      >
        <p className="font-roboto text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>

      {/* 时间和状态 */}
      <div
        className={cn(
          'flex flex-col justify-end',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        <time className="text-xs text-brand-dark-gray/40 font-roboto">
          {formatRelativeTime(message.createdAt)}
        </time>
        {isOwn && <MessageStatusIcon status={message.status} />}
      </div>
    </div>
  );
};

/**
 * ChatWindow 组件
 */
const ChatWindow = ({
  currentUser,
  targetUserId,
  targetUsername,
  targetAvatar,
  onBack,
  onViewProfile,
  className,
}: ChatWindowProps) => {
  // 状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 滚动容器引用
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * 检查是否为好友
   */
  useEffect(() => {
    const checkFriend = async () => {
      const mutual = followService.isMutualSync(currentUser.id, targetUserId);
      setIsFriend(mutual);
    };
    checkFriend();
  }, [currentUser.id, targetUserId]);

  /**
   * 加载消息
   */
  const loadMessages = useCallback(async () => {
    if (!isFriend) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await messageService.getMessages({
        userId: targetUserId,
        currentUserId: currentUser.id,
        limit: 30,
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
  }, [currentUser.id, targetUserId, isFriend]);

  /**
   * 初始化加载
   */
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  /**
   * 滚动到底部
   */
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  /**
   * 消息更新后滚动到底部
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * 发送消息
   */
  const handleSend = async () => {
    if (!inputValue.trim() || isSending || !isFriend) return;

    const content = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    try {
      const response = await messageService.sendMessage(
        { receiverId: targetUserId, content },
        currentUser.id
      );

      if (response.success && response.data) {
        setMessages((prev) => [...prev, response.data!]);
      } else {
        // 发送失败，恢复输入内容
        setInputValue(content);
        setError(response.error?.message || '发送失败');
      }
    } catch (err: any) {
      setInputValue(content);
      setError(err.message || '发送失败');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  /**
   * 处理键盘事件
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-brand-linen',
        'border border-brand-border/30 rounded-sm overflow-hidden',
        className
      )}
    >
      {/* 头部 */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white/95 border-b border-brand-border/30">
        {/* 返回按钮 */}
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 text-brand-dark-gray/60 hover:text-brand-text transition-colors"
            aria-label="返回"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {/* 对方信息 */}
        <button
          onClick={() => onViewProfile?.(targetUserId)}
          className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          <UserAvatar
            username={targetUsername}
            avatarUrl={targetAvatar}
            size="md"
          />
          <div>
            <h2 className="font-roboto font-medium text-brand-text">
              {targetUsername}
            </h2>
            <p className="text-xs text-brand-dark-gray/60 font-roboto">
              {isFriend ? '好友' : '非好友'}
            </p>
          </div>
        </button>

        {/* 更多操作 */}
        <button
          className="p-1.5 text-brand-dark-gray/40 hover:text-brand-text transition-colors"
          aria-label="更多操作"
        >
          <MoreVertical size={18} />
        </button>
      </header>

      {/* 消息区域 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {/* 加载中 */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin text-brand-text">
              <span className="inline-block w-5 h-5 border-2 border-brand-text border-t-transparent rounded-full" />
            </div>
          </div>
        )}

        {/* 非好友提示 */}
        {!isLoading && !isFriend && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User size={48} className="text-brand-dark-gray/30 mb-4" />
            <p className="font-roboto text-brand-dark-gray/60">
              仅好友可以发送消息
            </p>
            <p className="text-sm text-brand-dark-gray/40 mt-1">
              互相关注后即可开始聊天
            </p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="text-center py-4">
            <p className="text-red-500 text-sm font-roboto">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMessages}
              className="mt-2"
            >
              重试
            </Button>
          </div>
        )}

        {/* 消息列表 */}
        {!isLoading && isFriend && messages.length === 0 && (
          <div className="text-center py-8 text-brand-dark-gray/60">
            <p className="font-roboto">暂无消息</p>
            <p className="text-sm mt-1">发送第一条消息开始聊天</p>
          </div>
        )}

        {!isLoading && isFriend && messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === currentUser.id}
          />
        ))}

        {/* 加载更多 */}
        {isLoading && messages.length > 0 && (
          <div className="text-center py-2">
            <span className="text-xs text-brand-dark-gray/40">加载中...</span>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      {isFriend && (
        <footer className="px-4 py-3 bg-white/95 border-t border-brand-border/30">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              disabled={isSending}
              className="flex-1 border-brand-border/30 focus:border-brand-text"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              className="bg-brand-text text-white hover:bg-brand-dark-gray px-4"
              aria-label="发送"
            >
              <Send size={18} />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
};

export default ChatWindow;