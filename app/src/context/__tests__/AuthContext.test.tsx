import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, AuthProvider } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { authService } from '@/services/auth.service';

vi.mock('@/services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    fetchCurrentUser: vi.fn(),
    logout: vi.fn(),
    login: vi.fn(),
    updateCurrentUser: vi.fn(),
  },
}));

vi.mock('@/services/user.service', () => ({
  userService: {
    logout: vi.fn(),
  },
}));

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    getToken: vi.fn(),
    setToken: vi.fn(),
    tryRefreshToken: vi.fn(),
  },
}));

const cachedUser = {
  id: 1,
  username: 'cached',
  email: 'cached@example.com',
  role: 'user' as const,
};

function Consumer() {
  const context = React.useContext(AuthContext);
  if (!context) return null;

  return (
    <div>
      <span data-testid="authenticated">{String(context.isAuthenticated)}</span>
      <span data-testid="current-user">{context.currentUser?.username ?? 'none'}</span>
    </div>
  );
}

describe('AuthContext initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('techink_current_user', JSON.stringify(cachedUser));
    vi.mocked(authService.getCurrentUser).mockReturnValue(cachedUser);
    vi.mocked(apiClient.getToken).mockReturnValue(null);
    vi.mocked(apiClient.tryRefreshToken).mockResolvedValue({ ok: true, accessToken: 'fresh' });
  });

  it('does not trust a cached localStorage user after refresh and auth validation fail', async () => {
    vi.mocked(apiClient.tryRefreshToken).mockResolvedValue({ ok: false, reason: 'INVALID_REFRESH' });
    vi.mocked(authService.fetchCurrentUser).mockResolvedValue({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'invalid' },
      timestamp: Date.now(),
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(await screen.findByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('current-user')).toHaveTextContent('none');
    expect(authService.logout).toHaveBeenCalled();
    expect(authService.fetchCurrentUser).not.toHaveBeenCalled();
    expect(localStorage.getItem('techink_current_user')).toBeNull();
  });

  it('keeps the cached user when backend validation fails with a network error', async () => {
    vi.mocked(authService.fetchCurrentUser).mockResolvedValue({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'offline' },
      timestamp: Date.now(),
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(await screen.findByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('current-user')).toHaveTextContent('cached');
    expect(authService.logout).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(localStorage.getItem('techink_current_user')).toBe(JSON.stringify(cachedUser));
    });
  });

  it('keeps the cached user when refresh fails with a network error', async () => {
    vi.mocked(apiClient.tryRefreshToken).mockResolvedValue({ ok: false, reason: 'NETWORK_ERROR' });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(await screen.findByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('current-user')).toHaveTextContent('cached');
    expect(authService.logout).not.toHaveBeenCalled();
    expect(authService.fetchCurrentUser).not.toHaveBeenCalled();
  });
});
