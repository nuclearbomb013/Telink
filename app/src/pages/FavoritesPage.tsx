/**
 * FavoritesPage - 收藏页面
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ExternalLink, MessageSquare, FileText, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { EmptyFavorites } from '@/components/Forum/EmptyState';

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: '论坛帖子',
  article: '文章',
  moment: '动态',
  news: '资讯',
};

const CONTENT_TYPE_LINKS: Record<string, (_id: number) => string> = {
  post: (_id) => `/forum/${_id}`,
  article: (_id) => `/articles/${_id}`,
  moment: () => `/moments`,
  news: () => `/news-timeline`,
};

const FavoritesPage = () => {
  const { isAuthenticated } = useAuth();
  const { favorites, isLoading, total, hasMore, loadMore, removeFavorite } = useFavorites();
  const [removing, setRemoving] = useState<Set<number>>(new Set());

  const handleRemove = async (favoriteId: number) => {
    setRemoving(prev => new Set(prev).add(favoriteId));
    await removeFavorite(favoriteId);
    setRemoving(prev => {
      const next = new Set(prev);
      next.delete(favoriteId);
      return next;
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-linen pt-32 pb-20">
        <div className="max-w-[800px] mx-auto px-5 text-center">
          <Heart size={48} className="mx-auto text-brand-dark-gray/30 mb-4" />
          <h1 className="font-oswald text-3xl text-brand-text mb-2">我的收藏</h1>
          <p className="text-brand-dark-gray mb-6">请先登录以查看收藏内容</p>
          <Link to="/login">
            <Button>去登录</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-linen pt-32 pb-20">
      <div className="max-w-[800px] mx-auto px-5">
        <header className="mb-8">
          <h1 className="font-oswald text-3xl text-brand-text mb-2">我的收藏</h1>
          <p className="text-brand-dark-gray">
            {isLoading ? '加载中...' : `共 ${total} 条收藏`}
          </p>
        </header>

        {isLoading && favorites.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-brand-dark-gray/40" />
          </div>
        ) : favorites.length === 0 ? (
          <EmptyFavorites />
        ) : (
          <>
            <div className="space-y-3">
              {favorites.map(fav => (
                <div
                  key={fav.id}
                  className={cn(
                    'flex items-center gap-4 rounded-xl border border-[var(--reader-line,#CFCEC4)] bg-white/80 p-4 transition hover:border-[var(--reader-ink,#242722)]'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wider',
                        fav.content_type === 'post'
                          ? 'border border-blue-200 bg-blue-50 text-blue-700'
                          : fav.content_type === 'article'
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border border-[var(--reader-line,#CFCEC4)] bg-white text-[var(--reader-ink-secondary,#62675F)]'
                      )}>
                        {fav.content_type === 'post' ? <MessageSquare size={10} /> : fav.content_type === 'article' ? <FileText size={10} /> : <Sparkles size={10} />}
                        {CONTENT_TYPE_LABELS[fav.content_type] || fav.content_type}
                      </span>
                    </div>
                    <Link
                      to={(CONTENT_TYPE_LINKS[fav.content_type] || (() => '/'))(fav.content_id)}
                      className="text-brand-text hover:text-[var(--reader-green,#315B48)] transition-colors font-medium line-clamp-1"
                    >
                      {fav.title || `#${fav.content_id}`}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={(CONTENT_TYPE_LINKS[fav.content_type] || (() => '/'))(fav.content_id)}
                      className="p-2 rounded-full hover:bg-brand-linen/50 transition-colors text-brand-dark-gray/50 hover:text-brand-text"
                      title="查看"
                    >
                      <ExternalLink size={16} />
                    </Link>
                    <button
                      onClick={() => handleRemove(fav.id)}
                      disabled={removing.has(fav.id)}
                      className="p-2 rounded-full hover:bg-red-50 transition-colors text-brand-dark-gray/50 hover:text-red-500 disabled:opacity-50"
                      title="取消收藏"
                    >
                      {removing.has(fav.id) ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hasMore ? (
              <div className="mt-6 text-center">
                <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                  {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                  加载更多
                </Button>
              </div>
            ) : favorites.length > 0 ? (
              <p className="mt-6 text-center text-sm text-brand-dark-gray/60">已加载全部收藏</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
