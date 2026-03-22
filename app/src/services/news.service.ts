/**
 * News Service - 资讯服务
 *
 * 提供资讯获取、过滤、热点计算等功能
 * 当前使用 Mock 数据，预留真实 API 接口
 */

import type {
  NewsItem,
  NewsTimelineFilter,
  NewsTimelineResponse,
  HotspotConfig,
  NewsServiceResponse
} from './news.types';

// Mock 热词数据
const MOCK_HOT_KEYWORDS = [
  'AI技术', 'React 19', 'WebGL', 'CSS动画', '前端架构',
  'TypeScript', '性能优化', '用户体验', '设计系统', '响应式布局'
];

// Mock 资讯数据
const MOCK_NEWS_DATA: NewsItem[] = [
  {
    id: '1',
    title: 'React 19 正式发布：新特性与性能提升',
    content: 'React团队正式发布了React 19，带来了一系列新特性和性能提升。这次更新重点关注开发者体验的改善和性能优化，包括新的编译器优化、更好的错误处理机制以及对并发特性的进一步改进。',
    summary: 'React团队正式发布了React 19，带来了一系列新特性和性能提升。',
    publishDate: '2026-03-10T10:00:00Z',
    category: '前端开发',
    tags: ['React', 'JavaScript', '前端'],
    isHot: true,
    hotScore: 95,
    views: 12500,
    author: 'TechInk编辑部'
  },
  {
    id: '2',
    title: 'CSS新特性让网页动画更加流畅',
    content: '随着浏览器对CSS新特性的支持不断增强，开发者现在可以用更少的JavaScript代码实现更复杂的动画效果。新的motion-path、anchor-positioning和color-mix等特性正在改变网页设计的边界。',
    summary: '新的CSS特性让开发者能够创建更流畅、更自然的网页动画效果。',
    publishDate: '2026-03-09T14:30:00Z',
    category: 'CSS',
    tags: ['CSS', '动画', 'UI设计'],
    isHot: true,
    hotScore: 88,
    views: 8900,
    author: '前端专家'
  },
  {
    id: '3',
    title: 'WebGL在3D图形渲染中的应用实践',
    content: 'WebGL技术为Web平台带来了强大的3D图形渲染能力，越来越多的网站开始利用这一技术创造沉浸式的用户体验。本文将深入探讨WebGL在实际项目中的应用案例和最佳实践。',
    summary: 'WebGL技术为Web平台带来了强大的3D图形渲染能力。',
    publishDate: '2026-03-08T16:15:00Z',
    category: '图形渲染',
    tags: ['WebGL', '3D', '图形'],
    isHot: false,
    hotScore: 65,
    views: 5400,
    author: '图形技术研究员'
  },
  {
    id: '4',
    title: '前端性能优化最佳实践',
    content: '从前端工程师的角度分享性能优化的经验和技巧。我们将深入探讨代码分割、懒加载、缓存策略、资源优化等多个方面，帮助开发者构建更快的Web应用。',
    summary: '从前端工程师的角度分享性能优化的经验和技巧。',
    publishDate: '2026-03-07T09:20:00Z',
    category: '性能优化',
    tags: ['性能', '优化', '前端'],
    isHot: true,
    hotScore: 92,
    views: 11200,
    author: '性能专家'
  },
  {
    id: '5',
    title: 'TypeScript类型系统深度解析',
    content: 'TypeScript的类型系统是其最强大的特性之一。本文将深入探讨泛型、条件类型、映射类型等高级类型特性，以及它们在实际项目中的应用。',
    summary: '深入了解TypeScript的类型系统及其在实际项目中的应用。',
    publishDate: '2026-03-06T11:45:00Z',
    category: 'TypeScript',
    tags: ['TypeScript', '类型系统', '开发'],
    isHot: false,
    hotScore: 75,
    views: 7800,
    author: 'TS爱好者'
  },
  {
    id: '6',
    title: '用户体验设计的新趋势',
    content: '2026年的用户体验设计领域涌现了许多新趋势，包括微交互设计、无障碍设计的重要性提升、以及AI驱动的个性化体验。本文将分析这些趋势对未来设计的影响。',
    summary: '探索用户体验设计领域的新发展方向和设计理念。',
    publishDate: '2026-03-05T13:30:00Z',
    category: 'UX设计',
    tags: ['UX', '设计', '趋势'],
    isHot: true,
    hotScore: 85,
    views: 9600,
    author: '设计师联盟'
  },
  {
    id: '7',
    title: '响应式设计在移动时代的挑战',
    content: '随着移动设备种类日益多样化，响应式设计面临着新的挑战。从折叠屏手机到超宽显示器，设计师和开发者需要考虑更多的布局可能性。',
    summary: '响应式设计在移动设备普及时代面临的新挑战。',
    publishDate: '2026-03-04T15:10:00Z',
    category: '响应式设计',
    tags: ['响应式', '移动端', '设计'],
    isHot: false,
    hotScore: 68,
    views: 4500,
    author: '移动开发团队'
  },
  {
    id: '8',
    title: '设计系统的构建与维护',
    content: '如何构建和维护一个可持续发展的设计系统？本文将分享在实际项目中建设和维护设计系统的经验和教训，包括组件设计原则、版本管理、团队协作等方面。',
    summary: '如何构建和维护一个可持续发展的设计系统。',
    publishDate: '2026-03-03T08:25:00Z',
    category: '设计系统',
    tags: ['设计系统', 'UI', '组件库'],
    isHot: true,
    hotScore: 89,
    views: 10300,
    author: '设计系统团队'
  }
];

const DEFAULT_HOTSPOT_CONFIG: HotspotConfig = {
  hotThreshold: 80,
  decayFactor: 0.95,
  maxHotspots: 10,
  updateInterval: 300000, // 5分钟
};

class NewsService {
  private hotspotConfig: HotspotConfig;

  constructor(config: Partial<HotspotConfig> = {}) {
    this.hotspotConfig = {
      ...DEFAULT_HOTSPOT_CONFIG,
      ...config
    };
  }

  /**
   * 创建成功响应
   */
  private successResponse<T>(data: T): NewsServiceResponse<T> {
    return {
      success: true,
      data,
      timestamp: Date.now(),
    };
  }

  /**
   * 创建错误响应
   */
  private errorResponse<T>(
    code: string,
    message: string,
    details?: unknown
  ): NewsServiceResponse<T> {
    return {
      success: false,
      error: { code, message, details },
      timestamp: Date.now(),
    };
  }

  /**
   * 获取时间线资讯列表
   */
  async getNewsTimeline(
    filter: NewsTimelineFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<NewsServiceResponse<NewsTimelineResponse>> {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300));

      // 应用过滤条件
      let filteredItems = [...MOCK_NEWS_DATA];

      if (filter.categories && filter.categories.length > 0) {
        filteredItems = filteredItems.filter(item =>
          filter.categories!.includes(item.category)
        );
      }

      if (filter.tags && filter.tags.length > 0) {
        filteredItems = filteredItems.filter(item =>
          filter.tags!.some(tag => item.tags.includes(tag))
        );
      }

      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        filteredItems = filteredItems.filter(item =>
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query) ||
          item.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      if (filter.isHotOnly) {
        filteredItems = filteredItems.filter(item => item.isHot);
      }

      if (filter.dateRange) {
        const [startDate, endDate] = filter.dateRange;
        filteredItems = filteredItems.filter(item => {
          const itemDate = new Date(item.publishDate);
          return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
        });
      }

      // 按发布时间倒序排列
      filteredItems.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

      // 分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const items = filteredItems.slice(startIndex, endIndex);

      return this.successResponse({
        items,
        total: filteredItems.length,
        hasNext: endIndex < filteredItems.length,
        hotKeywords: [...MOCK_HOT_KEYWORDS],
      });
    } catch (error) {
      return this.errorResponse('FETCH_ERROR', '获取资讯列表失败', error);
    }
  }

  /**
   * 获取热点资讯
   */
  async getHotNews(limit: number = 5): Promise<NewsServiceResponse<NewsItem[]>> {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 200));

      const hotNews = [...MOCK_NEWS_DATA]
        .filter(item => item.isHot)
        .sort((a, b) => b.hotScore - a.hotScore)
        .slice(0, limit);

      return this.successResponse(hotNews);
    } catch (error) {
      return this.errorResponse('FETCH_ERROR', '获取热点资讯失败', error);
    }
  }

  /**
   * 获取特定资讯
   */
  async getNewsById(id: string): Promise<NewsServiceResponse<NewsItem>> {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 150));

      const news = MOCK_NEWS_DATA.find(item => item.id === id);
      if (!news) {
        return this.errorResponse('NOT_FOUND', '资讯不存在');
      }
      return this.successResponse(news);
    } catch (error) {
      return this.errorResponse('FETCH_ERROR', '获取资讯详情失败', error);
    }
  }

  /**
   * 更新热点配置
   */
  updateConfig(config: Partial<HotspotConfig>): void {
    this.hotspotConfig = {
      ...this.hotspotConfig,
      ...config
    };
  }

  /**
   * 获取当前热点配置
   */
  getConfig(): HotspotConfig {
    return { ...this.hotspotConfig };
  }

  /**
   * 模拟热点数据更新
   */
  simulateHotspotUpdate(): void {
    // 实际应用中这里会调用API来更新热点数据
    console.log('模拟热点数据更新...');
  }
}

export const newsService = new NewsService();