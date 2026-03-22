/**
 * 文章投稿存储服务
 * 使用 localStorage 存储用户投稿的文章
 */

import type { Article, CreateArticleData } from './articles.types';

// Storage key for submitted articles
const STORAGE_KEY = 'techink_submitted_articles';

/**
 * 生成 URL 友好的 slug
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

/**
 * 生成唯一 ID（从 1000 开始，避免与预设文章冲突）
 */
function generateId(): number {
  const articles = getSubmittedArticles();
  const maxId = articles.reduce((max, article) => Math.max(max, article.id), 999);
  return maxId + 1;
}

/**
 * 计算阅读时间（按每分钟 300 字计算）
 */
function calculateReadTime(content: string): number {
  const words = content.length;
  return Math.max(1, Math.ceil(words / 300));
}

/**
 * 获取所有投稿文章
 */
export function getSubmittedArticles(): Article[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const articles = JSON.parse(data) as Article[];
    // 按发布时间排序，最新的在前
    return articles.sort((a, b) => 
      new Date(b.publishDate || '').getTime() - new Date(a.publishDate || '').getTime()
    );
  } catch (error) {
    console.error('Error reading submitted articles:', error);
    return [];
  }
}

/**
 * 根据 slug 或 ID 获取投稿文章
 */
export function getSubmittedArticleBySlug(slug: string): Article | undefined {
  const articles = getSubmittedArticles();
  return articles.find(
    article => article.slug === slug || article.id.toString() === slug
  );
}

/**
 * 提交新文章
 */
export function submitArticle(data: CreateArticleData): Article {
  const now = new Date();
  const publishDate = now.toISOString().split('T')[0];
  
  const newArticle: Article = {
    id: generateId(),
    title: data.title,
    subtitle: data.subtitle,
    content: data.content,
    author: data.author,
    category: data.category,
    tags: data.tags || [],
    image: data.image || '',
    excerpt: data.excerpt || data.subtitle,
    readTime: data.readTime || calculateReadTime(data.content),
    slug: generateSlug(data.title) + '-' + now.getTime().toString(36),
    publishDate,
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
  };
  
  const existingArticles = getSubmittedArticles();
  const updatedArticles = [newArticle, ...existingArticles];
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedArticles));
  
  return newArticle;
}

/**
 * 更新投稿文章
 */
export function updateSubmittedArticle(id: number, updates: Partial<CreateArticleData>): Article | null {
  const articles = getSubmittedArticles();
  const index = articles.findIndex(article => article.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const updatedArticle: Article = {
    ...articles[index],
    ...updates,
    updatedAt: Date.now(),
  };
  
  if (updates.content && !updates.readTime) {
    updatedArticle.readTime = calculateReadTime(updates.content);
  }
  
  articles[index] = updatedArticle;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  
  return updatedArticle;
}

/**
 * 删除投稿文章
 */
export function deleteSubmittedArticle(id: number): boolean {
  const articles = getSubmittedArticles();
  const filtered = articles.filter(article => article.id !== id);
  
  if (filtered.length === articles.length) {
    return false;
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * 获取投稿文章总数
 */
export function getSubmittedArticleCount(): number {
  return getSubmittedArticles().length;
}

/**
 * 清除所有投稿文章（用于测试）
 */
export function clearSubmittedArticles(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 搜索投稿文章
 */
export function searchSubmittedArticles(query: string): Article[] {
  const articles = getSubmittedArticles();
  const lowerQuery = query.toLowerCase();
  
  return articles.filter(article =>
    article.title.toLowerCase().includes(lowerQuery) ||
    article.subtitle.toLowerCase().includes(lowerQuery) ||
    article.category.toLowerCase().includes(lowerQuery) ||
    article.author?.toLowerCase().includes(lowerQuery) ||
    article.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 按分类获取投稿文章
 */
export function getSubmittedArticlesByCategory(category: string): Article[] {
  const articles = getSubmittedArticles();
  return articles.filter(article => article.category === category);
}
