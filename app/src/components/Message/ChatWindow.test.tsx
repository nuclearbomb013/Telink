import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatWindow from './ChatWindow';
import { followService } from '@/services/follow.service';
import { messageService } from '@/services/message.service';

vi.mock('@/services/follow.service', () => ({
  followService: {
    getFollowStatus: vi.fn(),
    isMutualSync: vi.fn(),
  },
}));

vi.mock('@/services/message.service', () => ({
  messageService: {
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

describe('ChatWindow backend-backed permission loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads messages after async follow status confirms mutual permission', async () => {
    vi.mocked(followService.getFollowStatus).mockResolvedValue({
      success: true,
      data: {
        userId: 2,
        username: 'target',
        isFollowing: true,
        isMutual: true,
        followerCount: 1,
        followingCount: 1,
      },
      timestamp: Date.now(),
    });
    vi.mocked(messageService.getMessages).mockResolvedValue({
      success: true,
      data: {
        messages: [{
          id: 10,
          senderId: 2,
          receiverId: 1,
          content: 'from backend',
          status: 'sent',
          createdAt: Date.now(),
        }],
        hasMore: false,
      },
      timestamp: Date.now(),
    });

    render(
      <ChatWindow
        currentUser={{ id: 1, username: 'me' }}
        targetUserId={2}
        targetUsername="target"
      />,
    );

    await waitFor(() => {
      expect(messageService.getMessages).toHaveBeenCalledWith({
        userId: 2,
        currentUserId: 1,
        limit: 30,
      });
    });
    expect(await screen.findByText('from backend')).toBeInTheDocument();
    expect(followService.isMutualSync).not.toHaveBeenCalled();
  });

  it('does not load messages when async follow status denies permission', async () => {
    vi.mocked(followService.getFollowStatus).mockResolvedValue({
      success: true,
      data: {
        userId: 2,
        username: 'target',
        isFollowing: true,
        isMutual: false,
        followerCount: 1,
        followingCount: 1,
      },
      timestamp: Date.now(),
    });

    render(
      <ChatWindow
        currentUser={{ id: 1, username: 'me' }}
        targetUserId={2}
        targetUsername="target"
      />,
    );

    await waitFor(() => {
      expect(followService.getFollowStatus).toHaveBeenCalledWith(2, 1);
    });
    expect(messageService.getMessages).not.toHaveBeenCalled();
    expect(followService.isMutualSync).not.toHaveBeenCalled();
  });
});
