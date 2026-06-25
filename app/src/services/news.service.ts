/**
 * News Service - 资讯服务
 *
 * NOW BACKED BY REAL BACKEND API (no more mock data).
 * Backend news data model is a stub — returns empty results until implemented.
 * Production always uses the real backend API.
 */

import { newsApi } from '@/lib/apiClient';
import type {
  NewsItem,
  NewsTimelineFilter,
  NewsTimelineResponse,
  NewsServiceResponse,
  HotspotConfig,
} from './news.types';

// ──────────────────── Response Helpers ────────────────────

function successResponse<T>(data: T): NewsServiceResponse<T> {
  return { success: true, data, timestamp: Date.now() };
}

function errorResponse(code: string, message: string): NewsServiceResponse<never> {
  return { success: false, error: { code, message }, timestamp: Date.now() };
}

// ──────────────────── Transform ────────────────────

function apiToNewsItem(raw: {
  id: string; title: string; content: string; excerpt?: string;
  cover_image?: string; category: string; tags: string[];
  hot_score: number; views: number; created_at: number; updated_at: number;
}): NewsItem {
  return {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    summary: raw.excerpt || '',
    imageUrl: raw.cover_image,
    publishDate: new Date(raw.created_at).toISOString(),
    category: raw.category,
    tags: raw.tags,
    isHot: raw.hot_score > 0,
    hotScore: raw.hot_score,
    views: raw.views,
    author: '',
  };
}

// ──────────────────── Real API Implementation ────────────────────

class NewsService {
  private hotspotConfig: HotspotConfig = {
    updateInterval: 60000,
    hotThreshold: 50,
    decayFactor: 0.95,
    maxHotspots: 10,
  };

  async getNewsTimeline(
    filter?: NewsTimelineFilter,
    page?: number,
    limit?: number,
  ): Promise<NewsServiceResponse<NewsTimelineResponse>> {
    try {
      const response = await newsApi.getTimeline({
        page: page ?? 1,
        limit: limit ?? 10,
        category: filter?.categories?.[0],
      });
      if (!response.success || !response.data) {
        if (import.meta.env.DEV) {
          console.warn('[NewsService] Backend news API unavailable, returning empty.');
        }
        return successResponse({ items: [], total: 0, hasNext: false, hotKeywords: [] });
      }
      const d = response.data;
      return successResponse({
        items: d.items.map(apiToNewsItem),
        total: d.total,
        hasNext: d.has_more,
        hotKeywords: [],
      });
    } catch {
      if (import.meta.env.DEV) {
        console.warn('[NewsService] Backend unreachable, returning empty.');
      }
      return successResponse({ items: [], total: 0, hasNext: false, hotKeywords: [] });
    }
  }

  async getHotNews(limit = 5): Promise<NewsServiceResponse<NewsItem[]>> {
    try {
      const response = await newsApi.getHot(limit);
      if (!response.success || !response.data) {
        return successResponse([]);
      }
      return successResponse(response.data.items.map(apiToNewsItem));
    } catch {
      return successResponse([]);
    }
  }

  async getNewsById(id: string): Promise<NewsServiceResponse<NewsItem>> {
    try {
      const response = await newsApi.getById(id);
      if (!response.success || !response.data) {
        return errorResponse('NOT_FOUND', response.error?.message || '资讯不存在');
      }
      return successResponse(apiToNewsItem(response.data));
    } catch {
      return errorResponse('FETCH_ERROR', '获取资讯失败');
    }
  }

  updateConfig(config: Partial<HotspotConfig>): void {
    this.hotspotConfig = { ...this.hotspotConfig, ...config };
  }

  getConfig(): HotspotConfig {
    return { ...this.hotspotConfig };
  }

  simulateHotspotUpdate(): void {
    // No-op: real API doesn't need simulated updates
  }
}

export const newsService = new NewsService();
