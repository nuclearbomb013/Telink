import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { latestArticlesConfig } from '@/config';
import { getSubmittedArticleBySlug } from '@/services/submission.service';
import { ArrowLeft, Clock, User, Calendar, Tag, FileUp, Trash2 } from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import type { Article } from '@/services/articles.types';

/**
 * Article Detail Page
 *
 * Displays the full content of a single article.
 * Supports both preset articles and user-submitted articles.
 * Renders Markdown content with syntax highlighting.
 */
const ArticleDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Find article from either submitted articles or preset config
  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // First check submitted articles
    const submittedArticle = getSubmittedArticleBySlug(slug);
    
    if (submittedArticle) {
      setArticle(submittedArticle);
      setIsLoading(false);
      return;
    }

    // Then check preset articles
    const presetArticle = latestArticlesConfig.articles.find(
      article => article.slug === slug || article.id.toString() === slug
    );

    if (presetArticle) {
      setArticle({
        ...presetArticle,
        readTime: presetArticle.readTime || 5,
      });
    }

    setIsLoading(false);
  }, [slug]);

  // Check if this is a user-submitted article
  const isSubmittedArticle = useMemo(() => {
    return article && article.id >= 1000;
  }, [article]);

  // Handle delete article
  const handleDelete = () => {
    if (!article || !isSubmittedArticle) return;
    
    import('@/services/submission.service').then(({ deleteSubmittedArticle }) => {
      const success = deleteSubmittedArticle(article.id);
      if (success) {
        navigate('/articles');
      }
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-linen pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-border border-t-brand-text rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Article not found
  if (!article) {
    return (
      <div className="min-h-screen bg-brand-linen pt-32 pb-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="text-center py-16">
            <div className="text-6xl mb-4" aria-hidden="true">📄</div>
            <h1 className="font-oswald text-4xl text-brand-text mb-4">文章未找到</h1>
            <p className="font-roboto text-brand-dark-gray mb-8">
              抱歉，您要访问的文章不存在或已被移除。
            </p>
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 px-6 py-3 font-roboto text-sm uppercase tracking-wider text-brand-text bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg hover:bg-brand-text hover:text-white transition-all duration-300"
            >
              <ArrowLeft size={16} />
              返回文章列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-linen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        {/* Back navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 font-roboto text-sm text-brand-dark-gray hover:text-brand-text transition-colors"
          >
            <ArrowLeft size={16} />
            返回文章列表
          </Link>
          
          {/* Submitted article actions */}
          {isSubmittedArticle && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-brand-text/10 text-brand-text text-xs font-roboto rounded">
                用户投稿
              </span>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="删除文章"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-text/50 backdrop-blur-sm">
            <div className="bg-brand-linen rounded-lg p-6 max-w-md mx-4 shadow-2xl">
              <h3 className="font-oswald text-xl text-brand-text mb-2">确认删除？</h3>
              <p className="font-roboto text-brand-dark-gray mb-6">
                此操作将永久删除该文章，无法撤销。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white font-roboto text-sm rounded-lg hover:bg-red-600 transition-colors"
                >
                  删除
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-brand-border/30 text-brand-text font-roboto text-sm rounded-lg hover:bg-brand-border/50 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Article header */}
        <header className="mb-8">
          {/* Category */}
          <div className="mb-4">
            <span className="inline-block px-3 py-1 font-roboto text-xs uppercase tracking-wider text-brand-dark-gray bg-brand-linen/50 rounded-full">
              {article.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-oswald font-light text-4xl lg:text-5xl xl:text-6xl text-brand-text mb-4">
            {article.title}
          </h1>

          {/* Subtitle */}
          <p className="font-roboto text-xl text-brand-dark-gray mb-6">
            {article.subtitle}
          </p>

          {/* Meta information */}
          <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-brand-border">
            {article.author && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-brand-dark-gray/50" />
                <span className="font-roboto text-sm text-brand-dark-gray">作者：</span>
                <span className="font-roboto font-medium text-brand-text">{article.author}</span>
              </div>
            )}

            {article.publishDate && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-brand-dark-gray/50" />
                <span className="font-roboto text-sm text-brand-dark-gray">发布日期：</span>
                <span className="font-roboto text-brand-text">{article.publishDate}</span>
              </div>
            )}

            {article.readTime && (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-brand-dark-gray/50" />
                <span className="font-roboto text-sm text-brand-dark-gray">阅读时间：</span>
                <span className="font-roboto text-brand-text">{article.readTime} 分钟</span>
              </div>
            )}
          </div>
        </header>

        {/* Article image */}
        {article.image && (
          <div className="mb-8 rounded-lg overflow-hidden bg-brand-dark-gray/5">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-auto max-h-[500px] object-cover"
              loading="eager"
              width={800}
              height={400}
            />
          </div>
        )}

        {/* Article content - Rendered Markdown */}
        <article className="bg-white rounded-lg p-8 lg:p-12 shadow-sm">
          {article.content ? (
            typeof article.content === 'string' ? (
              <MarkdownRenderer content={article.content} />
            ) : (
              <div className="font-roboto text-red-500">
                <p>内容格式错误，无法显示。内容应该是字符串类型，但收到的是 {typeof article.content} 类型。</p>
              </div>
            )
          ) : article.excerpt ? (
            <div className="font-roboto text-brand-dark-gray leading-relaxed">
              <p className="text-lg">{article.excerpt}</p>
              <div className="mt-8 p-6 bg-brand-linen/30 rounded-lg text-center">
                <p className="text-brand-dark-gray/70">
                  本文章暂无详细内容，仅展示摘要。
                </p>
              </div>
            </div>
          ) : (
            <div className="font-roboto text-brand-dark-gray leading-relaxed space-y-6">
              <p className="text-lg">
                这里是文章的完整内容。在实际应用中，这里会显示从数据库或API获取的完整文章内容。
              </p>
              <p>
                文章内容将按照技术文档的标准格式进行排版，确保良好的阅读体验。
                支持代码块、引用、列表、表格等多种格式。
              </p>
              <h2 className="font-oswald text-2xl text-brand-text mt-8">示例章节</h2>
              <p>
                这是文章的一个示例章节。在实际的文章中，这里会有详细的技术分析、代码示例、
                最佳实践建议等内容。
              </p>
              <pre className="bg-brand-linen p-4 rounded-lg overflow-x-auto border border-brand-border">
                <code className="font-mono text-sm">{`// 示例代码
function example() {
  console.log("Hello, TechInk!");
}`}</code>
              </pre>
              <p>
                文章内容支持丰富的排版格式，帮助读者更好地理解技术概念和实现细节。
              </p>
            </div>
          )}
        </article>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-brand-border">
            <div className="flex items-center gap-2 mb-4">
              <Tag size={16} className="text-brand-dark-gray/50" />
              <h3 className="font-roboto text-sm uppercase tracking-wider text-brand-dark-gray">
                标签
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 font-roboto text-sm text-brand-dark-gray bg-brand-linen/50 rounded-full hover:bg-brand-text hover:text-white transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Article navigation */}
        <div className="mt-12 pt-8 border-t border-brand-border">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 font-roboto text-sm text-brand-dark-gray hover:text-brand-text transition-colors"
            >
              <ArrowLeft size={16} />
              返回文章列表
            </Link>
            <Link
              to="/submit-article"
              className="inline-flex items-center gap-2 font-roboto text-sm text-brand-dark-gray hover:text-brand-text transition-colors"
            >
              <FileUp size={16} />
              投稿文章
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailPage;
