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
