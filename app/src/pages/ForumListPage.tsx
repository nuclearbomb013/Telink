/**
 * ForumListPage - 论坛列表页
 *
 * 显示所有论坛帖子，支持分类筛选、搜索、排序
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

import { forumService } from '@/services/forum.service';
import type { ForumPost, ForumCategory } from '@/services/forum.types';

import ForumPostCard from '@/components/Forum/ForumPostCard';
import ForumCategoryFilter from '@/components/Forum/ForumCategoryFilter';
import ForumPagination from '@/components/Forum/ForumPagination';
import ForumStatsSidebar from '@/components/Forum/ForumStatsSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * 排序选项
 */
type SortOption = 'default' | 'newest' | 'popular' | 'liked';

const SORT_OPTIONS: Array<{ value: SortOption; label: string; icon: React.ReactNode }> = [
  { value: 'default', label: '默认', icon: null },
  { value: 'newest', label: '最新', icon: null },
  { value: 'popular', label: '热门', icon: <TrendingUp size={14} /> },
  { value: 'liked', label: '最多赞', icon: null },
];

/**
 * ForumListPage 组件
 */
const ForumListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 状态
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 筛选和排序
  const [category, setCategory] = useState<ForumCategory | 'all'>(
    (searchParams.get('category') as ForumCategory | 'all') || 'all'
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'default'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );

  /**
   * 加载帖子列表
   */
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);

      const response = await forumService.getPosts({
        category: category === 'all' ? undefined : category,
        sortBy: sortBy === 'default' ? undefined : sortBy,
        page: currentPage,
        limit: 10,
        search: searchQuery || undefined,
      });

      if (response.success && response.data) {
        setPosts(response.data.posts);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      }

      setLoading(false);
    };

    loadPosts();
  }, [category, sortBy, currentPage, searchQuery]);

  /**
   * 更新 URL 参数
   */
  useEffect(() => {
    const params = new URLSearchParams();

    if (category !== 'all') params.set('category', category);
    if (sortBy !== 'default') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());

    setSearchParams(params);
  }, [category, sortBy, currentPage]);

  /**
   * 处理分类变化
   */
  const handleCategoryChange = (newCategory: ForumCategory | 'all') => {
    setCategory(newCategory);
    setCurrentPage(1);
  };

  /**
   * 处理排序变化
   */
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  /**
   * 处理搜索
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  /**
   * 处理页码变化
   */
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-brand-linen pt-32 pb-20">
      {/* 页面头部 */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {/* 标题区域 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-oswald font-light text-4xl text-brand-text mb-2">
              论坛
            </h1>
            <p className="font-roboto text-sm text-brand-dark-gray/70">
              技术交流、经验分享、互助成长
            </p>
          </div>

          <Link to="/forum/create">
            <Button className="bg-brand-text text-white hover:bg-brand-dark-gray transition-colors">
              <Plus size={18} className="mr-2" />
              发帖
            </Button>
          </Link>
        </div>

        {/* 分类筛选器 */}
        <div className="mb-6">
          <ForumCategoryFilter
            value={category}
            onChange={handleCategoryChange}
            className="mb-4"
          />
        </div>

        {/* 搜索和排序栏 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8 pb-6 border-b border-brand-border/30">
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="w-full sm:w-80">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
              />
              <Input
                type="text"
                placeholder="搜索帖子..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/50 border-brand-border/50"
              />
            </div>
          </form>

          {/* 排序选项 */}
          <div className="flex items-center gap-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-roboto transition-colors',
                  sortBy === option.value
                    ? 'bg-brand-text text-white'
                    : 'bg-white/50 text-brand-dark-gray hover:bg-brand-linen border border-brand-border/30'
                )}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 主内容区域 - 左右两栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧 - 帖子列表 */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-32 bg-brand-border/10 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4" aria-hidden="true">📋</div>
                <h3 className="font-oswald text-xl text-brand-text mb-2">
                  暂无帖子
                </h3>
                <p className="font-roboto text-brand-dark-gray/70 mb-6">
                  来发布第一个帖子吧！
                </p>
                <Link to="/forum/create">
                  <Button className="bg-brand-text text-white hover:bg-brand-dark-gray">
                    <Plus size={18} className="mr-2" />
                    发布第一个帖子
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* 帖子统计 */}
                <div className="mb-4 font-roboto text-sm text-brand-dark-gray/60">
                  共 {total} 个帖子
                </div>

                {/* 帖子列表 */}
                <div className="space-y-4">
                  {posts.map((post) => (
                    <ForumPostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <ForumPagination
                      page={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* 右侧 - 统计侧边栏 */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 lg:top-32 max-h-[calc(100vh-10rem)] overflow-y-auto">
              <ForumStatsSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumListPage;
