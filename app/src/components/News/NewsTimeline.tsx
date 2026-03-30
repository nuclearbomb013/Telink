/**
 * NewsTimeline - 资讯时间线主组件
 *
 * 实现时间线展示和热点跟随功能
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { gsap } from 'gsap';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { cn } from '@/lib/utils';
import { EASING, DURATION } from '@/constants/animation.constants';
import { notificationService } from '@/services/notification.service';
import TimelineItem from './TimelineItem';
import TimelineSidebar from './TimelineSidebar';
import HotspotTracker from './HotspotTracker';
import { newsService } from '@/services/news.service';
import type { NewsItem, NewsTimelineFilter } from '@/services/news.types';

interface NewsTimelineProps {
  className?: string;
}

const NewsTimeline: React.FC<NewsTimelineProps> = ({ className = '' }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [hotNews, setHotNews] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<NewsTimelineFilter>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReduceMotion();

  // 获取资讯数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await newsService.getNewsTimeline(filter);
      if (response.success && response.data) {
        setNewsItems(response.data.items);
      }

      // 获取热点资讯
      const hotResponse = await newsService.getHotNews(5);
      if (hotResponse.success && hotResponse.data) {
        setHotNews(hotResponse.data);
      }
    } catch (error) {
      console.error('获取资讯数据失败:', error);

      // 向用户显示错误通知
      notificationService.error('资讯加载失败', '无法获取最新资讯，请稍后再试');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 虚拟滚动配置
  const rowVirtualizer = useVirtualizer({
    count: newsItems.length,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) => {
      // 基于索引和内容长度动态估算高度
      const item = newsItems[index];
      // 标题长度影响高度
      const titleLength = item.title.length;
      // 摘要长度影响高度
      const summaryLength = item.summary.length;
      // 标签数量影响高度
      const tagsCount = item.tags ? item.tags.length : 0;

      // 基础高度 180px + 基于内容的额外高度
      let estimatedHeight = 180;

      // 标题长度每增加 20 个字符增加 10px 高度
      estimatedHeight += Math.floor(titleLength / 20) * 10;
      // 摘要长度每增加 100 个字符增加 10px 高度
      estimatedHeight += Math.floor(summaryLength / 100) * 10;
      // 每个标签增加 5px 高度（超过基础数量）
      estimatedHeight += Math.max(0, (tagsCount - 2)) * 5;

      // 确保在合理范围内
      return Math.min(Math.max(estimatedHeight, 150), 350);
    },
    overscan: 5,
  });

  // 热点更新回调
  const handleHotspotsUpdate = useCallback((hotItems: Array<{id: string; hotScore: number}>) => {
    setNewsItems(prevItems =>
      prevItems.map(item => {
        const hotItem = hotItems.find(h => h.id === item.id);
        return hotItem
          ? { ...item, isHot: hotItem.hotScore > 80, hotScore: hotItem.hotScore }
          : item;
      })
    );
  }, []);

  // 点击项目处理
  const handleItemClick = useCallback((item: NewsItem) => {
    setActiveItemId(item.id);
    // Navigation or other click handling can be added here
  }, []);

  // 处理侧边栏滚轮事件，防止滚动影响整个页面
  const handleSidebarWheel = useCallback((e: React.WheelEvent) => {
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
  }, []);

  // 分类过滤处理
  const handleCategoryToggle = useCallback((category: string) => {
    setFilter(prev => {
      const categories = prev.categories || [];
      const newCategories = categories.includes(category)
        ? categories.filter(cat => cat !== category)
        : [...categories, category];

      return {
        ...prev,
        categories: newCategories.length > 0 ? newCategories : undefined
      };
    });
  }, []);

  // 获取所有分类
  const allCategories = Array.from(
    new Set(newsItems.map(item => item.category))
  );

  // 动画效果
  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current) return;

    // 进场动画
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current!.querySelectorAll('.timeline-item'), {
        opacity: 0,
        y: 50,
        duration: DURATION.medium,
        ease: EASING.expoOut,
        stagger: DURATION.fast,
        delay: DURATION.fast,
      });
    });

    return () => ctx.revert();
  }, [newsItems, prefersReducedMotion]);

  return (
    <HotspotTracker onHotspotsUpdate={handleHotspotsUpdate}>
      <div className={cn("min-h-screen bg-brand-linen pt-20 pb-20", className)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 主内容区 - 时间线 */}
            <div className="lg:w-2/3">
              {/* 标题 */}
              <div className="mb-8">
                <h1 className="font-oswald font-light text-3xl md:text-4xl text-brand-text mb-2">
                  热点资讯时间线
                </h1>
                <p className="font-roboto text-brand-dark-gray/70">
                  跟随热点，掌握最新技术资讯动态
                </p>
              </div>

              {/* 时间线容器 - 使用动态高度计算 */}
              <div
                id="news-timeline-container"
                ref={containerRef}
                className="relative virtual-scroll-container"
                data-native-scroll="true"
                style={{ height: 'calc(100vh - 12rem)', overflow: 'auto', contain: 'strict' }}
              >
                {/* 时间轴中心线 */}
                <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-text/20 to-transparent transform -translate-x-1/2" />

                {/* 虚拟滚动容器 */}
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map(virtualRow => {
                    const item = newsItems[virtualRow.index];
                    const isActive = activeItemId === item.id;

                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="timeline-item"
                      >
                        <div className="ml-12 mr-4">
                          <TimelineItem
                            item={item}
                            isActive={isActive}
                            onClick={() => handleItemClick(item)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {loading && (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-text"></div>
                </div>
              )}
            </div>

            {/* 侧边栏 */}
            <div className="lg:w-1/3">
              <div
                className="sticky top-28 lg:top-32 max-h-[calc(100vh-10rem)] overflow-y-auto pr-2"
                style={{
                  overscrollBehavior: 'contain',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
                }}
                onWheel={handleSidebarWheel}
              >
                <TimelineSidebar
                  hotNews={hotNews}
                  categories={allCategories}
                  selectedCategories={filter.categories || []}
                  onCategoryToggle={handleCategoryToggle}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </HotspotTracker>
  );
};

export default NewsTimeline;