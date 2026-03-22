/**
 * Mock Data - 集中管理所有 Mock 数据
 *
 * 用于开发和测试环境，预留真实 API 接口
 */

import type { ForumPost } from './forum.types';

// ==================== 论坛 Mock 数据 ====================

/**
 * 初始论坛帖子数据
 */
export const INITIAL_FORUM_POSTS: ForumPost[] = [
  {
    id: 1,
    title: '欢迎来到 TechInk 论坛！',
    slug: 'welcome-to-techink-forum',
    content: `# 欢迎来到 TechInk 论坛！

大家好，我是 TechInk 的管理员。

## 论坛规则

1. **友善交流** - 请保持礼貌和尊重，不要人身攻击
2. **相关主题** - 请发布与技术、编程、职业发展相关的内容
3. **禁止灌水** - 请发布有质量的内容，避免无意义回复
4. **保护隐私** - 不要泄露自己或他人的个人信息

## 分类说明

- 📢 **公告** - 官方公告和重要通知
- 💬 **综合讨论** - 技术讨论、行业话题
- ❓ **求助** - 遇到问题？来这里提问
- ✨ **作品展示** - 分享你的项目和作品
- 💼 **招聘求职** - 工作机会和求职信息

希望大家在这里度过愉快的时光，共同成长！

---

*最后编辑：管理员*`,
    category: 'announce',
    authorId: 1,
    authorName: '管理员',
    authorAvatar: undefined,
    views: 1247,
    likes: 89,
    replyCount: 23,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    tags: ['公告', '新手指南'],
    isPinned: true,
    isLocked: false,
    excerpt: '欢迎来到 TechInk 论坛！请阅读论坛规则，祝大家交流愉快。',
  },
  {
    id: 2,
    title: 'React 19 新特性讨论',
    slug: 'react-19-new-features',
    content: `# React 19 新特性讨论

React 19 已经发布了，大家对新特性有什么看法？

## 主要新特性

1. **Actions** - 新的数据突变原语
2. **useOptimistic** - 乐观更新 Hook
3. **useFormStatus** - 表单状态 Hook
4. **useFormState** - 表单状态管理
5. **Document Metadata** - 直接在组件中管理文档元数据

## 我的观点

我觉得 Actions 是一个很好的抽象，让数据突变变得更加简单。但是学习曲线可能会比较陡峭。

大家怎么看？欢迎分享你的想法！`,
    category: 'general',
    authorId: 2,
    authorName: 'React 爱好者',
    views: 523,
    likes: 45,
    replyCount: 18,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    tags: ['React', '前端', 'JavaScript'],
    isPinned: false,
    isLocked: false,
    excerpt: '讨论 React 19 的新特性，包括 Actions、useOptimistic、useFormStatus 等。',
  },
  {
    id: 3,
    title: '求助：TypeScript 泛型如何理解？',
    slug: 'help-typescript-generics',
    content: `# 求助：TypeScript 泛型如何理解？

刚开始学 TypeScript，对泛型的概念一直很困惑。

## 我的理解

泛型就像是"类型的参数化"，可以在定义函数、接口或类时不指定具体类型，而是在使用时再指定。

## 问题

1. 什么时候应该使用泛型？
2. 泛型和 any 有什么区别？
3. 如何约束泛型的类型？

## 示例代码

\`\`\`typescript
// 这是泛型吗？
function identity<T>(arg: T): T {
  return arg;
}

// 这样用对吗？
const result = identity<string>('hello');
\`\`\`

希望大佬们能帮忙解答一下，谢谢！`,
    category: 'help',
    authorId: 3,
    authorName: 'TS 新手',
    views: 312,
    likes: 12,
    replyCount: 8,
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    tags: ['TypeScript', '求助', '泛型'],
    isPinned: false,
    isLocked: false,
    excerpt: 'TypeScript 新手求助，想了解泛型的概念和使用方法。',
  },
  {
    id: 4,
    title: '分享：我用 Rust 写了一个 CLI 工具',
    slug: 'rust-cli-tool-showcase',
    content: `# 分享：我用 Rust 写了一个 CLI 工具

花了两周时间，用 Rust 写了一个文件批量重命名的 CLI 工具。

## 功能特点

- 🚀 支持正则表达式匹配
- 🎯 支持批量重命名
- 🔍 支持预览修改结果
- 💾 支持撤销操作

## 安装

\`\`\`bash
cargo install rename-tool
\`\`\`

## 使用示例

\`\`\`bash
# 将所有 jpg 文件改为 jpeg 扩展名
rename --pattern '\\.jpg$' --replacement '.jpeg' *.jpg

# 给文件名添加日期前缀
rename --pattern '^(.*)$' --replacement '{date}-$1' *
\`\`\`

## GitHub

项目已开源：[github.com/xxx/rename-tool](https://github.com)

欢迎大家使用和提 issue！`,
    category: 'showcase',
    authorId: 4,
    authorName: 'Rustacean',
    views: 891,
    likes: 67,
    replyCount: 15,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    tags: ['Rust', 'CLI', '开源项目'],
    isPinned: false,
    isLocked: false,
    excerpt: '分享用 Rust 开发的文件批量重命名工具，支持正则表达式和预览功能。',
  },
  {
    id: 5,
    title: '[北京] 招聘高级前端工程师',
    slug: 'beijing-senior-frontend-job',
    content: `# [北京] 招聘高级前端工程师

## 公司简介

我们是一家专注于企业服务的创业公司，正在用新技术重塑传统行业。

## 职位要求

- 3 年以上前端开发经验
- 精通 React/Vue 至少一种框架
- 熟悉 TypeScript，有良好的代码习惯
- 了解前端工程化，熟悉 Webpack/Vite 等工具
- 有 Node.js 经验者优先
- 有开源项目者优先

## 我们提供

- 💰 有竞争力的薪资（25-45k）
- 🏠 五险一金 + 补充商业保险
- 🍜 免费三餐 + 零食饮料
- 💻 顶配 MacBook Pro
- 📚 技术书籍和课程预算
- 🌍 远程办公机会

## 联系方式

简历请发送至：hr@example.com

邮件标题格式：【前端工程师】- 姓名 - 来源`,
    category: 'jobs',
    authorId: 5,
    authorName: 'HR 小李',
    views: 1567,
    likes: 23,
    replyCount: 31,
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    tags: ['招聘', '前端', '北京', '全职'],
    isPinned: false,
    isLocked: false,
    excerpt: '北京创业公司招聘高级前端工程师，薪资 25-45k，福利优厚。',
  },
];

// ==================== 用户 Mock 数据 ====================

/**
 * 初始用户数据
 */
export const INITIAL_USERS: Array<{
  id: number;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  role: 'admin' | 'moderator' | 'user';
}> = [
  {
    id: 1,
    username: '管理员',
    email: 'admin@techink.com',
    password: 'admin123',
    bio: 'TechInk 论坛管理员',
    role: 'admin',
  },
  {
    id: 2,
    username: 'React 爱好者',
    email: 'react@example.com',
    password: 'user123',
    bio: '前端开发，React 重度用户',
    role: 'user',
  },
];

// ==================== 导出辅助函数 ====================

/**
 * 获取初始论坛帖子数据的深拷贝
 */
export const getInitialForumPosts = (): ForumPost[] => {
  return JSON.parse(JSON.stringify(INITIAL_FORUM_POSTS));
};

/**
 * 获取初始用户数据的深拷贝
 */
export const getInitialUsers = () => {
  return JSON.parse(JSON.stringify(INITIAL_USERS));
};
