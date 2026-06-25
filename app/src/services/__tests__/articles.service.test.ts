import { beforeEach, describe, expect, it, vi } from 'vitest';
import { articleApi } from '@/lib/apiClient';
import { articleService } from '@/services/articles.service';

vi.mock('@/lib/apiClient', () => ({
  articleApi: {
    getArticles: vi.fn(),
    getArticleById: vi.fn(),
    getArticleBySlug: vi.fn(),
    createArticle: vi.fn(),
    updateArticle: vi.fn(),
    deleteArticle: vi.fn(),
  },
}));

const apiArticle = (overrides = {}) => ({
  id: 1,
  title: 'Backend Article',
  slug: 'backend-article',
  content: 'content',
  excerpt: 'excerpt',
  subtitle: 'subtitle',
  cover_image: '/cover.png',
  author_id: 1,
  author_name: 'author',
  author_avatar: undefined,
  category: 'backend',
  status: 'published',
  tags: ['fastapi', 'postgres'],
  views: 0,
  likes: 0,
  is_featured: false,
  published_at: 1700000000000,
  created_at: 1700000000000,
  updated_at: undefined,
  ...overrides,
});

describe('articleService details and pagination-backed filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves tags when mapping slug detail responses', async () => {
    vi.mocked(articleApi.getArticleBySlug).mockResolvedValue({
      success: true,
      data: apiArticle({ tags: ['react', 'typescript'] }),
      timestamp: Date.now(),
    });

    const result = await articleService.getArticleBySlug('backend-article');

    expect(result.success).toBe(true);
    expect(result.data?.tags).toEqual(['react', 'typescript']);
  });

  it('does not cache a failed partial pagination fetch as complete data', async () => {
    vi.mocked(articleApi.getArticles)
      .mockResolvedValueOnce({
        success: true,
        data: {
          articles: [apiArticle({ id: 1, author_name: 'alice' })],
          total: 2,
          page: 1,
          limit: 100,
          total_pages: 2,
        },
        timestamp: Date.now(),
      })
      .mockResolvedValueOnce({
        success: false,
        error: { code: 'HTTP_ERROR', message: 'page 2 failed' },
        timestamp: Date.now(),
      });

    const failed = await articleService.searchArticles({ author: 'alice' });
    expect(failed.success).toBe(false);

    vi.mocked(articleApi.getArticles)
      .mockResolvedValueOnce({
        success: true,
        data: {
          articles: [apiArticle({ id: 1, author_name: 'alice' })],
          total: 2,
          page: 1,
          limit: 100,
          total_pages: 2,
        },
        timestamp: Date.now(),
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          articles: [apiArticle({ id: 2, author_name: 'alice', slug: 'second' })],
          total: 2,
          page: 2,
          limit: 100,
          total_pages: 2,
        },
        timestamp: Date.now(),
      });

    const recovered = await articleService.searchArticles({ author: 'alice' });

    expect(recovered.success).toBe(true);
    expect(recovered.data?.articles).toHaveLength(2);
    expect(articleApi.getArticles).toHaveBeenCalledTimes(4);
    expect(articleApi.getArticles).toHaveBeenNthCalledWith(3, { limit: 100, page: 1 });
  });
});
