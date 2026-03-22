// ============================================================
// Site Configuration
// ============================================================

export interface SiteConfig {
  title: string;
  description: string;
  language: string;
}

export const siteConfig: SiteConfig = {
  title: "TechInk - 技术交流社区",
  description: "黑白墨水屏风格的技术交流平台，分享编程经验、讨论技术话题、连接开发者社区",
  language: "zh-CN",
};

// ============================================================
// Navigation
// ============================================================

export interface NavLink {
  label: string;
  href: string;
}

export interface NavigationConfig {
  brandName: string;
  links: NavLink[];
  searchPlaceholder: string;
  searchHint: string;
  searchAriaLabel: string;
  closeSearchAriaLabel: string;
}

export const navigationConfig: NavigationConfig = {
  brandName: "TechInk",
  links: [
    { label: "首页", href: "/" },
    { label: "文章", href: "/articles" },
    { label: "论坛", href: "/forum" },
    { label: "动态", href: "/moments" },
    { label: "热点", href: "/news-timeline" },
    { label: "设计", href: "#design" },
    { label: "开发者", href: "/developers" },
  ],
  searchPlaceholder: "搜索文章、话题、开发者...",
  searchHint: "按 Enter 搜索，按 ESC 关闭",
  searchAriaLabel: "搜索",
  closeSearchAriaLabel: "关闭搜索",
};

// ============================================================
// Hero Section
// ============================================================

export interface HeroConfig {
  date: string;
  titleLine1: string;
  titleLine2: string;
  readTime: string;
  description: string;
  ctaText: string;
  image: string;
  imageAlt: string;
}

export const heroConfig: HeroConfig = {
  date: "2026年2月26日",
  titleLine1: "探索技术的",
  titleLine2: "无限可能",
  readTime: "5 分钟阅读",
  description: "TechInk 是一个专注于技术交流的社区，汇聚全球开发者分享编程经验、讨论前沿技术、探索创新思维。在这里，每一行代码都有故事，每一个想法都值得被听见。",
  ctaText: "开始探索",
  image: "/images/hero-code.jpg",
  imageAlt: "代码编辑器界面",
};

// ============================================================
// Latest Articles (Horizontal Scroll)
// ============================================================

export interface ArticleItem {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  category: string;
  /** 文章内容（Markdown格式） */
  content?: string;
  /** 文章摘要，用于列表显示 */
  excerpt?: string;
  /** 作者名称 */
  author?: string;
  /** 发布日期（YYYY-MM-DD格式） */
  publishDate?: string;
  /** 阅读时间（分钟） */
  readTime?: number;
  /** 标签数组 */
  tags?: string[];
  /** URL友好标识符 */
  slug?: string;
}

export interface LatestArticlesConfig {
  sectionTitle: string;
  articles: ArticleItem[];
}

export const latestArticlesConfig: LatestArticlesConfig = {
  sectionTitle: "最新文章",
  articles: [
    {
      id: 1,
      title: "Rust 内存安全",
      subtitle: "深入理解所有权系统",
      image: "/images/article-rust.jpg",
      category: "编程语言",
      excerpt: "深入探讨Rust语言的所有权系统如何确保内存安全，避免常见的内存错误和数据竞争问题。",
      content: "# Rust 内存安全\n\nRust语言通过独特的所有权系统在编译时确保内存安全...",
      author: "张明",
      publishDate: "2026-02-15",
      readTime: 8,
      tags: ["Rust", "内存安全", "所有权", "系统编程"],
      slug: "rust-memory-safety",
    },
    {
      id: 2,
      title: "AI 辅助编程",
      subtitle: "提升开发效率的秘诀",
      image: "/images/article-ai.jpg",
      category: "人工智能",
      excerpt: "探索AI编程助手如何改变开发工作流，从代码生成到错误检测的全方位辅助。",
      content: "# AI 辅助编程\n\n人工智能正在彻底改变软件开发的方式...",
      author: "李雪",
      publishDate: "2026-02-10",
      readTime: 6,
      tags: ["AI", "编程辅助", "开发工具", "机器学习"],
      slug: "ai-assisted-programming",
    },
    {
      id: 3,
      title: "微服务架构",
      subtitle: "设计可扩展系统",
      image: "/images/article-microservice.jpg",
      category: "架构设计",
      excerpt: "从单体架构到微服务的演进之路，探讨如何设计可扩展、可维护的分布式系统。",
      content: "# 微服务架构\n\n随着业务规模的扩大，单体架构逐渐暴露出诸多问题...",
      author: "王浩",
      publishDate: "2026-02-05",
      readTime: 12,
      tags: ["微服务", "架构设计", "分布式系统", "云原生"],
      slug: "microservice-architecture",
    },
    {
      id: 4,
      title: "WebAssembly",
      subtitle: "浏览器端的高性能计算",
      image: "/images/article-wasm.jpg",
      category: "前端技术",
      excerpt: "WebAssembly如何突破JavaScript的性能限制，在浏览器中实现接近原生代码的执行速度。",
      content: "# WebAssembly\n\n传统的Web应用受限于JavaScript的执行效率...",
      author: "赵琳",
      publishDate: "2026-01-28",
      readTime: 10,
      tags: ["WebAssembly", "前端技术", "性能优化", "浏览器"],
      slug: "webassembly-high-performance",
    },
    {
      id: 5,
      title: "开源贡献指南",
      subtitle: "如何参与开源项目",
      image: "/images/article-opensource.jpg",
      category: "开源社区",
      excerpt: "从第一次提交到成为核心贡献者，完整指南教你如何有效参与开源项目。",
      content: "# 开源贡献指南\n\n参与开源项目是提升编程技能和建立技术影响力的重要途径...",
      author: "孙鹏",
      publishDate: "2026-01-20",
      readTime: 7,
      tags: ["开源", "社区贡献", "GitHub", "协作开发"],
      slug: "open-source-contribution-guide",
    },
  ],
};

// ============================================================
// Art Category Section -> Topics Section
// ============================================================

export interface EventItem {
  date: string;
  title: string;
  location: string;
}

export interface GridArticle {
  id: number;
  title: string;
  category: string;
  readTime: string;
}

export interface ArtCategoryConfig {
  sectionTitle: string;
  categoriesLabel: string;
  eventsLabel: string;
  categories: string[];
  events: EventItem[];
  featuredImage: string;
  featuredImageAlt: string;
  featuredLabel: string;
  featuredTitle: string;
  featuredDescription: string;
  featuredCtaText: string;
  gridArticles: GridArticle[];
  readSuffix: string;
}

export const artCategoryConfig: ArtCategoryConfig = {
  sectionTitle: "热门话题",
  categoriesLabel: "分类",
  eventsLabel: "近期活动",
  categories: ["前端开发", "后端架构", "人工智能", "开源项目", "职业发展"],
  events: [
    { date: "3月15日", title: "TechInk 开发者大会", location: "线上直播" },
    { date: "3月22日", title: "Rust 入门工作坊", location: "Zoom会议" },
    { date: "4月5日", title: "开源贡献者之夜", location: "Discord" },
  ],
  featuredImage: "/images/featured-topic.jpg",
  featuredImageAlt: "技术讨论场景",
  featuredLabel: "精选话题",
  featuredTitle: "2026年技术趋势展望",
  featuredDescription: "从 AI 驱动的开发工具到云原生架构的演进，我们邀请了行业专家分享他们对未来技术发展的独到见解。探讨量子计算、边缘计算、Web3 等前沿技术如何重塑我们的数字世界。",
  featuredCtaText: "阅读全文",
  gridArticles: [
    { id: 1, title: "TypeScript 5.0 新特性解析", category: "前端开发", readTime: "8 分钟" },
    { id: 2, title: "Kubernetes 最佳实践", category: "后端架构", readTime: "12 分钟" },
    { id: 3, title: "LLM 应用开发入门", category: "人工智能", readTime: "10 分钟" },
    { id: 4, title: "Git 工作流优化技巧", category: "开源项目", readTime: "6 分钟" },
  ],
  readSuffix: "阅读",
};

// ============================================================
// Lifestyle Section -> Community Section
// ============================================================

export interface LifestyleArticle {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  rotation: number;
  position: { x: number; y: number };
  baseZIndex?: number;
}

export interface LifestyleConfig {
  sectionTitle: string;
  viewMoreText: string;
  articles: LifestyleArticle[];
}

export const lifestyleConfig: LifestyleConfig = {
  sectionTitle: "社区精选",
  viewMoreText: "查看更多",
  articles: [
    {
      id: 1,
      title: "程序员的日常",
      excerpt: "分享开发者的工作与生活平衡之道",
      image: "/images/community-1.jpg",
      rotation: -5,
      position: { x: 0, y: 0 },
    },
    {
      id: 2,
      title: "代码审查艺术",
      excerpt: "如何进行高效的代码评审",
      image: "/images/community-2.jpg",
      rotation: 3,
      position: { x: 40, y: 20 },
    },
    {
      id: 3,
      title: "远程工作指南",
      excerpt: "分布式团队的协作秘诀",
      image: "/images/community-3.jpg",
      rotation: -2,
      position: { x: 80, y: -10 },
    },
    {
      id: 4,
      title: "技术写作技巧",
      excerpt: "如何撰写清晰的技术文档",
      image: "/images/community-4.jpg",
      rotation: 4,
      position: { x: 120, y: 30 },
    },
    {
      id: 5,
      title: "开源精神",
      excerpt: "参与开源社区的心得体会",
      image: "/images/community-5.jpg",
      rotation: -4,
      position: { x: 160, y: 10 },
    },
  ],
};

// ============================================================
// Design Section -> Code Design Section
// ============================================================

export interface DesignItem {
  id: number;
  title: string;
  quote: string;
  image: string;
  size: string;
  gridColumn?: number;
}

export interface DesignConfig {
  sectionTitle: string;
  viewMoreText: string;
  items: DesignItem[];
}

export const designConfig: DesignConfig = {
  sectionTitle: "代码之美",
  viewMoreText: "探索更多",
  items: [
    {
      id: 1,
      title: "简洁代码",
      quote: "简单是复杂的终极形态 — 达芬奇",
      image: "/images/design-1.jpg",
      size: "wide",
    },
    {
      id: 2,
      title: "算法可视化",
      quote: "让抽象概念变得直观",
      image: "/images/design-2.jpg",
      size: "normal",
    },
    {
      id: 3,
      title: "架构设计",
      quote: "好的架构是演进而来的",
      image: "/images/design-3.jpg",
      size: "tall",
    },
    {
      id: 4,
      title: "UI/UX 设计",
      quote: "用户体验是代码的延伸",
      image: "/images/design-4.jpg",
      size: "normal",
    },
    {
      id: 5,
      title: "数据可视化",
      quote: "数据讲述故事",
      image: "/images/design-5.jpg",
      size: "normal",
    },
    {
      id: 6,
      title: "API 设计",
      quote: "优雅接口的力量",
      image: "/images/design-6.jpg",
      size: "wide",
    },
  ],
};

// ============================================================
// Green Tribe Section -> Developer Hub Section
// ============================================================

export interface TribeMember {
  id: number;
  name: string;
  role: string;
  title: string;
  excerpt: string;
  avatar: string;
}

export interface GreenTribeConfig {
  sectionTitle: string;
  sectionDescription: string;
  readMoreText: string;
  joinTitle: string;
  joinDescription: string;
  emailPlaceholder: string;
  subscribeText: string;
  subscribeSuccessMessage: string;
  memberCountText: string;
  videoSrc: string;
  videoPoster: string;
  members: TribeMember[];
}

export const greenTribeConfig: GreenTribeConfig = {
  sectionTitle: "开发者中心",
  sectionDescription: "加入我们的开发者社区，与全球程序员一起成长",
  readMoreText: "阅读更多",
  joinTitle: "加入社区",
  joinDescription: "订阅我们的周刊，获取最新技术资讯和独家内容",
  emailPlaceholder: "输入您的邮箱地址",
  subscribeText: "订阅",
  subscribeSuccessMessage: "感谢订阅！我们会尽快与您联系。",
  memberCountText: "已有 25,847 位开发者加入",
  videoSrc: "",
  videoPoster: "/images/dev-poster.jpg",
  members: [
    {
      id: 1,
      name: "张明",
      role: "全栈工程师",
      title: "从零到一构建产品",
      excerpt: "分享我在创业公司的技术选型和产品迭代经验",
      avatar: "/images/avatar-1.jpg",
    },
    {
      id: 2,
      name: "李雪",
      role: "前端专家",
      title: "性能优化实战",
      excerpt: "如何让用户感受到毫秒级的提升",
      avatar: "/images/avatar-2.jpg",
    },
    {
      id: 3,
      name: "王浩",
      role: "开源维护者",
      title: "开源项目的治理",
      excerpt: "维护大型开源项目的挑战与收获",
      avatar: "/images/avatar-1.jpg",
    },
  ],
};

// ============================================================
// Authors Section -> Featured Developers Section
// ============================================================

export interface Author {
  id: number;
  name: string;
  role: string;
  avatar: string;
  articles: number;
  social: { instagram: string; twitter: string };
}

export interface AuthorsConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  articlesSuffix: string;
  authors: Author[];
}

export const authorsConfig: AuthorsConfig = {
  sectionTitle: "推荐开发者",
  sectionSubtitle: "拖动或点击头像了解更多",
  articlesSuffix: "篇文章",
  authors: [
    {
      id: 1,
      name: "陈晨",
      role: "架构师",
      avatar: "/images/dev-1.jpg",
      articles: 42,
      social: { instagram: "#", twitter: "#" },
    },
    {
      id: 2,
      name: "刘洋",
      role: "AI 研究员",
      avatar: "/images/dev-2.jpg",
      articles: 38,
      social: { instagram: "#", twitter: "#" },
    },
    {
      id: 3,
      name: "赵琳",
      role: "DevOps 专家",
      avatar: "/images/dev-3.jpg",
      articles: 56,
      social: { instagram: "#", twitter: "#" },
    },
    {
      id: 4,
      name: "孙鹏",
      role: "安全工程师",
      avatar: "/images/dev-4.jpg",
      articles: 29,
      social: { instagram: "#", twitter: "#" },
    },
    {
      id: 5,
      name: "周婷",
      role: "移动端开发",
      avatar: "/images/dev-5.jpg",
      articles: 35,
      social: { instagram: "#", twitter: "#" },
    },
  ],
};

// ============================================================
// Instagram Gallery Section -> Code Snippet Gallery
// ============================================================

export interface InstagramImage {
  id: number;
  image: string;
  likes: number;
}

export interface InstagramGalleryConfig {
  handle: string;
  handleUrl: string;
  description: string;
  followText: string;
  likesSuffix: string;
  images: InstagramImage[];
}

export const instagramGalleryConfig: InstagramGalleryConfig = {
  handle: "@techink_dev",
  handleUrl: "#",
  description: "关注我们的代码片段画廊，每日精选编程灵感",
  followText: "关注我们",
  likesSuffix: "赞",
  images: [
    { id: 1, image: "/images/gallery-1.jpg", likes: 1247 },
    { id: 2, image: "/images/gallery-2.jpg", likes: 892 },
    { id: 3, image: "/images/gallery-3.jpg", likes: 2156 },
    { id: 4, image: "/images/gallery-4.jpg", likes: 1567 },
    { id: 5, image: "/images/gallery-5.jpg", likes: 983 },
    { id: 6, image: "/images/gallery-6.jpg", likes: 1876 },
    { id: 7, image: "/images/gallery-7.jpg", likes: 743 },
    { id: 8, image: "/images/gallery-8.jpg", likes: 1324 },
    { id: 9, image: "/images/gallery-9.jpg", likes: 1654 },
    { id: 10, image: "/images/gallery-10.jpg", likes: 2109 },
  ],
};

// ============================================================
// Footer
// ============================================================

export interface FooterConfig {
  brandWatermark: string;
  newsletterTitle: string;
  newsletterDescription: string;
  emailPlaceholder: string;
  subscribeText: string;
  subscribeSuccessMessage: string;
  categoriesLabel: string;
  categories: string[];
  pagesLabel: string;
  pages: string[];
  legalLabel: string;
  legalLinks: string[];
  socialLabel: string;
  socialLinks: {
    instagram: string;
    twitter: string;
    youtube: string;
  };
  backToTopText: string;
  copyright: string;
  credit: string;
}

export const footerConfig: FooterConfig = {
  brandWatermark: "TechInk",
  newsletterTitle: "保持联系",
  newsletterDescription: "订阅我们的技术周刊，获取最新文章和社区动态",
  emailPlaceholder: "您的邮箱地址",
  subscribeText: "订阅",
  subscribeSuccessMessage: "感谢订阅！",
  categoriesLabel: "分类",
  categories: ["前端开发", "后端架构", "人工智能", "开源项目", "职业发展"],
  pagesLabel: "页面",
  pages: ["首页", "文章", "话题", "热点", "关于我们"],
  legalLabel: "法律",
  legalLinks: ["隐私政策", "使用条款", "Cookie 政策"],
  socialLabel: "关注我们",
  socialLinks: {
    instagram: "#",
    twitter: "#",
    youtube: "#",
  },
  backToTopText: "返回顶部",
  copyright: "© 2026 TechInk. 保留所有权利。",
  credit: "用代码构建，为开发者服务",
};
