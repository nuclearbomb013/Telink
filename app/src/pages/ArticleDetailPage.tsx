import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  Tag,
  FileUp,
  Trash2,
  FileText,
  ListTree,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { latestArticlesConfig } from '@/config/articles.config';
import { getSubmittedArticleBySlug, getSubmittedArticles, deleteSubmittedArticle } from '@/services/submission.service';
import { cn } from '@/lib/utils';
import { compileMarkdown } from '@/lib/markdownCompiler';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ArticleCard from '@/components/ArticleCard';
import {
  ReaderLayout,
  TableOfContents,
  ReadingProgress,
  ReaderPreferences,
  ImageViewer,
  MobileReadingBar,
  ReaderDetailSkeleton,
} from '@/components/reader';
import OptimizedImage from '@/components/OptimizedImage';
import {
  buildArticleReaderGuide,
  buildRelatedArticles,
  isReportArticle,
} from '@/lib/articleDiscovery';
import type { Article } from '@/services/articles.types';
import { useHistory } from '@/hooks/useHistory';
import { useReadingHistoryPosition } from '@/hooks/useReadingHistoryPosition';

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToHistory } = useHistory();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewerImage, setViewerImage] = useState<{ src: string; alt: string; caption?: string } | null>(null);

  const [submittedArticles, setSubmittedArticles] = useState<Article[]>([]);

  const allArticles = useMemo<Article[]>(() => {
    const presetArticles = latestArticlesConfig.articles.map(item => ({
      ...item,
      readTime: item.readTime || 5,
    }));
    return [...submittedArticles, ...presetArticles];
  }, [submittedArticles]);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      // Try backend API first
      const submittedArticle = await getSubmittedArticleBySlug(slug);
      if (cancelled) return;

      if (submittedArticle) {
        setArticle(submittedArticle);
        setIsSubmitted(true);
        setIsLoading(false);
        addToHistory('article', submittedArticle.id, submittedArticle.title, submittedArticle.slug);
        // Also load all submitted articles for related content
        const all = await getSubmittedArticles();
        if (!cancelled) setSubmittedArticles(all);
        return;
      }

      // Fall back to preset articles
      const presetArticle = latestArticlesConfig.articles.find(
        item => item.slug === slug || item.id.toString() === slug,
      );

      if (presetArticle) {
        const articleData = { ...presetArticle, readTime: presetArticle.readTime || 5 };
        setArticle(articleData);
        addToHistory('article', articleData.id, articleData.title, articleData.slug);
      } else {
        setArticle(null);
      }

      setIsSubmitted(false);
      setIsLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug, addToHistory]);

  const handleDelete = async () => {
    if (!article || !isSubmitted) return;
    const success = await deleteSubmittedArticle(article.id);
    if (success) navigate('/articles');
  };

  const articleContent = article?.content;
  const markdownDocument = useMemo(() => {
    if (!articleContent || typeof articleContent !== 'string') return null;
    return compileMarkdown(articleContent);
  }, [articleContent]);

  const reportLike = useMemo(() => (article ? isReportArticle(article) : false), [article]);
  const readerGuide = useMemo(
    () => (article ? buildArticleReaderGuide(article, markdownDocument) : null),
    [article, markdownDocument],
  );
  const relatedArticles = useMemo(
    () => (article ? buildRelatedArticles(article, allArticles) : []),
    [allArticles, article],
  );

  const handleImageClick = useCallback((src: string, alt: string, caption?: string) => {
    setViewerImage({ src, alt, caption });
  }, []);

  useReadingHistoryPosition({
    contentType: 'article',
    contentId: article?.id ?? null,
    enabled: Boolean(article),
  });

  if (isLoading) {
    return <ReaderDetailSkeleton />;
  }

  if (!article) {
    return (
      <div className="reader-shell">
        <div className="reader-container mx-auto px-6 py-16 text-center">
          <h1 className="reader-title mb-4 text-4xl">文章未找到</h1>
          <p className="mb-8 text-reader-secondary">你访问的文章不存在，或者已经被移除。</p>
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 border border-[var(--reader-line)] bg-[var(--reader-bg)] px-6 py-3 text-sm text-[var(--reader-ink)] no-underline transition-colors hover:border-[var(--reader-ink)]"
          >
            <ArrowLeft size={16} />
            返回文章列表
          </Link>
        </div>
      </div>
    );
  }

  const summaryLead = markdownDocument?.summary.lead || article.excerpt || article.subtitle || '';
  const summaryPoints = markdownDocument?.summary.keyPoints || [];
  const summarySections = markdownDocument?.summary.sectionTitles || [];
  const readingTime = markdownDocument?.readingTime || article.readTime || 5;

  return (
    <>
      <ReadingProgress />

      <ReaderLayout
        sidebarLeft={(
          <div>
            <Link to="/articles" className="reader-meta-back">
              <ArrowLeft size={14} />
              返回列表
            </Link>
            {article.author ? (
              <div>
                <div className="reader-meta-label">作者</div>
                <div className="reader-meta-value flex items-center gap-1.5">
                  <User size={14} />
                  {article.author}
                </div>
              </div>
            ) : null}
            {article.publishDate ? (
              <div>
                <div className="reader-meta-label">发布时间</div>
                <div className="reader-meta-value flex items-center gap-1.5">
                  <Calendar size={14} />
                  {article.publishDate}
                </div>
              </div>
            ) : null}
            <div>
              <div className="reader-meta-label">阅读时间</div>
              <div className="reader-meta-value flex items-center gap-1.5">
                <Clock size={14} />
                {readingTime} 分钟
              </div>
            </div>
            <div>
              <div className="reader-meta-label">内容类型</div>
              <div className="reader-meta-value">{reportLike ? '报告 / 洞察' : '文章 / 实战'}</div>
            </div>
            {isSubmitted ? (
              <div className="mt-4">
                <span className="bg-red-50 px-2 py-1 text-xs text-red-600">用户投稿</span>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mt-2 flex items-center gap-1 text-xs text-red-500 transition-colors hover:text-red-700"
                >
                  <Trash2 size={12} />
                  删除
                </button>
              </div>
            ) : null}
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
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1 border border-[var(--reader-line)] px-3 py-0.5 text-xs uppercase tracking-wider text-[var(--reader-ink-secondary)]">
              <FileText size={12} />
              {reportLike ? '报告型内容' : '文章'}
            </span>
          </div>
          <h1 className="reader-title">{article.title}</h1>
          {article.subtitle ? <p className="reader-subtitle">{article.subtitle}</p> : null}
          <p className="reader-lead">预计阅读 {readingTime} 分钟</p>
        </div>

        {(summaryLead || summaryPoints.length > 0 || summarySections.length > 0 || readerGuide) ? (
          <section className="reader-insight-panel">
            <div className="reader-insight-grid">
              <div className="reader-insight-block">
                <div className="reader-insight-label">
                  <Lightbulb size={14} />
                  {reportLike ? '先看结论' : '内容摘要'}
                </div>
                <p className="reader-insight-lead">{summaryLead || '正文已经准备好，可以直接开始阅读。'}</p>
              </div>

              {summaryPoints.length > 0 ? (
                <div className="reader-insight-block">
                  <div className="reader-insight-label">
                    <FileText size={14} />
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
                    <ListTree size={14} />
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

              {readerGuide ? (
                <>
                  <div className="reader-insight-block">
                    <div className="reader-insight-label">
                      <User size={14} />
                      适合谁读
                    </div>
                    <p className="reader-insight-lead">{readerGuide.audience}</p>
                  </div>

                  <div className="reader-insight-block">
                    <div className="reader-insight-label">
                      <Clock size={14} />
                      读完你会得到什么
                    </div>
                    <p className="reader-insight-lead">{readerGuide.outcome}</p>
                    {readerGuide.recommendedSections.length > 0 ? (
                      <div className="reader-insight-sections">
                        {readerGuide.recommendedSections.map(section => {
                          const target = markdownDocument?.toc.find(item => item.text === section);
                          return target ? (
                            <a key={target.id} href={`#${target.id}`} className="reader-insight-chip">
                              先读：{section}
                            </a>
                          ) : null;
                        })}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          </section>
        ) : null}

        {article.image ? (
          <OptimizedImage
            src={article.image}
            alt={article.title}
            width={800}
            height={400}
            sizes="(max-width: 1023px) calc(100vw - 2rem), 800px"
            className="reader-cover"
            loading="eager"
          />
        ) : null}

        <div className={cn(!article.image && 'mt-8')}>
          {article.content && typeof article.content === 'string' ? (
            <MarkdownRenderer
              document={markdownDocument ?? undefined}
              mode="reader"
              onImageClick={handleImageClick}
            />
          ) : article.excerpt ? (
            <div className="leading-relaxed text-[var(--reader-ink-secondary)]">
              <p className="text-lg" style={{ fontSize: 'var(--reader-font-size)', lineHeight: 'var(--reader-line-height)' }}>
                {article.excerpt}
              </p>
              <div className="mt-8 border border-[var(--reader-line)] p-6 text-center">
                <p>这篇内容暂时只有摘要，详细正文还未提供。</p>
              </div>
            </div>
          ) : (
            <div
              className="space-y-4 leading-relaxed text-[var(--reader-ink-secondary)]"
              style={{ fontSize: 'var(--reader-font-size)', lineHeight: 'var(--reader-line-height)' }}
            >
              <p>这里将展示文章的完整正文内容。</p>
            </div>
          )}
        </div>

        {article.tags && article.tags.length > 0 ? (
          <div className="mt-12 border-t border-[var(--reader-line)] pt-8">
            <div className="mb-4 flex items-center gap-2">
              <Tag size={16} className="text-[var(--reader-ink-secondary)]" />
              <span className="text-xs uppercase tracking-wider text-[var(--reader-ink-secondary)]">标签</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
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

        {relatedArticles.length > 0 ? (
          <section className="mt-12 border-t border-[var(--reader-line)] pt-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-oswald text-2xl font-light text-[var(--reader-ink)]">继续阅读</h2>
                <p className="mt-1 text-sm text-[var(--reader-ink-secondary)]">
                  顺着同主题或同标签继续找内容，不用回到列表页重新筛。
                </p>
              </div>
              <Link
                to="/articles"
                className="inline-flex items-center gap-2 text-sm text-[var(--reader-ink-secondary)] no-underline transition-colors hover:text-[var(--reader-ink)]"
              >
                查看全部
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {relatedArticles.map(item => (
                <div key={`${item.article.id}-${item.article.slug}`}>
                  <div className="mb-3 inline-flex rounded-full border border-[var(--reader-line)] bg-white px-3 py-1 text-xs text-[var(--reader-ink-secondary)]">
                    {item.reason}
                  </div>
                  <ArticleCard article={item.article} size="medium" />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-12 border-t border-[var(--reader-line)] pt-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 text-sm text-[var(--reader-ink-secondary)] no-underline transition-colors hover:text-[var(--reader-ink)]"
            >
              <ArrowLeft size={16} />
              返回文章列表
            </Link>
            <Link
              to="/submit-article"
              className="inline-flex items-center gap-2 text-sm text-[var(--reader-ink-secondary)] no-underline transition-colors hover:text-[var(--reader-ink)]"
            >
              <FileUp size={16} />
              投稿文章
            </Link>
          </div>
        </div>
      </ReaderLayout>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-w-md border border-[var(--reader-line)] bg-[var(--reader-bg)] p-6 shadow-2xl">
            <h3 className="mb-2 text-xl text-[var(--reader-ink)]">确认删除？</h3>
            <p className="mb-6 text-[var(--reader-ink-secondary)]">此操作将永久删除这篇文章，无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 px-4 py-2 text-sm text-white transition-colors hover:bg-red-600"
              >
                删除
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-[var(--reader-line)] px-4 py-2 text-sm text-[var(--reader-ink)] transition-colors hover:bg-[var(--reader-line)]"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
