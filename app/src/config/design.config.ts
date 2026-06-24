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
