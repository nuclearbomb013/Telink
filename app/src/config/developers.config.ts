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
