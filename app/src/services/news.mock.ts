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
    content: `React 团队正式发布了 React 19，带来了一系列新特性和性能提升。这次更新重点关注开发者体验的改善和性能优化，包括新的编译器优化、更好的错误处理机制以及对并发特性的进一步改进。

## 核心新特性

### Actions 与异步过渡

React 19 引入了 Actions，简化了异步操作的状态管理。现在你可以直接在表单提交中处理异步逻辑：

\`\`\`tsx
function UpdateName() {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const error = await updateName(name);
      if (error) {
        setError(error);
        return;
      }
      redirect("/path");
    });
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSubmit} disabled={isPending}>
        更新
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
\`\`\`

### 编译器优化

React Compiler 是 React 19 最重要的基础设施改进。它不再需要手动使用 \`useMemo\`、\`useCallback\` 和 \`memo\` 进行记忆化：

\`\`\`tsx
// 以前：需要手动 memo
const filteredTodos = useMemo(
  () => todos.filter(t => t.completed),
  [todos]
);

// React 19：编译器自动优化
const filteredTodos = todos.filter(t => t.completed);
\`\`\`

## 性能提升

- **更快的 hydrate**：并发渲染优化了水合过程
- **更小的打包体积**：Tree shaking 改进减少了约 15% 的体积
- **更好的 Suspense**：支持更多场景的流式渲染

> React 19 的编译器在编译阶段自动分析组件，生成优化后的代码，开发者不再需要手动优化。

## 升级建议

建议先在非关键路径项目中试用 React 19，确认依赖兼容性后再全面升级。`,
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
    content: `随着浏览器对 CSS 新特性的支持不断增强，开发者现在可以用更少的 JavaScript 代码实现更复杂的动画效果。新的 motion-path、anchor-positioning 和 color-mix 等特性正在改变网页设计的边界。

## Motion Path：沿路径运动

\`motion-path\` 属性让元素沿着任意 SVG 路径运动，不再需要 JavaScript 计算坐标：

\`\`\`css
.flying-element {
  offset-path: path("M 0 0 L 100 50 L 200 0");
  animation: move 3s ease-in-out infinite;
}

@keyframes move {
  0% { offset-distance: 0%; }
  100% { offset-distance: 100%; }
}
\`\`\`

## Anchor Positioning：锚点定位

不再需要 JavaScript 来实现 tooltip、popover 等浮动元素的智能定位：

\`\`\`css
.tooltip {
  position: absolute;
  position-anchor: --my-anchor;
  position-area: top;
  position-try-fallbacks: flip-block, flip-inline;
}

.button {
  anchor-name: --my-anchor;
}
\`\`\`

## Color Mix：动态颜色混合

\`\`\`css
.button {
  background: color-mix(in srgb, var(--brand-color) 80%, white);
}
.button:hover {
  background: color-mix(in srgb, var(--brand-color) 80%, black 15%);
}
\`\`\`

这些特性让纯 CSS 实现复杂动画成为可能，减少了对 JavaScript 动画库的依赖。`,
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
    content: `WebGL 技术为 Web 平台带来了强大的 3D 图形渲染能力，越来越多的网站开始利用这一技术创造沉浸式的用户体验。本文将深入探讨 WebGL 在实际项目中的应用案例和最佳实践。

## WebGL 基础

WebGL 是基于 OpenGL ES 的 JavaScript API，允许在浏览器中渲染硬件加速的 3D 图形：

\`\`\`javascript
const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl');

const vertexShaderSource = \`
  attribute vec3 aPosition;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
  }
\`\`\`;

const fragmentShaderSource = \`
  precision mediump float;
  void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
\`\`\`;
\`\`\`

## 性能优化要点

1. **减少 Draw Call**：合并几何体，使用实例化渲染
2. **纹理压缩**：使用 ASTC/ETC2 压缩格式减少内存带宽
3. **帧率控制**：根据设备能力动态调整渲染精度

> 在移动设备上，WebGL 性能瓶颈通常出现在填充率而非顶点处理。优先优化片元着色器。`,
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
    content: `从前端工程师的角度分享性能优化的经验和技巧。我们将深入探讨代码分割、懒加载、缓存策略、资源优化等多个方面，帮助开发者构建更快的 Web 应用。

## 代码分割与懒加载

使用动态 \`import()\` 实现路由级和组件级代码分割：

\`\`\`typescript
const AdminDashboard = lazy(() => import('./AdminDashboard'));

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <AdminDashboard />
    </Suspense>
  );
}
\`\`\`

## 资源优化清单

| 优化项 | 方法 | 预期收益 |
|--------|------|----------|
| 图片 | WebP/AVIF + 响应式 srcset | 减少 30-50% |
| 字体 | font-display: swap + 子集化 | 减少 60-80% |
| JS | Tree shaking + 代码分割 | 减少 20-40% |
| CSS | Critical CSS 内联 | 提升 FCP 200ms+ |

## 缓存策略

\`\`\`typescript
// Service Worker 缓存策略
const cacheStrategy = {
  // HTML：网络优先
  html: 'NetworkFirst',
  // JS/CSS：缓存优先 + 后台更新
  assets: 'StaleWhileRevalidate',
  // 图片：缓存优先
  images: 'CacheFirst',
};
\`\`\`

> 性能优化不是一次性的工作，而是一个持续监控、分析、改进的循环。`,
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
    content: `TypeScript 的类型系统是其最强大的特性之一。本文将深入探讨泛型、条件类型、映射类型等高级类型特性，以及它们在实际项目中的应用。

## 条件类型与 infer

条件类型让我们可以根据输入类型动态决定输出类型：

\`\`\`typescript
type UnpackPromise<T> = T extends Promise<infer U> ? U : T;

type R1 = UnpackPromise<Promise<string>>; // string
type R2 = UnpackPromise<number>;          // number

// 递归解包嵌套 Promise
type DeepUnpackPromise<T> = T extends Promise<infer U>
  ? DeepUnpackPromise<U>
  : T;
\`\`\`

## 映射类型实战

\`\`\`typescript
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

type Optional<T> = {
  [P in keyof T]?: T[P];
};

// 将所有属性变为可空
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};
\`\`\`

## 模板字面量类型

\`\`\`typescript
type EventName = \`on\${Capitalize<string>}Change\`;
// "onDataChange" | "onStateChange" | ...

type PropPath<T, P extends string = ''> = ...
\`\`\`

> 类型系统不只是编译时的约束，更是设计 API 时的思维工具。好的类型定义本身就是最好的文档。`,
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
    content: `2026 年的用户体验设计领域涌现了许多新趋势，包括微交互设计、无障碍设计的重要性提升、以及 AI 驱动的个性化体验。本文将分析这些趋势对未来设计的影响。

## 微交互设计

微交互是提升产品质感的关键细节。好的微交互应该是：

- **可感知**：用户能立即感受到反馈
- **有意义**：传达状态变化而非纯装饰
- **克制**：不打断用户的主要任务

## 无障碍设计

无障碍不再是可选的附加项，而是产品设计的基础要求：

> 根据 WCAG 2.2 标准，所有交互元素必须满足 4.5:1 的文字对比度要求，并支持完整的键盘导航。

## AI 驱动的个性化

AI 正在改变个性化体验的边界，从内容推荐到界面自适应，都在让每个用户看到"为自己定制"的产品。`,
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
    content: `随着移动设备种类日益多样化，响应式设计面临着新的挑战。从折叠屏手机到超宽显示器，设计师和开发者需要考虑更多的布局可能性。

## 容器查询

容器查询让组件根据其父容器尺寸而非视口尺寸响应：

\`\`\`css
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
\`\`\`

## 折叠屏适配

折叠屏设备引入了新的断点考量——屏幕可以在使用过程中改变尺寸。`,
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
    content: `如何构建和维护一个可持续发展的设计系统？本文将分享在实际项目中建设和维护设计系统的经验和教训，包括组件设计原则、版本管理、团队协作等方面。

## Design Tokens

设计令牌是设计系统的基石，将视觉决策与实现解耦：

\`\`\`json
{
  "color": {
    "brand": {
      "primary": { "value": "#315B48", "type": "color" },
      "secondary": { "value": "#62675F", "type": "color" }
    }
  },
  "spacing": {
    "sm": { "value": "8", "type": "spacing" },
    "md": { "value": "16", "type": "spacing" }
  }
}
\`\`\`

## 组件分层

一个好的设计系统应该有三层结构：

1. **基础层** — Token、原子样式
2. **组件层** — Button、Input 等通用组件
3. **模式层** — Form、Table 等复合模式

> 设计系统不是静态的组件库，而是一个活的产品，需要持续迭代和团队共识。`,
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
      if (import.meta.env.DEV) {
        console.warn('[NewsService] Using mock data. Connect to real news API for production.');
      }
      // P0-1: Remove artificial delay in production
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

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
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

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
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }

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
    // In production, this would call an API to update hotspot data
  }
}

export const newsService = new NewsService();