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
