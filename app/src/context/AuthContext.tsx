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
      // P1-6: Verify token validity by calling /auth/me
      // This catches expired/revoked tokens and disabled users
      const localUser = authService.getCurrentUser();
      if (localUser) {
        // Set local user first for immediate UI render
        setCurrentUser(localUser);
        setIsAuthenticated(true);

        // Then verify with backend
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
            setCurrentUser(response.data);
            setIsAuthenticated(true);
          } else {
            // Token invalid - clear local state
            console.warn('[Auth] Token validation failed, clearing state');
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        } catch {
          // Backend may be unavailable, keep local state as fallback
          console.warn('[Auth] Backend unavailable during token validation');
        }
      }
    } catch {
      console.error('Auth initialization failed');
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
      // 清除认证服务状态 (this will trigger the global event that UserService listens to)
      authService.logout();

      // 清除用户服务状态 - call explicitly to ensure complete cleanup
      userService.logout();

      // 重置 local state after service states are cleared
      setCurrentUser(null);
      setIsAuthenticated(false);

      // P2-20: Use StorageEvent for cross-tab sync
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
      const user = authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setCurrentUser(null);
      setIsAuthenticated(false);
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