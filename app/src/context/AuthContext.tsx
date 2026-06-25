import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { apiClient } from '@/lib/apiClient';
import type { CurrentUser } from '@/services/auth.types';
import type { LoginCredentials } from '@/services/auth.types';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: CurrentUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refreshAuthStatus: () => Promise<void>;
  updateCurrentUser: (updates: Partial<CurrentUser>) => void;
  /** 认证错误信息 */
  error: string | null;
  /** 清除认证错误 */
  clearError: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Effect to sync auth state with localStorage changes across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'techink_current_user' || e.key === 'techink_auth_token') {
        // Refresh auth status when storage changes (e.g. from another tab)
        refreshAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const initializeAuth = async () => {
    try {
      // P1-5: Auth state machine — unknown -> authenticated | guest
      // Never trust cached user; always verify with backend.
      // BUT: transient network errors should NOT destroy the session.
      const localUser = authService.getCurrentUser();

      if (localUser) {
        try {
          // If access token is not in memory (page refresh), try to refresh it first
          // via the HttpOnly cookie before calling /auth/me
          if (!apiClient.getToken()) {
            const newToken = await apiClient.tryRefreshToken();
            if (newToken) {
              apiClient.setToken(newToken);
            }
          }

          const response = await authService.fetchCurrentUser();
          if (response.success && response.data) {
            // Token verified — authenticated
            setCurrentUser(response.data);
            setIsAuthenticated(true);
          } else {
            // Check if this is a NETWORK_ERROR (backend unreachable) vs auth failure
            if (response.error?.code === 'NETWORK_ERROR') {
              // Backend unreachable — keep cached user, stay authenticated
              console.warn('[Auth] Backend unreachable, keeping cached session');
              setCurrentUser(localUser);
              setIsAuthenticated(true);
            } else {
              // Explicit auth failure (401 after refresh, token revoked, etc) — clear
              console.warn('[Auth] Token validation failed, clearing state');
              authService.logout();
              localStorage.removeItem('techink_current_user');
              setCurrentUser(null);
              setIsAuthenticated(false);
            }
          }
        } catch {
          // Exception during fetch (network error) — keep cached user
          console.warn('[Auth] Backend unreachable during initialization, keeping cached session');
          setCurrentUser(localUser);
          setIsAuthenticated(true);
        }
      } else {
        // No cached user — guest state
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      console.error('[Auth] Initialization failed, entering guest mode');
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setError(null); // Clear previous errors
    const response = await authService.login(credentials);
    if (response.success && response.data) {
      setCurrentUser(response.data.user);
      setIsAuthenticated(true);

      // P2-20: Use localStorage Event for cross-tab sync (not generic Event)
      // StorageEvent only fires on other tabs, not the current one
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'techink_current_user',
        newValue: JSON.stringify(response.data.user)
      }));

      return response.data.user;
    } else {
      const errMsg = response.error?.message || 'Login failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = async () => {
    try {
      // Clear auth service (async — calls backend + clears local state)
      await authService.logout();

      // Clear user service state
      userService.logout();

      // Reset local state after service states are cleared
      setCurrentUser(null);
      setIsAuthenticated(false);

      // Cross-tab sync
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'techink_current_user',
        newValue: null
      }));
    } catch {
      console.error('Logout failed');
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshAuthStatus = async () => {
    try {
      // Reload from backend, not from in-memory singleton (which may be stale
      // if another tab changed localStorage).
      // First try refreshing token, then verify with the backend.
      if (!apiClient.getToken()) {
        try {
          const newToken = await apiClient.tryRefreshToken();
          if (newToken) {
            apiClient.setToken(newToken);
          }
        } catch {
          // Token refresh failed due to network — don't clear session yet
        }
      }
      const response = await authService.fetchCurrentUser();
      if (response.success && response.data) {
        setCurrentUser(response.data);
        setIsAuthenticated(true);
      } else if (response.error?.code === 'NETWORK_ERROR') {
        // Backend unreachable — keep current state
        console.warn('[Auth] Backend unreachable during refresh, keeping current session');
      } else {
        // Explicit auth failure (401, invalid token, etc) — clear
        const localUser = authService.getCurrentUser();
        if (localUser) {
          authService.logout();
          localStorage.removeItem('techink_current_user');
        }
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      // Exception during fetch (network error) — keep current state
      console.warn('[Auth] Exception during refresh, keeping current session');
    }
  };

  const clearError = () => setError(null);

  const updateCurrentUser = (updates: Partial<CurrentUser>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      authService.updateCurrentUser(updates);
      // P2-20: Use StorageEvent for cross-tab sync
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'techink_current_user',
        newValue: JSON.stringify(updatedUser)
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        loading,
        login,
        logout,
        refreshAuthStatus,
        updateCurrentUser,
        error,
        clearError,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};