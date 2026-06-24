/**
 * HistoryPage - 浏览历史页面
 */

import { Link } from 'react-router-dom';
import { Clock, Trash2, ExternalLink, MessageSquare, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHistory } from '@/hooks/useHistory';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/Forum/EmptyState';

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: '论坛帖子',
  article: '文章',
  moment: '动态',
  news: '资讯',
};

const CONTENT_TYPE_LINKS: Record<string, (entry: { content_id: number | string; slug?: string }) => string> = {
  post: (entry) => `/forum/${entry.slug || entry.content_id}`,
  article: (entry) => `/articles/${entry.slug || entry.content_id}`,
  moment: () => `/moments`,
  news: (entry) => `/news/${entry.content_id}`,
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

const HistoryPage = () => {
  const { history, removeFromHistory, clearHistory } = useHistory();

  return (
    <div className="min-h-screen bg-brand-linen pt-32 pb-20">
      <div className="max-w-[800px] mx-auto px-5">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-oswald text-3xl text-brand-text mb-2">浏览历史</h1>
            <p className="text-brand-dark-gray">
              {history.length > 0 ? `共 ${history.length} 条记录` : '本地缓存，仅保存标题'}
            </p>
          </div>
          {history.length > 0 ? (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 size={14} className="mr-1" />
              清空历史
            </Button>
          ) : null}
        </header>

        {history.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="暂无浏览历史"
            description="浏览过的内容会自动记录在这里"
          />
        ) : (
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div
                key={`${entry.content_type}-${entry.content_id}-${index}`}
                className={cn(
                  'flex items-center gap-4 rounded-xl border border-[var(--reader-line,#CFCEC4)] bg-white/80 p-4 transition hover:border-[var(--reader-ink,#242722)]'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wider',
                      entry.content_type === 'post'
                        ? 'border border-blue-200 bg-blue-50 text-blue-700'
                        : entry.content_type === 'article'
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border border-[var(--reader-line,#CFCEC4)] bg-white text-[var(--reader-ink-secondary,#62675F)]'
                    )}>
                      {entry.content_type === 'post' ? <MessageSquare size={10} /> : entry.content_type === 'article' ? <FileText size={10} /> : <Sparkles size={10} />}
                      {CONTENT_TYPE_LABELS[entry.content_type] || entry.content_type}
                    </span>
                    <span className="text-xs text-brand-dark-gray/50">
                      {formatRelativeTime(entry.viewed_at)}
                    </span>
                  </div>
                  <Link
                    to={(CONTENT_TYPE_LINKS[entry.content_type] || (() => '/'))(entry)}
                    className="text-brand-text hover:text-[var(--reader-green,#315B48)] transition-colors font-medium line-clamp-1"
                  >
                    {entry.title || `#${entry.content_id}`}
                  </Link>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={(CONTENT_TYPE_LINKS[entry.content_type] || (() => '/'))(entry)}
                    className="p-2 rounded-full hover:bg-brand-linen/50 transition-colors text-brand-dark-gray/50 hover:text-brand-text"
                    title="查看"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <button
                    onClick={() => removeFromHistory(entry.content_type, entry.content_id)}
                    className="p-2 rounded-full hover:bg-red-50 transition-colors text-brand-dark-gray/50 hover:text-red-500"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
