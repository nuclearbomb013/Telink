import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import type { CurrentUser } from '../services/auth.types';
import type { LoginCredentials } from '../services/auth.types';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: CurrentUser | null;
  login: (credentials: LoginCredentials) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refreshAuthStatus: () => Promise<void>;
  updateCurrentUser: (updates: Partial<CurrentUser>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

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
      const user = authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    } catch {
      console.error('Auth initialization failed');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    if (response.success && response.data) {
      setCurrentUser(response.data.user);
      setIsAuthenticated(true);

      // Dispatch storage event to notify other tabs/components
      window.dispatchEvent(new Event('storage'));

      return response.data.user;
    } else {
      throw new Error(response.error?.message || 'Login failed');
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

      // Dispatch storage event to notify other tabs/components
      window.dispatchEvent(new Event('storage'));
    } catch {
      console.error('Logout failed');
      // 即使失败也要重置本地状态
      setCurrentUser(null);
      setIsAuthenticated(false);
      window.dispatchEvent(new Event('storage'));
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

  const updateCurrentUser = (updates: Partial<CurrentUser>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      authService.updateCurrentUser(updates);
      window.dispatchEvent(new Event('storage'));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        logout,
        refreshAuthStatus,
        updateCurrentUser
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};