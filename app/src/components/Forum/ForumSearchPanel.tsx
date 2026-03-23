/**
 * ForumSearchPanel - 论坛高级搜索面板
 *
 * 提供全文搜索、分类筛选、标签筛选、日期范围等功能
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Search, X, Filter, Calendar, Tag, Folder } from 'lucide-react';

import { cn } from '@/lib/utils';
import { forumService } from '@/services/forum.service';
import type { ForumCategory, ForumPost } from '@/services/forum.types';
import { simpleSearch, debounce } from '@/lib/search';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

/**
 * 搜索参数接口
 */
export interface SearchParams {
  /** 搜索关键词 */
  query: string;
  /** 选中的分类 */
  categories: ForumCategory[];
  /** 选中的标签 */
  tags: string[];
  /** 开始日期 */
  dateFrom?: string;
  /** 结束日期 */
  dateTo?: string;
  /** 作者 ID */
  authorId?: number;
  /** 仅看已解决 */
  solvedOnly?: boolean;
}

/**
 * 分类选项
 */
const categoryOptions: Array<{ value: ForumCategory; label: string; icon: string }> = [
  { value: 'general', label: '综合讨论', icon: '💬' },
  { value: 'help', label: '求助', icon: '❓' },
  { value: 'showcase', label: '作品展示', icon: '✨' },
  { value: 'jobs', label: '招聘求职', icon: '💼' },
  { value: 'announce', label: '公告', icon: '📢' },
];

/**
 * ForumSearchPanel 组件
 */
const ForumSearchPanel = ({
  onSearchResults,
  onClose,
}: {
  onSearchResults: (results: ForumPost[]) => void;
  onClose: () => void;
}) => {
  // 搜索参数
  const [params, setParams] = useState<SearchParams>({
    query: '',
    categories: [],
    tags: [],
    dateFrom: '',
    dateTo: '',
    authorId: undefined,
    solvedOnly: false,
  });

  // UI 状态
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ForumPost[]>([]);
  const [allPosts, setAllPosts] = useState<ForumPost[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  /**
   * 加载所有帖子用于搜索
   */
  useEffect(() => {
    const loadPosts = async () => {
      const response = await forumService.getPosts({});
      if (response.success && response.data) {
        setAllPosts(response.data.posts);
      }
    };
    loadPosts();
  }, []);

  /**
   * 执行搜索
   */
  const performSearch = useCallback(() => {
    setIsSearching(true);

    // 如果没有搜索条件，返回空结果
    if (!params.query && params.categories.length === 0 && params.tags.length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // 使用 simpleSearch 进行全文搜索
    let results = allPosts;

    // 全文搜索
    if (params.query) {
      const searchResults = simpleSearch(
        allPosts,
        params.query,
        ['title', 'content', 'tags'],
        { minMatchScore: 0.3 }
      );
      results = searchResults.map((r) => r.item);
    }

    // 分类筛选
    if (params.categories.length > 0) {
      results = results.filter((post) =>
        params.categories.includes(post.category)
      );
    }

    // 标签筛选
    if (params.tags.length > 0) {
      results = results.filter((post) =>
        post.tags?.some((tag) =>
          params.tags.some((searchTag) =>
            tag.toLowerCase().includes(searchTag.toLowerCase())
          )
        )
      );
    }

    // 日期范围筛选
    if (params.dateFrom) {
      const fromDate = new Date(params.dateFrom).getTime();
      results = results.filter((post) => post.createdAt >= fromDate);
    }

    if (params.dateTo) {
      const toDate = new Date(params.dateTo).getTime();
      results = results.filter((post) => post.createdAt <= toDate);
    }

    // 作者筛选
    if (params.authorId) {
      results = results.filter((post) => post.authorId === params.authorId);
    }

    // 仅看已解决（暂不启用，等待类型定义支持）
    // if (params.solvedOnly) {
    //   results = results.filter((post) => post.isSolved);
    // }

    setSearchResults(results);
    onSearchResults(results);
    setIsSearching(false);
  }, [params, allPosts, onSearchResults]);

  /**
   * 防抖搜索
   */
  const debouncedSearch = useMemo(
    () => debounce(performSearch, 300),
    [performSearch]
  );

  /**
   * 处理搜索词变化
   */
  useEffect(() => {
    if (params.query) {
      debouncedSearch();
    }
  }, [params.query, debouncedSearch]);

  /**
   * 处理分类切换
   */
  const toggleCategory = (category: ForumCategory) => {
    setParams((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  /**
   * 处理标签变化
   */
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const tagsArray = value
      .split(/[,\s]+/)
      .filter(Boolean)
      .map((tag) => tag.replace('#', ''));
    setParams((prev) => ({ ...prev, tags: tagsArray }));
  };

  /**
   * 清除所有筛选
   */
  const clearAllFilters = () => {
    setParams({
      query: '',
      categories: [],
      tags: [],
      dateFrom: '',
      dateTo: '',
      authorId: undefined,
      solvedOnly: false,
    });
    setSearchResults([]);
    onSearchResults([]);
  };

  /**
   * 执行搜索按钮点击
   */
  const handleSearchClick = () => {
    performSearch();
  };

  // 滚轮事件处理函数 - 用于防止筛选面板滚动影响页面
  const handleFiltersWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target as HTMLElement;

    // 判断滚动方向和边界
    const reachedTop = scrollTop === 0 && e.deltaY < 0;
    const reachedBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;

    // 如果已经到达顶部或底部，则允许事件冒泡
    if (!reachedTop && !reachedBottom) {
      // 阻止事件冒泡以防止页面滚动
      e.stopPropagation();
    }
  };

  return (
    <Card className="w-full bg-white/50 border-brand-border/30">
      <CardContent className="p-6">
        {/* 顶部搜索栏 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
            />
            <Input
              type="text"
              placeholder="搜索帖子标题、内容或标签..."
              value={params.query}
              onChange={(e) => setParams((prev) => ({ ...prev, query: e.target.value }))}
              className="pl-10 pr-4 py-2 bg-white border-brand-border/30 focus:border-brand-text/50"
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
            />
            {params.query && (
              <button
                type="button"
                onClick={() => setParams((prev) => ({ ...prev, query: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-light-gray hover:text-brand-text"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button
            onClick={handleSearchClick}
            disabled={isSearching || (!params.query && params.categories.length === 0 && params.tags.length === 0)}
            className="bg-brand-text text-white hover:bg-brand-dark-gray px-6"
          >
            {isSearching ? '搜索中...' : '搜索'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-brand-linen' : ''}
          >
            <Filter size={16} className="mr-2" />
            筛选
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-brand-light-gray hover:text-brand-text"
          >
            <X size={18} />
          </Button>
        </div>

        {/* 筛选面板 */}
        {showFilters && (
          <div
            className="space-y-4 pt-4 border-t border-brand-border/30 animate-in slide-in-from-top-2"
            onWheel={handleFiltersWheel}
          >
            {/* 分类筛选 */}
            <div>
              <label className="flex items-center gap-2 font-roboto text-sm font-medium text-brand-text mb-2">
                <Folder size={14} />
                分类筛选
              </label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCategory(cat.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm transition-all border',
                      params.categories.includes(cat.value)
                        ? 'bg-brand-text text-white border-brand-text'
                        : 'bg-white/50 text-brand-dark-gray border-brand-border/30 hover:border-brand-text/50'
                    )}
                  >
                    <span className="mr-1" aria-hidden="true">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 标签筛选 */}
            <div>
              <label className="flex items-center gap-2 font-roboto text-sm font-medium text-brand-text mb-2">
                <Tag size={14} />
                标签筛选
              </label>
              <div className="relative">
                <Tag
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light-gray"
                />
                <Input
                  type="text"
                  placeholder="输入标签，逗号或空格分隔..."
                  value={params.tags.join(', ')}
                  onChange={handleTagsChange}
                  className="pl-10 bg-white border-brand-border/30"
                />
              </div>
            </div>

            {/* 日期范围 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 font-roboto text-sm font-medium text-brand-text mb-2">
                  <Calendar size={14} />
                  开始日期
                </label>
                <Input
                  type="date"
                  value={params.dateFrom}
                  onChange={(e) => setParams((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  className="bg-white border-brand-border/30"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 font-roboto text-sm font-medium text-brand-text mb-2">
                  <Calendar size={14} />
                  结束日期
                </label>
                <Input
                  type="date"
                  value={params.dateTo}
                  onChange={(e) => setParams((prev) => ({ ...prev, dateTo: e.target.value }))}
                  className="bg-white border-brand-border/30"
                  min={params.dateFrom || undefined}
                />
              </div>
            </div>

            {/* 其他选项 */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.solvedOnly}
                  onChange={(e) => setParams((prev) => ({ ...prev, solvedOnly: e.target.checked }))}
                  className="w-4 h-4 rounded border-brand-border/30 text-brand-text focus:ring-brand-text"
                />
                <span className="font-roboto text-sm text-brand-dark-gray">仅看已解决</span>
              </label>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
              >
                清除所有
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSearchClick}
                className="bg-brand-text text-white hover:bg-brand-dark-gray"
              >
                应用筛选
              </Button>
            </div>
          </div>
        )}

        {/* 搜索结果统计 */}
        {params.query && (
          <div className="mt-4 pt-4 border-t border-brand-border/30">
            <p className="font-roboto text-sm text-brand-dark-gray/70">
              {isSearching ? (
                <span>搜索中...</span>
              ) : (
                <span>
                  找到 <strong className="text-brand-text">{searchResults.length}</strong> 个相关帖子
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ForumSearchPanel;
