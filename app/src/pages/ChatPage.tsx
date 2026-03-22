/**
 * ChatPage - 聊天页面
 *
 * 显示与单个好友的聊天对话
 * 遵循水墨/E-ink风格设计
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { userService } from '@/services/user.service';
import type { CurrentUser, User } from '@/services/user.types';

import ChatWindow from '@/components/Message/ChatWindow';

/**
 * ChatPage 组件
 */
const ChatPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  // 用户状态
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 加载数据
   */
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;

      setIsLoading(true);

      // 获取当前用户
      const user = userService.getCurrentUser();
      setCurrentUser(user);

      // 获取目标用户
      const response = await userService.getUserById(parseInt(userId, 10));
      if (response.success && response.data) {
        setTargetUser(response.data);
      }

      setIsLoading(false);
    };

    loadData();
  }, [userId]);

  /**
   * 处理返回
   */
  const handleBack = () => {
    navigate('/messages');
  };

  /**
   * 处理查看用户资料
   */
  const handleViewProfile = (profileUserId: number) => {
    navigate(`/user/${profileUserId}`);
  };

  // 加载中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-linen pt-20 pb-4">
        <div className="max-w-[680px] mx-auto px-4 h-[calc(100vh-6rem)] flex items-center justify-center">
          <div className="animate-spin text-brand-text">
            <span className="inline-block w-6 h-6 border-2 border-brand-text border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // 未登录
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-brand-linen pt-20 pb-4">
        <div className="max-w-[680px] mx-auto px-4">
          <div className="text-center py-12 bg-white/90 border border-brand-border/30 rounded-sm">
            <p className="font-roboto text-brand-dark-gray/60">请先登录</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-4 py-2 bg-brand-text text-white font-roboto hover:bg-brand-dark-gray transition-colors"
            >
              去登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 用户不存在
  if (!targetUser) {
    return (
      <div className="min-h-screen bg-brand-linen pt-20 pb-4">
        <div className="max-w-[680px] mx-auto px-4">
          <div className="text-center py-12 bg-white/90 border border-brand-border/30 rounded-sm">
            <p className="font-roboto text-brand-dark-gray/60">用户不存在</p>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-brand-text text-white font-roboto hover:bg-brand-dark-gray transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-linen pt-20 pb-4">
      <div className="max-w-[680px] mx-auto px-4 h-[calc(100vh-6rem)]">
        <ChatWindow
          currentUser={currentUser}
          targetUserId={targetUser.id}
          targetUsername={targetUser.username}
          targetAvatar={targetUser.avatar}
          onBack={handleBack}
          onViewProfile={handleViewProfile}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default ChatPage;