/**
 * 搜索栏组件
 *
 * 支持防抖、高级搜索选项和实时搜索建议的搜索栏组件。
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';

export interface SearchBarProps {
  /** 初始搜索词 */
  initialQuery?: string;
  /** 搜索占位符 */
  placeholder?: string;
  /** 防抖延迟（毫秒） */
  debounceDelay?: number;
  /** 是否显示高级筛选 */
  showAdvancedFilters?: boolean;
  /** 可用分类 */
  categories?: string[];
  /** 可用标签 */
  tags?: string[];
  /** 搜索回调 */
  onSearch: (query: string, filters?: SearchFilters) => void;
  /** 清空回调 */
  onClear?: () => void;
  /** 自定义类名 */
  className?: string;
}

export interface SearchFilters {
  category?: string;
  author?: string;
  tags?: string[];
  sortBy?: 'newest' | 'oldest' | 'title' | 'readTime';
}

/**
 * 搜索栏组件
 */
const SearchBar = ({
  initialQuery = '',
  placeholder = '搜索文章...',
  debounceDelay = 300,
  showAdvancedFilters = true,
  categories = [],
  tags = [],
  onSearch,
  onClear,
  className = '',
}: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'newest',
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /**
   * 防抖搜索
   */
  const debouncedSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const currentFilters = {
        ...filters,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      };
      onSearch(query, currentFilters);
    }, debounceDelay);
  }, [query, filters, selectedTags, onSearch, debounceDelay]);

  /**
   * 处理搜索词变化
   */
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // 显示搜索建议（简单实现）
    if (newQuery.trim()) {
      const searchTerms = [
        ...categories.filter(cat => cat.toLowerCase().includes(newQuery.toLowerCase())),
        ...tags.filter(tag => tag.toLowerCase().includes(newQuery.toLowerCase())),
      ].slice(0, 5);
      setSuggestions(searchTerms);
    } else {
      setSuggestions([]);
    }
  };

  /**
   * 处理搜索提交
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const currentFilters = {
      ...filters,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    };
    onSearch(query, currentFilters);
    setSuggestions([]);
  };

  /**
   * 清空搜索
   */
  const handleClear = () => {
    setQuery('');
    setFilters({ sortBy: 'newest' });
    setSelectedTags([]);
    setSuggestions([]);
    if (onClear) {
      onClear();
    }
    searchInputRef.current?.focus();
  };

  /**
   * 选择建议
   */
  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
    const currentFilters = {
      ...filters,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    };
    onSearch(suggestion, currentFilters);
  };

  /**
   * 切换标签选择
   */
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  /**
   * 防抖搜索效果
   */
  useEffect(() => {
    if (query.trim() || selectedTags.length > 0) {
      debouncedSearch();
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, selectedTags, debouncedSearch]);

  /**
   * 重置搜索状态
   * 当 initialQuery 变化时同步 query 状态 - 这是有效的状态同步模式
   */
  useEffect(() => {
    if (initialQuery !== query) {
      setQuery(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  return (
    <div className={`relative ${className}`}>
      {/* 搜索表单 */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder={placeholder}
            className="w-full px-6 py-4 pl-14 font-roboto text-brand-text bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-text/30 focus:border-brand-text transition-all"
            aria-label="搜索文章"
          />

          {/* 搜索图标 */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search size={20} className="text-brand-dark-gray/50" />
          </div>

          {/* 清空按钮 */}
          {(query || selectedTags.length > 0) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-brand-dark-gray/50 hover:text-brand-text transition-colors"
              aria-label="清空搜索"
            >
              <X size={20} />
            </button>
          )}

          {/* 高级筛选按钮 */}
          {showAdvancedFilters && (
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`absolute right-12 top-1/2 -translate-y-1/2 p-1 transition-colors ${
                isAdvancedOpen || selectedTags.length > 0 || filters.category || filters.author
                  ? 'text-brand-text'
                  : 'text-brand-dark-gray/50 hover:text-brand-text'
              }`}
              aria-label={isAdvancedOpen ? '关闭高级筛选' : '打开高级筛选'}
            >
              <Filter size={20} />
            </button>
          )}
        </div>

        {/* 搜索建议 */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-brand-border rounded-lg shadow-lg z-50">
            <div className="py-2">
              <div className="px-4 py-2 font-roboto text-xs uppercase tracking-wider text-brand-dark-gray/50">
                搜索建议
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-4 py-2 text-left font-roboto text-brand-dark-gray hover:bg-brand-linen/50 transition-colors flex items-center gap-2"
                >
                  <Search size={14} className="text-brand-dark-gray/30" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* 高级筛选面板 */}
      {showAdvancedFilters && isAdvancedOpen && (
        <div className="mt-4 p-6 bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 分类筛选 */}
            {categories.length > 0 && (
              <div>
                <label className="block font-roboto text-sm font-medium text-brand-text mb-2">
                  分类
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
                  className="w-full px-3 py-2 font-roboto text-brand-text bg-white/50 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-text/30 focus:border-brand-text transition-all"
                >
                  <option value="">全部分类</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 作者筛选 */}
            <div>
              <label className="block font-roboto text-sm font-medium text-brand-text mb-2">
                作者
              </label>
              <input
                type="text"
                value={filters.author || ''}
                onChange={(e) => setFilters({ ...filters, author: e.target.value || undefined })}
                placeholder="输入作者名"
                className="w-full px-3 py-2 font-roboto text-brand-text bg-white/50 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-text/30 focus:border-brand-text transition-all"
              />
            </div>

            {/* 排序方式 */}
            <div>
              <label className="block font-roboto text-sm font-medium text-brand-text mb-2">
                排序方式
              </label>
              <select
                value={filters.sortBy || 'newest'}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="w-full px-3 py-2 font-roboto text-brand-text bg-white/50 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-text/30 focus:border-brand-text transition-all"
              >
                <option value="newest">最新发布</option>
                <option value="oldest">最早发布</option>
                <option value="title">标题排序</option>
                <option value="readTime">阅读时间</option>
              </select>
            </div>

            {/* 标签筛选（多选） */}
            {tags.length > 0 && (
              <div>
                <label className="block font-roboto text-sm font-medium text-brand-text mb-2">
                  标签
                </label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 min-h-[42px] p-2 bg-white/50 border border-brand-border rounded-lg">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-brand-linen text-brand-text text-xs rounded"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="text-brand-dark-gray/50 hover:text-brand-text"
                          aria-label={`移除标签 ${tag}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {selectedTags.length === 0 && (
                      <span className="text-brand-dark-gray/50 text-sm">选择标签...</span>
                    )}
                  </div>

                  {/* 标签下拉菜单 */}
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-brand-border rounded-lg shadow-lg z-50">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`w-full px-3 py-2 text-left font-roboto text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-brand-linen text-brand-text'
                            : 'text-brand-dark-gray hover:bg-brand-linen/50'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 筛选操作按钮 */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setFilters({ sortBy: 'newest' });
                setSelectedTags([]);
              }}
              className="px-4 py-2 font-roboto text-sm text-brand-dark-gray hover:text-brand-text transition-colors"
            >
              重置筛选
            </button>
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(false)}
              className="px-4 py-2 font-roboto text-sm text-brand-text bg-white border border-brand-border rounded-lg hover:bg-brand-linen transition-colors"
            >
              应用筛选
            </button>
          </div>
        </div>
      )}

      {/* 当前筛选标签显示 */}
      {(selectedTags.length > 0 || filters.category || filters.author) && !isAdvancedOpen && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-roboto text-sm text-brand-dark-gray">当前筛选：</span>

          {filters.category && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-linen text-brand-text text-sm rounded-full">
              {filters.category}
              <button
                type="button"
                onClick={() => setFilters({ ...filters, category: undefined })}
                className="text-brand-dark-gray/50 hover:text-brand-text"
                aria-label={`移除分类筛选 ${filters.category}`}
              >
                <X size={14} />
              </button>
            </span>
          )}

          {filters.author && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-linen text-brand-text text-sm rounded-full">
              作者：{filters.author}
              <button
                type="button"
                onClick={() => setFilters({ ...filters, author: undefined })}
                className="text-brand-dark-gray/50 hover:text-brand-text"
                aria-label={`移除作者筛选 ${filters.author}`}
              >
                <X size={14} />
              </button>
            </span>
          )}

          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-brand-linen text-brand-text text-sm rounded-full"
            >
              #{tag}
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="text-brand-dark-gray/50 hover:text-brand-text"
                aria-label={`移除标签 ${tag}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={() => {
              setFilters({ sortBy: 'newest' });
              setSelectedTags([]);
            }}
            className="font-roboto text-sm text-brand-dark-gray/50 hover:text-brand-text transition-colors"
          >
            清除所有
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;