import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '@/lib/apiClient';

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

describe('apiClient auth refresh behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    apiClient.clearToken();
  });

  it('refreshes on non-auth 401, retries with the new bearer token, and keeps tokens out of localStorage', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'expired' } },
        { status: 401 },
      ))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        data: { accessToken: 'new', refreshToken: '', expiresIn: 604800 },
      }))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        data: { users: [], total: 0, page: 1, limit: 20, total_pages: 0 },
        timestamp: 123,
      }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiClient.get('/users/list');

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/refresh');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ credentials: 'include' });
    expect(fetchMock.mock.calls[2][0]).toBe('/api/v1/users/list');
    expect(fetchMock.mock.calls[2][1]?.headers).toMatchObject({
      Authorization: 'Bearer new',
    });
    expect(apiClient.getToken()).toBe('new');
    expect(localStorage.getItem('techink_auth_token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('does not clear cached user when refresh fails due to network error', async () => {
    localStorage.setItem('techink_current_user', '{"id":1}');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    const result = await apiClient.tryRefreshToken();

    expect(result).toEqual({ ok: false, reason: 'NETWORK_ERROR' });
    expect(localStorage.getItem('techink_current_user')).toBe('{"id":1}');
  });

  it('does not clear cached user when refresh endpoint has a server error', async () => {
    localStorage.setItem('techink_current_user', '{"id":1}');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(
      { success: false, error: { code: 'SERVER_ERROR', message: 'down' } },
      { status: 503 },
    )));

    const result = await apiClient.tryRefreshToken();

    expect(result).toEqual({ ok: false, reason: 'SERVER_ERROR' });
    expect(localStorage.getItem('techink_current_user')).toBe('{"id":1}');
  });

  it('clears cached user only when refresh token is invalid', async () => {
    localStorage.setItem('techink_current_user', '{"id":1}');
    apiClient.setToken('stale');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'invalid' } },
      { status: 401 },
    )));

    const result = await apiClient.tryRefreshToken();

    expect(result).toEqual({ ok: false, reason: 'INVALID_REFRESH' });
    expect(apiClient.getToken()).toBeNull();
    expect(localStorage.getItem('techink_current_user')).toBeNull();
  });
});
