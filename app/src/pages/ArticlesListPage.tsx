import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { latestArticlesConfig } from '@/config';
import { getSubmittedArticles } from '@/services/submission.service';
import type { Article } from '@/services/articles.types';

/**
 * Articles List Page
 *
 * Displays all articles in a grid layout with search functionality.
 * Users can browse, search, and filter articles.
 * Includes both preset articles and user-submitted articles.
 */
const ArticlesListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all articles (preset + submitted)
  useEffect(() => {
    const loadArticles = () => {
      setIsLoading(true);
      
      // Get preset articles from config
      const presetArticles: Article[] = latestArticlesConfig.articles.map(article => ({
        ...article,
        readTime: article.readTime || 5,
      }));
      
      // Get submitted articles from localStorage
      const submittedArticles = getSubmittedArticles();
      
      // Combine and sort by publish date (newest first)
      const combined = [...submittedArticles, ...presetArticles].sort((a, b) => {
        const dateA = new Date(a.publishDate || '2000-01-01').getTime();
        const dateB = new Date(b.publishDate || '2000-01-01').getTime();
        return dateB - dateA;
      });
      
      setAllArticles(combined);
      setIsLoading(false);
    };

    loadArticles();
    
    // Listen for storage changes (in case articles are added in another tab)
    const handleStorageChange = () => {
      loadArticles();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter articles based on search query
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) {
      return allArticles;
    }

    const query = searchQuery.toLowerCase();
    return allArticles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.subtitle.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query) ||
      article.author?.toLowerCase().includes(query) ||
      article.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      article.excerpt?.toLowerCase().includes(query)
    );
  }, [allArticles, searchQuery]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-brand-linen pt-32 pb-20">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {/* Page header */}
        <header className="mb-12 lg:mb-16">
          <h1 className="font-oswald font-light text-4xl lg:text-5xl xl:text-6xl text-brand-text mb-4">
            文章专栏
          </h1>
          <p className="font-roboto text-lg text-brand-dark-gray max-w-2xl">
            探索技术前沿，分享开发经验，连接开发者社区。这里有最优质的技术文章和行业洞见。
          </p>
        </header>

        {/* Search bar */}
        <div className="mb-12">
          <div className="relative max-w-2xl">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="搜索文章标题、内容、标签或分类..."
              className="w-full px-6 py-4 pr-12 font-roboto text-brand-text bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-text/30 focus:border-brand-text transition-all"
              aria-label="搜索文章"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {searchQuery ? (
                <button
                  onClick={handleClearSearch}
                  className="text-brand-dark-gray/50 hover:text-brand-text transition-colors"
                  aria-label="清除搜索"
                >
                  <span className="text-xl">×</span>
                </button>
              ) : (
                <span className="text-brand-dark-gray/50" aria-hidden="true">🔍</span>
              )}
            </div>
          </div>
          <p className="mt-2 font-roboto text-sm text-brand-dark-gray">
            {isLoading ? (
              '加载中...'
            ) : (
              <>找到 <span className="font-medium text-brand-text">{filteredArticles.length}</span> 篇文章{searchQuery && `关于 "${searchQuery}"`}</>
            )}
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-border border-t-brand-text rounded-full animate-spin" />
          </div>
        )}

        {/* Articles grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {filteredArticles.map((article) => (
              <article
                key={`${article.id}-${article.slug}`}
                className="group relative bg-white/90 backdrop-blur-sm border border-brand-border/30 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
              >
                <Link
                  to={`/articles/${article.slug || article.id}`}
                  className="block"
                  aria-label={`阅读文章：${article.title}`}
                >
                  {/* Article image */}
                  <div className="relative overflow-hidden bg-brand-text aspect-[4/3]">
                    {article.image && article.image.trim() !== '' ? (
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                        width={400}
                        height={300}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-dark-gray/10">
                        <span className="text-brand-dark-gray/30 text-4xl" aria-hidden="true">📄</span>
                      </div>
                    )}
                    
                    {/* Submitted badge */}
                    {article.id >= 1000 && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-brand-text/80 text-white text-xs font-roboto rounded">
                        用户投稿
                      </div>
                    )}
                  </div>

                  {/* Article content */}
                  <div className="p-6">
                    {/* Category badge */}
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 font-roboto text-xs uppercase tracking-wider text-brand-dark-gray bg-brand-linen/50 rounded-full">
                        {article.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="font-oswald font-light text-2xl text-brand-text mb-2 group-hover:text-brand-dark-gray transition-colors line-clamp-2">
                      {article.title}
                    </h2>

                    {/* Subtitle */}
                    <p className="font-roboto text-sm text-brand-dark-gray mb-4 line-clamp-1">
                      {article.subtitle}
                    </p>

                    {/* Excerpt */}
                    {article.excerpt && (
                      <p className="font-roboto text-sm text-brand-dark-gray/70 mb-4 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}

                    {/* Meta information */}
                    <div className="flex items-center justify-between pt-4 border-t border-brand-border/30">
                      <div className="flex items-center gap-3">
                        {article.author && (
                          <span className="font-roboto text-xs text-brand-dark-gray">
                            {article.author}
                          </span>
                        )}
                        {article.publishDate && (
                          <span className="font-roboto text-xs text-brand-dark-gray/50">
                            {article.publishDate}
                          </span>
                        )}
                      </div>

                      {article.readTime && (
                        <span className="font-roboto text-xs text-brand-dark-gray/50">
                          {article.readTime} 分钟阅读
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 font-roboto text-xs text-brand-dark-gray/70 bg-brand-linen/30 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute inset-0 border-2 border-brand-text/0 group-hover:border-brand-text/20 transition-all duration-500 pointer-events-none rounded-lg" />
                </Link>
              </article>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredArticles.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4" aria-hidden="true">🔍</div>
            <h3 className="font-oswald text-2xl text-brand-text mb-2">
              {searchQuery ? '未找到相关文章' : '暂无文章'}
            </h3>
            <p className="font-roboto text-brand-dark-gray mb-6">
              {searchQuery 
                ? '尝试使用不同的关键词搜索，或清除搜索浏览所有文章。' 
                : '还没有文章发布，成为第一个投稿者吧！'}
            </p>
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="inline-flex items-center gap-2 px-6 py-3 font-roboto text-sm uppercase tracking-wider text-brand-text bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg hover:bg-brand-text hover:text-white transition-all duration-300"
              >
                清除搜索
              </button>
            )}
          </div>
        )}

        {/* Call to action */}
        {!isLoading && (
          <div className="mt-16 pt-8 border-t border-brand-border text-center">
            <p className="font-roboto text-brand-dark-gray mb-4">
              想要分享你的技术见解？
            </p>
            <Link
              to="/submit-article"
              className="inline-flex items-center gap-2 px-6 py-3 font-roboto text-sm uppercase tracking-wider text-brand-text bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg hover:bg-brand-text hover:text-white transition-all duration-300"
            >
              <span>投稿文章</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesListPage;
