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
