/**
 * News Types - 资讯类型定义
 */

/**
 * 资讯服务错误类型
 */
export interface NewsServiceError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * 资讯服务统一响应格式
 */
export interface NewsServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: NewsServiceError;
  timestamp: number;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  imageUrl?: string;
  publishDate: string;
  category: string;
  tags: string[];
  isHot: boolean;
  hotScore: number;
  views: number;
  author: string;
}

export interface NewsTimelineFilter {
  categories?: string[];
  tags?: string[];
  dateRange?: [string, string]; // [start, end]
  searchQuery?: string;
  isHotOnly?: boolean;
}

export interface NewsTimelineResponse {
  items: NewsItem[];
  total: number;
  hasNext: boolean;
  hotKeywords: string[];
}

export interface HotspotConfig {
  /** 热度阈值，超过此值的资讯被标记为热点 */
  hotThreshold: number;
  /** 热度计算衰减因子 */
  decayFactor: number;
  /** 最大热点数量 */
  maxHotspots: number;
  /** 更新间隔 (ms) */
  updateInterval: number;
}