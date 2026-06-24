/**
 * NewsDetailPage - 资讯详情阅读页
 *
 * 复用 ReaderLayout + MarkdownRenderer，为资讯提供与文章一致的
 * 长文阅读体验：TOC、阅读进度、偏好面板、代码高亮、图片灯箱。
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  Eye,
  Flame,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { newsService } from '@/services/news.service';
import { formatDate } from '@/lib/dateUtils';
import { compileMarkdown } from '@/lib/markdownCompiler';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  ReaderLayout,
  TableOfContents,
  ReadingProgress,
  ReaderPreferences,
  ImageViewer,
  MobileReadingBar,
  ReaderDetailSkeleton,
} from '@/components/reader';
import type { NewsItem } from '@/services/news.types';
import { useHistory } from '@/hooks/useHistory';
import { useReadingHistoryPosition } from '@/hooks/useReadingHistoryPosition';

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToHistory } = useHistory();

  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([]);
  const [viewerImage, setViewerImage] = useState<{ src: string; alt: string; caption?: string } | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const response = await newsService.getNewsById(id);
      if (cancelled) return;

      if (response.success && response.data) {
        setNewsItem(response.data);
        addToHistory('news', response.data.id, response.data.title);

        const res = await newsService.getNewsTimeline({}, 1, 50);
        if (cancelled || !res.success || !res.data) {
          setLoading(false);
          return;
        }
        const related = res.data.items
          .filter((item) => item.id !== id && item.category === response.data!.category)
          .slice(0, 3);
        setRelatedNews(related);
      } else {
        setNewsItem(null);
      }
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, addToHistory]);

  const newsContent = newsItem?.content;
  const markdownDocument = useMemo(() => {
    if (!newsContent) return null;
    return compileMarkdown(newsContent);
  }, [newsContent]);

  const handleImageClick = useCallback((src: string, alt: string, caption?: string) => {
    setViewerImage({ src, alt, caption });
  }, []);

  useReadingHistoryPosition({
    contentType: 'news',
    contentId: newsItem?.id ?? null,
    enabled: Boolean(newsItem),
  });

  if (loading) {
    return <ReaderDetailSkeleton />;
  }

  if (!newsItem) {
    return (
      <div className="reader-shell">
        <div className="reader-container mx-auto px-6 py-16 text-center">
          <h1 className="reader-title mb-4">资讯未找到</h1>
          <p className="mb-8 text-[var(--reader-ink-secondary)]">你访问的资讯不存在，或者已经被移除。</p>
          <Link
            to="/news-timeline"
            className="inline-flex items-center gap-2 border border-[var(--reader-line)] bg-[var(--reader-bg)] px-6 py-3 text-sm text-[var(--reader-ink)] no-underline transition-colors hover:border-[var(--reader-ink)]"
          >
            <ArrowLeft size={16} />
            返回资讯时间线
          </Link>
        </div>
      </div>
    );
  }

  const readingTime = markdownDocument?.readingTime || Math.max(1, Math.ceil(newsItem.content.length / 300));
  const summaryLead = markdownDocument?.summary.lead || newsItem.summary;
  const summaryPoints = markdownDocument?.summary.keyPoints || [];
  const summarySections = markdownDocument?.summary.sectionTitles || [];

  return (
    <>
      <ReadingProgress />

      <ReaderLayout
        sidebarLeft={(
          <div>
            <Link to="/news-timeline" className="reader-meta-back">
              <ArrowLeft size={14} />
              返回时间线
            </Link>
            <div>
              <div className="reader-meta-label">来源</div>
              <div className="reader-meta-value flex items-center gap-1.5">
                <User size={14} />
                {newsItem.author}
              </div>
            </div>
            <div>
              <div className="reader-meta-label">发布时间</div>
              <div className="reader-meta-value flex items-center gap-1.5">
                <Calendar size={14} />
                {formatDate(new Date(newsItem.publishDate).getTime())}
              </div>
            </div>
            <div>
              <div className="reader-meta-label">阅读时间</div>
              <div className="reader-meta-value flex items-center gap-1.5">
                <Clock size={14} />
                {readingTime} 分钟
              </div>
            </div>
            <div>
              <div className="reader-meta-label">浏览量</div>
              <div className="reader-meta-value flex items-center gap-1.5">
                <Eye size={14} />
                {newsItem.views.toLocaleString()}
              </div>
            </div>
            {newsItem.isHot && (
              <div>
                <div className="reader-meta-label">热度</div>
                <div className="reader-meta-value flex items-center gap-1.5">
                  <Flame size={14} className="text-red-600" />
                  <span className="text-red-600 font-medium">{newsItem.hotScore}</span>
                </div>
              </div>
            )}
          </div>
        )}
        sidebarRight={(
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[var(--reader-ink-secondary)]">工具</span>
              <ReaderPreferences />
            </div>
            {markdownDocument && markdownDocument.toc.length > 0 ? (
              <TableOfContents items={markdownDocument.toc} />
            ) : null}
          </div>
        )}
        mobileBar={<MobileReadingBar toc={markdownDocument?.toc || []} />}
      >
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-block border border-[var(--reader-line)] px-3 py-0.5 text-xs uppercase tracking-wider text-[var(--reader-ink-secondary)]">
              {newsItem.category}
            </span>
            {newsItem.isHot && (
              <span className="inline-flex items-center gap-1 border border-red-300 px-3 py-0.5 text-xs uppercase tracking-wider text-red-600">
                <Flame size={12} />
                热点
              </span>
            )}
          </div>
          <h1 className="reader-title">{newsItem.title}</h1>
          <p className="reader-lead">预计阅读 {readingTime} 分钟</p>
        </div>

        {(summaryLead || summaryPoints.length > 0 || summarySections.length > 0) ? (
          <section className="reader-insight-panel">
            <div className="reader-insight-grid">
              <div className="reader-insight-block">
                <div className="reader-insight-label">
                  内容摘要
                </div>
                <p className="reader-insight-lead">{summaryLead}</p>
              </div>

              {summaryPoints.length > 0 ? (
                <div className="reader-insight-block">
                  <div className="reader-insight-label">
                    关键要点
                  </div>
                  <ul className="reader-insight-list">
                    {summaryPoints.map(point => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {summarySections.length > 0 ? (
                <div className="reader-insight-block">
                  <div className="reader-insight-label">
                    本文结构
                  </div>
                  <div className="reader-insight-sections">
                    {summarySections.map(section => {
                      const target = markdownDocument?.toc.find(item => item.text === section);
                      return target ? (
                        <a key={target.id} href={`#${target.id}`} className="reader-insight-chip">
                          {section}
                        </a>
                      ) : (
                        <span key={section} className="reader-insight-chip">
                          {section}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <div className="mt-8">
          <MarkdownRenderer
            document={markdownDocument ?? undefined}
            mode="reader"
            onImageClick={handleImageClick}
          />
        </div>

        {newsItem.tags && newsItem.tags.length > 0 ? (
          <div className="mt-12 border-t border-[var(--reader-line)] pt-8">
            <div className="mb-4 flex items-center gap-2">
              <Tag size={16} className="text-[var(--reader-ink-secondary)]" />
              <span className="text-xs uppercase tracking-wider text-[var(--reader-ink-secondary)]">标签</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {newsItem.tags.map(tag => (
                <span
                  key={tag}
                  className="cursor-pointer border border-[var(--reader-line)] px-3 py-1 text-sm text-[var(--reader-ink-secondary)] transition-colors hover:border-[var(--reader-ink)] hover:text-[var(--reader-ink)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {relatedNews.length > 0 ? (
          <section className="mt-12 border-t border-[var(--reader-line)] pt-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-oswald text-2xl font-light text-[var(--reader-ink)]">相关资讯</h2>
                <p className="mt-1 text-sm text-[var(--reader-ink-secondary)]">
                  同分类的热点资讯，继续了解相关动态。
                </p>
              </div>
              <Link
                to="/news-timeline"
                className="inline-flex items-center gap-2 text-sm text-[var(--reader-ink-secondary)] no-underline transition-colors hover:text-[var(--reader-ink)]"
              >
                查看全部
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {relatedNews.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/news/${item.id}`)}
                  className="group border border-[var(--reader-line)] p-5 text-left transition-colors hover:border-[var(--reader-ink)]"
                >
                  <span className="text-xs uppercase tracking-wider text-[var(--reader-ink-secondary)]">
                    {item.category}
                  </span>
                  <h3 className="mt-2 font-oswald text-lg font-light text-[var(--reader-ink)] group-hover:text-[var(--reader-green)] transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--reader-ink-secondary)] line-clamp-2">
                    {item.summary}
                  </p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-12 border-t border-[var(--reader-line)] pt-8">
          <Link
            to="/news-timeline"
            className="inline-flex items-center gap-2 text-sm text-[var(--reader-ink-secondary)] no-underline transition-colors hover:text-[var(--reader-ink)]"
          >
            <ArrowLeft size={16} />
            返回资讯时间线
          </Link>
        </div>
      </ReaderLayout>

      {viewerImage ? (
        <ImageViewer
          src={viewerImage.src}
          alt={viewerImage.alt}
          caption={viewerImage.caption}
          onClose={() => setViewerImage(null)}
        />
      ) : null}
    </>
  );
}
