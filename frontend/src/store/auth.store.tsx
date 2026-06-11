import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../api/auth.service';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authService.getStoredUser();
      if (storedUser && authService.isAuthenticated()) {
        setUser(storedUser);
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch {
          // Token might be expired, interceptor handles refresh
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { user: loggedUser } = await authService.login({ email, password });
    setUser(loggedUser);
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
      toast.success(`Welcome back, ${freshUser.firstName || freshUser.first_name || freshUser.email}!`);
    } catch {
      toast.success(`Welcome back, ${loggedUser.firstName || loggedUser.first_name || loggedUser.email}!`);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
    } catch {}
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    if (user.permissions?.includes('all')) return true;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions?.includes('all')) return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}