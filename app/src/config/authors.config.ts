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
