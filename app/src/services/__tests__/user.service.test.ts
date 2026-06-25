import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userApi } from '@/lib/apiClient';
import { userService } from '@/services/user.service';

vi.mock('@/lib/apiClient', () => ({
  userApi: {
    update: vi.fn(),
    getById: vi.fn(),
    getByUsername: vi.fn(),
    list: vi.fn(),
    getStats: vi.fn(),
  },
}));

describe('userService.updateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('only sends editable profile fields (username, avatar, bio)', async () => {
    const mockUpdate = vi.mocked(userApi.update).mockResolvedValue({
      success: true,
      data: {
        id: 1,
        username: 'newName',
        avatar: 'https://example.com/avatar.png',
        bio: 'new bio',
        role: 'user',
        postCount: 10,
        commentCount: 5,
        likeCount: 20,
        joinedAt: 1700000000000,
        lastActiveAt: undefined,
      },
      timestamp: Date.now(),
    });

    await userService.updateUser({
      id: 1,
      username: 'newName',
      avatar: 'https://example.com/avatar.png',
      bio: 'new bio',
    });

    // Verify the payload only contains editable fields
    const callArgs = mockUpdate.mock.calls[0];
    const payload = callArgs[1];
    expect(payload).toHaveProperty('username', 'newName');
    expect(payload).toHaveProperty('avatar', 'https://example.com/avatar.png');
    expect(payload).toHaveProperty('bio', 'new bio');

    // Must NOT contain sentinel values for non-editable fields
    expect(payload).not.toHaveProperty('postCount');
    expect(payload).not.toHaveProperty('commentCount');
    expect(payload).not.toHaveProperty('likeCount');
    expect(payload).not.toHaveProperty('joinedAt');
    expect(payload).not.toHaveProperty('role');
  });

  it('only sends provided fields', async () => {
    const mockUpdate = vi.mocked(userApi.update).mockResolvedValue({
      success: true,
      data: {
        id: 1,
        username: 'sameName',
        avatar: undefined,
        bio: undefined,
        role: 'user',
        postCount: 10,
        commentCount: 5,
        likeCount: 20,
        joinedAt: 1700000000000,
        lastActiveAt: undefined,
      },
      timestamp: Date.now(),
    });

    await userService.updateUser({
      id: 1,
      bio: 'only bio changes',
    });

    const callArgs = mockUpdate.mock.calls[0];
    const payload = callArgs[1];
    expect(payload.bio).toBe('only bio changes');
    // username/avatar may be undefined (filtered by apiClient); the key point
    // is that non-editable fields like postCount are never sent.
    expect(payload).not.toHaveProperty('postCount');
    expect(payload).not.toHaveProperty('commentCount');
    expect(payload).not.toHaveProperty('likeCount');
    expect(payload).not.toHaveProperty('joinedAt');
    expect(payload).not.toHaveProperty('role');
  });
});

describe('userService.getUserById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calls userApi and does not use localStorage user arrays as source of truth', async () => {
    localStorage.setItem('techink_users_data', JSON.stringify([{
      id: 7,
      username: 'stale-local-user',
      postCount: 999,
    }]));

    const mockGetById = vi.mocked(userApi.getById).mockResolvedValue({
      success: true,
      data: {
        id: 7,
        username: 'backend-user',
        avatar: undefined,
        bio: 'from backend',
        role: 'user',
        postCount: 1,
        commentCount: 2,
        likeCount: 3,
        joinedAt: 1700000000000,
        lastActiveAt: undefined,
      },
      timestamp: Date.now(),
    });

    const result = await userService.getUserById(7);

    expect(mockGetById).toHaveBeenCalledWith(7);
    expect(result.success).toBe(true);
    expect(result.data?.username).toBe('backend-user');
    expect(result.data?.postCount).toBe(1);
  });
});
