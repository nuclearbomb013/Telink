import { describe, it, expect, vi, beforeEach } from 'vitest';
import { momentApi } from '@/lib/apiClient';
import { momentService } from '@/services/moment.service';

// Mock the API client
vi.mock('@/lib/apiClient', () => ({
  momentApi: {
    like: vi.fn(),
    unlike: vi.fn(),
    getMoments: vi.fn(),
    getMomentById: vi.fn(),
    createMoment: vi.fn(),
    updateMoment: vi.fn(),
    getComments: vi.fn(),
    deleteMoment: vi.fn(),
  },
}));

describe('momentService.toggleLike', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls unlike() when moment is currently liked', async () => {
    const mockUnlike = vi.mocked(momentApi.unlike).mockResolvedValue({
      success: true,
      data: { liked: false, likes: 4 },
      timestamp: Date.now(),
    });

    await momentService.toggleLike(42, 1, true);

    expect(mockUnlike).toHaveBeenCalledWith(42);
  });

  it('calls like() when moment is not liked', async () => {
    const mockLike = vi.mocked(momentApi.like).mockResolvedValue({
      success: true,
      data: { liked: true, likes: 6 },
      timestamp: Date.now(),
    });

    await momentService.toggleLike(42, 1, false);

    expect(mockLike).toHaveBeenCalledWith(42);
  });

  it('calls like() when isLiked is false (explicit)', async () => {
    const mockLike = vi.mocked(momentApi.like).mockResolvedValue({
      success: true,
      data: { liked: true, likes: 1 },
      timestamp: Date.now(),
    });

    const result = await momentService.toggleLike(10, 2, false);
    expect(mockLike).toHaveBeenCalledWith(10);
    expect(result.data?.liked).toBe(true);
    expect(result.data?.likes).toBe(1);
  });
});

describe('momentService.getMomentById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the dedicated GET /moments/{id} API instead of filtering the first list page', async () => {
    vi.mocked(momentApi.getMomentById).mockResolvedValue({
      success: true,
      data: {
        id: 42,
        author_id: 2,
        author_name: 'author',
        author_avatar: undefined,
        content: 'detail',
        content_type: 'text',
        visibility: 'public',
        likes: 3,
        comment_count: 4,
        is_liked: false,
        created_at: 1700000000000,
        updated_at: null,
      },
      timestamp: Date.now(),
    });

    const result = await momentService.getMomentById(42);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(42);
    expect(momentApi.getMomentById).toHaveBeenCalledWith(42);
    expect(momentApi.getMoments).not.toHaveBeenCalled();
  });
});
