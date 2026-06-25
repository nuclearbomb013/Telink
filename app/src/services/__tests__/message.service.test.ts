import { beforeEach, describe, it, expect, vi } from 'vitest';
import { messageApi } from '@/lib/apiClient';
import { messageService } from '@/services/message.service';

vi.mock('@/lib/apiClient', () => ({
  messageApi: {
    getConversationMessages: vi.fn(),
    getConversations: vi.fn(),
    send: vi.fn(),
    getUnreadCount: vi.fn(),
    markConversationRead: vi.fn(),
    deleteMessage: vi.fn(),
  },
}));

describe('messageService.getMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards beforeId as before_id to the API', async () => {
    const mockGetMessages = vi.mocked(messageApi.getConversationMessages).mockResolvedValue({
      success: true,
      data: { messages: [], total: 0, page: 1, limit: 20, has_more: false },
      timestamp: Date.now(),
    });

    await messageService.getMessages({
      userId: 2,
      currentUserId: 1,
      beforeId: 100,
      limit: 20,
    });

    expect(mockGetMessages).toHaveBeenCalledWith(2, {
      limit: 20,
      before_id: 100,
    });
  });

  it('works without beforeId (initial page load)', async () => {
    const mockGetMessages = vi.mocked(messageApi.getConversationMessages).mockResolvedValue({
      success: true,
      data: { messages: [], total: 0, page: 1, limit: 20, has_more: false },
      timestamp: Date.now(),
    });

    await messageService.getMessages({
      userId: 2,
      currentUserId: 1,
      limit: 20,
    });

    expect(mockGetMessages).toHaveBeenCalledWith(2, {
      limit: 20,
      before_id: undefined,
    });
  });
});

describe('messageService.markAllAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a validation error when fromUserId is omitted and does not fake local read state', async () => {
    const result = await messageService.markAllAsRead(1);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(messageApi.markConversationRead).not.toHaveBeenCalled();
  });

  it('calls the real conversation read endpoint when fromUserId is provided', async () => {
    vi.mocked(messageApi.markConversationRead).mockResolvedValue({
      success: true,
      data: { marked_count: 2 },
      timestamp: Date.now(),
    });

    const result = await messageService.markAllAsRead(1, 2);

    expect(result.success).toBe(true);
    expect(messageApi.markConversationRead).toHaveBeenCalledWith(2);
  });
});
