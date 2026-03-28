/***
 * Developer Showcase Section
 *
 * Main section component to display developers with filtering and sorting capabilities
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Search, X } from 'lucide-react';
import DeveloperCard from '../components/Developers/DeveloperCard';
import DeveloperFilters from '../components/Developers/DeveloperFilters';
import { userService } from '../services/user.service';
import type {
  DeveloperProfile,
  DeveloperFilter,
  DeveloperSortOption,
  GetDevelopersParams
} from '../services/developer.types';

export const DeveloperShowcaseSection: React.FC = () => {
  const navigate = useNavigate();
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Search overlay state and refs
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DeveloperProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchOverlayRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const defaultFilters: DeveloperFilter = {};
  const defaultSort: DeveloperSortOption = { field: 'reputationScore', direction: 'desc' };

  const [currentFilters, setCurrentFilters] = useState<DeveloperFilter>(defaultFilters);
  const [currentSort, setCurrentSort] = useState<DeveloperSortOption>(defaultSort);

  // Handle search overlay animation
  useEffect(() => {
    if (isSearchOverlayOpen && searchOverlayRef.current) {
      gsap.fromTo(
        searchOverlayRef.current,
        { clipPath: 'circle(0% at 50% 50%)' }, // 从中间开始展开
        { clipPath: 'circle(150% at 50% 50%)', duration: 0.8, ease: 'power3.out' }
      );
      // Focus input after animation
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOverlayOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close search with Escape
      if (e.key === 'Escape' && isSearchOverlayOpen) {
        setIsSearchOverlayOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        setHasSearched(false);
      }

      // Handle Enter key when search overlay is open
      if (e.key === 'Enter' && isSearchOverlayOpen && searchInputRef.current === document.activeElement) {
        performSearch(searchQuery);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOverlayOpen, searchQuery]);

  // Fetch developers based on filters and sort options
  const fetchDevelopers = async (page: number = 0) => {
    try {
      setLoading(true);

      const params: GetDevelopersParams = {
        filters: currentFilters,
        sort: currentSort,
        page,
        limit: 12, // Load 12 developers per page
      };

      const response = await userService.getDevelopers(params);

      if (response.developers) {
        if (page === 0) {
          setDevelopers(response.developers);
        } else {
          setDevelopers(prev => [...prev, ...response.developers]);
        }
        setHasMore(response.hasMore);
      } else {
        setError('Failed to load developers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Refresh developers when filters or sort options change
  useEffect(() => {
    fetchDevelopers(0); // Reset to first page when filters change
    setCurrentPage(0);
    // Note: fetchDevelopers intentionally not in deps - defined inside component, would cause re-renders
  }, [currentFilters, currentSort]);

  // Perform search function
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await userService.searchDevelopers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle loading more developers
  const loadMore = () => {
    const nextPage = currentPage + 1;
    fetchDevelopers(nextPage);
    setCurrentPage(nextPage);
  };

  // 滚轮事件处理函数
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    // 只有当内容可以水平滚动时才启用滚轮控制
    if (container.scrollWidth > container.clientWidth) {
      e.preventDefault(); // 阻止默认的垂直滚动
      container.scrollBy({
        left: e.deltaY > 0 ? 60 : -60, // 使用固定步长而非直接使用deltaY
        behavior: 'smooth'
      });
    }
  };

  // Handle filter changes
  const handleFiltersChange = (filters: DeveloperFilter) => {
    setCurrentFilters(filters);
  };

  // Handle sort changes
  const handleSortChange = (sort: DeveloperSortOption) => {
    setCurrentSort(sort);
  };

  // Reset filters
  const resetFilters = () => {
    setCurrentFilters(defaultFilters);
    setCurrentSort(defaultSort);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <h2 className="font-oswald font-light text-2xl text-brand-text mb-4">加载开发者失败</h2>
          <p className="text-brand-dark-gray">{error}</p>
          <button
            onClick={resetFilters}
            className="mt-4 px-6 py-2 bg-brand-text text-brand-linen font-roboto uppercase tracking-wider text-sm border border-brand-border transition-all duration-300 hover:bg-transparent hover:text-brand-text"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12" aria-labelledby="developers-heading">
      <div className="text-center mb-12">
        <h2 id="developers-heading" className="font-oswald font-light text-3xl md:text-4xl text-brand-text mb-4">优秀开发者</h2>
        <p className="text-brand-dark-gray max-w-2xl mx-auto">
          浏览我们社区中的杰出开发者，发现他们的作品，关注他们的动态
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">

        {/* Search Overlay */}
        {isSearchOverlayOpen && (
          <div
            ref={searchOverlayRef}
            className="fixed inset-0 z-[100] bg-brand-linen flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="搜索开发者"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsSearchOverlayOpen(false);
                setSearchQuery('');
                setSearchResults([]);
                setHasSearched(false);
              }
            }}
          >
            <button
              onClick={() => setIsSearchOverlayOpen(false)}
              className="absolute top-6 right-6 p-2 text-brand-text hover:text-brand-dark-gray transition-colors cursor-hover"
              aria-label="关闭搜索"
            >
              <X size={32} />
            </button>

            <div className="w-full max-w-2xl px-6">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    performSearch(searchQuery);
                  }
                }}
                placeholder="搜索开发者、技能、专长..."
                className="w-full bg-transparent border-b-2 border-brand-text py-4 text-3xl lg:text-5xl font-oswald font-light placeholder:text-brand-light-gray focus:outline-none"
              />
              <div className="mt-4 flex items-center justify-between text-sm text-brand-dark-gray">
                <p>按 Enter 搜索，按 ESC 关闭</p>
                <kbd className="hidden sm:inline-block px-2 py-1 bg-brand-border/20 rounded text-xs">
                  ESC
                </kbd>
              </div>

              {/* 显示搜索结果 */}
              {hasSearched && (
                <div className="mt-8 max-h-[60vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-oswald font-light text-xl text-brand-text">
                      {isSearching ? '搜索中...' : `找到 ${searchResults.length} 个结果`}
                    </h3>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setHasSearched(false);
                      }}
                      className="text-brand-dark-gray hover:text-brand-text"
                    >
                      清除搜索
                    </button>
                  </div>

                  {isSearching ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-text"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {searchResults.map((developer) => (
                        <div
                          key={developer.id}
                          className="p-4 border-b border-brand-border cursor-pointer hover:bg-brand-border/10"
                          onClick={() => {
                            // 关闭搜索界面，提供用户反馈
                            setIsSearchOverlayOpen(false);
                            setSearchQuery('');
                            setSearchResults([]);
                            setHasSearched(false);
                            // 添加导航到用户主页
                            navigate(`/user/${developer.id}`);
                          }}
                        >
                          <h4 className="font-oswald font-light text-lg text-brand-text">{developer.displayName || developer.username}</h4>
                          <p className="text-sm text-brand-dark-gray">{developer.bio?.substring(0, 100)}...</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(developer.skills || []).slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="text-xs bg-brand-border/20 px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-brand-dark-gray">未找到匹配的开发者</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setHasSearched(false);
                        }}
                        className="mt-4 px-4 py-2 border border-brand-border rounded hover:bg-brand-border/10"
                      >
                        清除搜索条件
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 显示高级筛选器（仅在没有搜索时） */}
              {!hasSearched && (
                <div className="mt-8">
                  <h3 className="font-oswald font-light text-xl text-brand-text mb-4">高级筛选</h3>
                  <DeveloperFilters
                    currentFilters={currentFilters}
                    currentSort={currentSort}
                    onFiltersChange={handleFiltersChange}
                    onSortChange={handleSortChange}
                    toggleFilters={() => {}}
                    filtersVisible={true}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Developers Grid */}
        <div className="col-span-full">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="font-oswald font-light text-xl text-brand-text">
                {developers.length > 0
                  ? `找到 ${developers.length} 位开发者`
                  : '没有找到符合条件的开发者'}
              </h3>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsSearchOverlayOpen(true)}
                className="magnetic cursor-hover p-2 text-brand-text hover:text-brand-dark-gray transition-colors flex items-center gap-2"
                aria-label="搜索开发者"
              >
                搜索开发者 <Search size={18} />
              </button>
              {Object.keys(currentFilters).some(key =>
                (currentFilters as any)[key] !== defaultFilters[key as keyof DeveloperFilter]
              ) ||
              currentSort.field !== defaultSort.field ||
              currentSort.direction !== defaultSort.direction ? (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-transparent text-brand-text font-roboto uppercase tracking-wider text-sm border-2 border-brand-border transition-all duration-300 hover:bg-brand-text hover:text-brand-linen"
                >
                  重置筛选
                </button>
              ) : null}
            </div>
          </div>

          {/* Loading State */}
          {loading && developers.length === 0 && (
            <div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
              onWheel={handleWheel}
            >
              <div className="flex justify-center items-center h-64 col-span-full snap-start flex-shrink-0">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-text"></div>
              </div>
            </div>
          )}

          {/* Developers Grid */}
          {!loading && developers.length > 0 && (
            <div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
              onWheel={handleWheel}
            >
              {developers.map((developer) => (
                <div key={developer.id} className="snap-start flex-shrink-0">
                  <DeveloperCard
                    developer={developer}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && developers.length === 0 && !error && (
            <div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
              onWheel={handleWheel}
            >
              <div className="text-center py-12 col-span-full snap-start flex-shrink-0">
                <h3 className="font-oswald font-light text-xl text-brand-text mb-2">未找到开发者</h3>
                <p className="text-brand-dark-gray mb-6">尝试调整您的筛选条件</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2 bg-brand-text text-brand-linen font-roboto uppercase tracking-wider text-sm border border-brand-border transition-all duration-300 hover:bg-transparent hover:text-brand-text"
                >
                  重置筛选
                </button>
              </div>
            </div>
          )}

          {/* Load More Button */}
          {!loading && hasMore && developers.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-8 py-3 bg-transparent text-brand-text font-roboto uppercase tracking-wider text-sm border-2 border-brand-border transition-all duration-300 hover:bg-brand-text hover:text-brand-linen disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DeveloperShowcaseSection;