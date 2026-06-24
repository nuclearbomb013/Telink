// ============================================================
// Latest Articles (Horizontal Scroll)
// ============================================================

export interface ArticleItem {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  category: string;
  content?: string;
  excerpt?: string;
  author?: string;
  publishDate?: string;
  readTime?: number;
  tags?: string[];
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
      content: "# Rust 内存安全\n\nRust 语言通过独特的所有权（Ownership）系统在编译时确保内存安全，避免常见的内存错误。\n\n## 所有权规则\n\nRust 的所有权系统遵循三条核心规则：\n\n1. 每个值在任意时刻**有且只有一个**所有者\n2. 当所有者离开作用域，值会被自动释放\n3. 所有权可以通过移动（move）或借用（borrow）转移\n\n## 代码示例\n\n下面是一个简单示例，展示所有权如何在编译期防止悬垂指针：\n\n```rust\nfn main() {\n    let s1 = String::from(\"hello\");\n    let s2 = s1; // s1 的所有权移动到 s2\n    // println!(\"{}\", s1); // 编译错误！s1 已失效\n    println!(\"{}\", s2); // 正确\n}\n```\n\n## 借用与引用\n\n借用允许在不转移所有权的情况下访问数据：\n\n```rust\nfn calculate_length(s: &String) -> usize {\n    s.len()\n}\n\nfn main() {\n    let s = String::from(\"hello\");\n    let len = calculate_length(&s);\n    println!(\"{} 的长度是 {}\", s, len);\n}\n```\n\n## 表格对比\n\n| 特性 | Rust | C++ | Go |\n|------|------|-----|-----|\n| 内存安全 | 编译时保证 | 手动管理 | GC |\n| 并发安全 | 类型系统保证 | 手动加锁 | goroutine |\n| 零成本抽象 | 是 | 部分 | 否 |\n\n更多内容参考 [Rust 官方文档](https://doc.rust-lang.org/book/)。",
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
