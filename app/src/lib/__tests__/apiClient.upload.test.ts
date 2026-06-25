import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '@/lib/apiClient';

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

describe('apiClient.uploadFile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    apiClient.clearToken();
  });

  it('refreshes after a 401 and retries with a rebuilt FormData body', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'expired' } },
        { status: 401 },
      ))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        data: { accessToken: 'fresh-upload-token', refreshToken: '', expiresIn: 604800 },
      }))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        data: { url: '/uploads/a.png', filename: 'a.png', size: 7, content_type: 'image/png' },
        timestamp: 123,
      }));
    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['content'], 'a.png', { type: 'image/png' });
    const result = await apiClient.uploadFile('/upload/image', file);

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/refresh');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ credentials: 'include' });
    expect(fetchMock.mock.calls[2][0]).toBe('/api/v1/upload/image');
    expect(fetchMock.mock.calls[2][1]?.headers).toMatchObject({
      Authorization: 'Bearer fresh-upload-token',
    });

    const firstBody = fetchMock.mock.calls[0][1]?.body;
    const retryBody = fetchMock.mock.calls[2][1]?.body;
    expect(firstBody).toBeInstanceOf(FormData);
    expect(retryBody).toBeInstanceOf(FormData);
    expect(retryBody).not.toBe(firstBody);
  });
});
