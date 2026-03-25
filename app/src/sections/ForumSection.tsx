/**
 * ForumSection - 首页论坛预览 Section
 *
 * 展示热门帖子，引导用户访问论坛
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, TrendingUp } from 'lucide-react';

import { forumService } from '@/services/forum.service';
import type { ForumPost, ForumStats } from '@/services/forum.types';

import ForumPostCard from '@/components/Forum/ForumPostCard';
import { Button } from '@/components/ui/button';

const ForumSection = () => {
  const [hotPosts, setHotPosts] = useState<ForumPost[]>([]);
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadForumData = async () => {
      const response = await forumService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
        setHotPosts(response.data.hotPosts.slice(0, 3));
      }
      setLoading(false);
    };

    loadForumData();
  }, []);

  return (
    <section className="py-20 lg:py-28 bg-brand-linen/50">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="font-oswald font-light text-3xl lg:text-4xl text-brand-text mb-2">
              社区论坛
            </h2>
            <p className="font-roboto text-sm text-brand-dark-gray/70">
              技术交流、经验分享、互助成长
            </p>
          </div>
          <Link to="/forum">
            <Button
              variant="outline"
              className="group border-brand-border/50 hover:border-brand-text hover:bg-brand-text hover:text-white transition-all"
            >
              访问论坛
              <ArrowRight
                size={16}
                className="ml-2 transform transition-transform group-hover:translate-x-1"
              />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-brand-border/10 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : hotPosts.length === 0 ? (
          <div className="text-center py-12 bg-white/50 rounded-lg border border-brand-border/30">
            <MessageSquare size={48} className="mx-auto mb-4 text-brand-light-gray" />
            <p className="font-roboto text-brand-dark-gray/60 mb-4">
              论坛刚刚上线，快来发布第一个帖子吧
            </p>
            <Link to="/forum/create">
              <Button className="bg-brand-text text-white hover:bg-brand-dark-gray">
                发布第一个帖子
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {hotPosts.map((post) => (
                <ForumPostCard
                  key={post.id}
                  post={post}
                  showAvatar={false}
                  showViews={false}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-brand-border/30">
              <StatItem label="总帖子数" value={stats?.totalPosts ?? 0} icon={MessageSquare} />
              <StatItem label="总回复数" value={stats?.totalReplies ?? 0} icon={MessageSquare} />
              <StatItem label="活跃用户" value={stats?.totalUsers ?? 0} icon={TrendingUp} />
            </div>
          </>
        )}
      </div>
    </section>
  );
};

function StatItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size: number }>;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-text/5 text-brand-text mb-2">
        <Icon size={20} />
      </div>
      <div className="font-oswald text-2xl font-light text-brand-text">
        {value}
      </div>
      <div className="font-roboto text-xs text-brand-dark-gray/60 mt-1">
        {label}
      </div>
    </div>
  );
}

export default ForumSection;

