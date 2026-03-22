/**
 * ForumStatsSidebar - 论坛统计侧边栏
 *
 * 显示论坛统计数据、热门帖子、在线用户等信息
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, MessageSquare, Users, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

import { forumService } from '@/services/forum.service';
import { userService } from '@/services/user.service';
import type { ForumStats } from '@/services/forum.types';
import type { User } from '@/services/user.types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserAvatar from '@/components/Forum/UserAvatar';

/**
 * 统计卡片属性
 */
interface StatCardProps {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  value: number | string;
  color: string;
}

/**
 * 统计卡片组件
 */
function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-brand-linen/50 rounded-lg">
      <div className={cn('p-2 rounded-full', color)}>
        <Icon size={16} />
      </div>
      <div>
        <div className="font-oswald text-lg font-light text-brand-text">{value}</div>
        <div className="font-roboto text-xs text-brand-dark-gray/60">{label}</div>
      </div>
    </div>
  );
}

/**
 * ForumStatsSidebar 组件
 */
const ForumStatsSidebar = () => {
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * 加载统计数据
   */
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);

      // 加载论坛统计
      const forumStatsResponse = await forumService.getStats();
      if (forumStatsResponse.success && forumStatsResponse.data) {
        setStats(forumStatsResponse.data);

        // 加载活跃用户
        const usersResponse = await userService.getAllUsers();
        if (usersResponse.success && usersResponse.data) {
          setTopUsers(usersResponse.data.slice(0, 5));
        }
      }

      setLoading(false);
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="border-brand-border/30">
          <CardContent className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-brand-border/20 rounded w-1/3" />
              <div className="h-8 bg-brand-border/20 rounded w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <Card className="border-brand-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="font-oswald text-lg font-light text-brand-text">
            论坛统计
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatCard
            icon={FileText}
            label="帖子总数"
            value={stats?.totalPosts || 0}
            color="bg-brand-text/10 text-brand-text"
          />
          <StatCard
            icon={MessageSquare}
            label="回复总数"
            value={stats?.totalReplies || 0}
            color="bg-brand-dark-gray/10 text-brand-dark-gray"
          />
          <StatCard
            icon={Users}
            label="注册会员"
            value={stats?.totalUsers || 0}
            color="bg-brand-text/10 text-brand-text"
          />
        </CardContent>
      </Card>

      {/* 热门帖子 */}
      {stats?.hotPosts && stats.hotPosts.length > 0 && (
        <Card className="border-brand-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="font-oswald text-lg font-light text-brand-text flex items-center gap-2">
              <TrendingUp size={18} />
              热门帖子
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {stats.hotPosts.slice(0, 5).map((post, index) => (
                <li key={post.id}>
                  <Link
                    to={`/forum/${post.slug}`}
                    className="group block"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-medium',
                          index === 0 && 'bg-yellow-100 text-yellow-700',
                          index === 1 && 'bg-gray-100 text-gray-700',
                          index === 2 && 'bg-orange-100 text-orange-700',
                          index >= 3 && 'bg-brand-linen text-brand-dark-gray'
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-roboto text-sm text-brand-dark-gray group-hover:text-brand-text transition-colors line-clamp-2">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-brand-dark-gray/60">
                          <span>{post.likes} 赞</span>
                          <span>{post.replyCount} 回复</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 活跃用户 */}
      {topUsers.length > 0 && (
        <Card className="border-brand-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="font-oswald text-lg font-light text-brand-text flex items-center gap-2">
              <Users size={18} />
              活跃用户
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {topUsers.map((user) => (
                <li key={user.id}>
                  <Link to={`/user/${user.id}`} className="group flex items-center gap-3">
                    <UserAvatar
                      username={user.username}
                      avatarUrl={user.avatar}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-roboto text-sm text-brand-dark-gray group-hover:text-brand-text transition-colors truncate">
                          {user.username}
                        </span>
                        {user.role === 'admin' && (
                          <span className="px-1.5 py-0.5 bg-brand-text text-white text-xs rounded">
                            管理员
                          </span>
                        )}
                        {user.role === 'moderator' && (
                          <span className="px-1.5 py-0.5 bg-brand-dark-gray text-white text-xs rounded">
                            版主
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-brand-dark-gray/60">
                        <span>{user.postCount} 帖</span>
                        <span>{user.likeCount} 赞</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 最新帖子 */}
      {stats?.latestPostDate && (
        <Card className="border-brand-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="font-oswald text-lg font-light text-brand-text flex items-center gap-2">
              <Clock size={18} />
              最新动态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-roboto text-sm text-brand-dark-gray/70">
              最后更新于 {formatRelativeTime(stats.latestPostDate)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * 格式化相对时间
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < week) return `${Math.floor(diff / day)} 天前`;

  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export default ForumStatsSidebar;
