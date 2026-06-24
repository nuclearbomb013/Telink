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
  image: "/images/hero-code.webp",
  imageAlt: "代码编辑器界面",
};
