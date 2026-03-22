/**
 * UserProfilePage - 用户个人主页
 *
 * 显示用户资料、统计信息、发帖历史
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MessageSquare, FileText, Heart, Award, Edit } from 'lucide-react';

import { cn } from '@/lib/utils';
import { userService } from '@/services/user.service';
import { forumService } from '@/services/forum.service';
import type { User } from '@/services/user.types';
import type { ForumPost } from '@/services/forum.types';

import UserAvatar from '@/components/Forum/UserAvatar';
import ForumPostCard from '@/components/Forum/ForumPostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * 格式化时间
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 格式化相对时间
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const day = 24 * 60 * 60 * 1000;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < day) return '今天';
  if (diff < week) return `${Math.floor(diff / day)} 天前`;
  if (diff < month) return `${Math.floor(diff / week)} 周前`;
  if (diff < year) return `${Math.floor(diff / month)} 个月前`;

  return `${Math.floor(diff / year)} 年前`;
}

/**
 * 统计卡片组件
 */
function StatCard({
  icon: Icon,
  label,
  value,
  color = 'text-brand-text',
}: {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-brand-linen/50 rounded-lg">
      <div className={cn('p-2 bg-white rounded-full', color)}>
        <Icon size={20} />
      </div>
      <div>
        <div className="font-oswald text-2xl font-light text-brand-text">
          {value}
        </div>
        <div className="font-roboto text-xs text-brand-dark-gray/60">
          {label}
        </div>
      </div>
    </div>
  );
}

/**
 * UserProfilePage 组件
 */
const UserProfilePage = () => {
  const { id: userIdStr } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const userId = userIdStr ? parseInt(userIdStr, 10) : null;

  // 状态
  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  /**
   * 加载数据
   */
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;

      setLoading(true);

      // 获取当前用户
      const currentUser = userService.getCurrentUser();
      setIsCurrentUser(currentUser?.id === userId);

      // 加载用户信息
      const userResponse = await userService.getUserById(userId);
      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
      }

      // 加载用户统计
      const statsResponse = await userService.getUserStats(userId);
      if (statsResponse.success && statsResponse.data) {
        // 加载用户帖子详情
        const postPromises = statsResponse.data.posts.map((p) =>
          forumService.getPostById(p.id)
        );
        const postResponses = await Promise.all(postPromises);
        const posts = postResponses
          .filter((r) => r.success && r.data)
          .map((r) => r.data as ForumPost);
        setUserPosts(posts);
      }

      setLoading(false);
    };

    loadData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-linen pt-32 pb-20">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-brand-border/20 rounded-lg" />
            <div className="h-64 bg-brand-border/20 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-linen pt-32 pb-20">
        <div className="max-w-[1000px] mx-auto px-6 text-center">
          <h1 className="font-oswald text-2xl text-brand-text mb-4">用户不存在</h1>
          <Button onClick={() => navigate('/forum')}>
            <ArrowLeft size={16} className="mr-2" />
            返回论坛
          </Button>
        </div>
      </div>
    );
  }

  const roleLabels = {
    admin: '管理员',
    moderator: '版主',
    user: '会员',
  };

  const roleColors = {
    admin: 'bg-brand-text text-white',
    moderator: 'bg-brand-dark-gray text-white',
    user: 'bg-brand-linen text-brand-dark-gray',
  };

  return (
    <div className="min-h-screen bg-brand-linen pt-32 pb-20">
      <div className="max-w-[1000px] mx-auto px-6">
        {/* 返回按钮 */}
        <Link
          to="/forum"
          className="inline-flex items-center gap-2 text-brand-dark-gray/70 hover:text-brand-text transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span className="font-roboto text-sm">返回论坛</span>
        </Link>

        {/* 用户资料卡片 */}
        <Card className="mb-6 overflow-hidden">
          {/* 封面 */}
          <div className="h-32 bg-gradient-to-r from-brand-text via-brand-dark-gray to-brand-text" />

          <CardContent className="p-6">
            {/* 头像和基本信息 */}
            <div className="flex flex-col sm:flex-row gap-6">
              {/* 头像 */}
              <div className="-mt-16">
                <UserAvatar
                  username={user.username}
                  avatarUrl={user.avatar}
                  size="xl"
                  className="border-4 border-white shadow-lg"
                />
              </div>

              {/* 信息 */}
              <div className="flex-1 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="font-oswald text-2xl font-light text-brand-text">
                        {user.username}
                      </h1>
                      {user.role && (
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs rounded-full',
                            roleColors[user.role]
                          )}
                        >
                          {roleLabels[user.role]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-brand-dark-gray/60">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        加入于 {formatDate(user.joinedAt)}
                      </span>
                      {user.lastActiveAt && (
                        <span>
                          最后活跃 {formatRelativeTime(user.lastActiveAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {isCurrentUser && (
                    <Button variant="outline" size="sm">
                      <Edit size={14} className="mr-2" />
                      编辑资料
                    </Button>
                  )}
                </div>

                {/* 个人简介 */}
                {user.bio && (
                  <p className="font-roboto text-sm text-brand-dark-gray mt-4 max-w-xl">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-brand-border/30">
              <StatCard
                icon={FileText}
                label="帖子"
                value={user.postCount}
                color="text-brand-text"
              />
              <StatCard
                icon={MessageSquare}
                label="评论"
                value={user.commentCount}
                color="text-brand-dark-gray"
              />
              <StatCard
                icon={Heart}
                label="获赞"
                value={user.likeCount}
                color="text-red-500"
              />
              <StatCard
                icon={Award}
                label="等级"
                value={user.role === 'admin' ? '管理员' : user.role === 'moderator' ? '版主' : 'Lv.' + Math.min(10, Math.floor(user.likeCount / 50) + 1)}
                color="text-brand-dark-gray"
              />
            </div>
          </CardContent>
        </Card>

        {/* 选项卡内容 */}
        <Tabs defaultValue="posts" className="mt-6">
          <TabsList className="bg-white/50 border border-brand-border/30">
            <TabsTrigger value="posts">发帖记录</TabsTrigger>
            <TabsTrigger value="activity">最近活动</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {userPosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-brand-dark-gray/60">
                  暂无发帖记录
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <ForumPostCard key={post.id} post={post} showAvatar={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center text-brand-dark-gray/60">
                功能开发中...
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfilePage;
