import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/auth.service';
import { useAuth } from '../store/auth.store';

export type Theme = 'PeopleFlow Midnight' | 'PeopleFlow Light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const normalizeTheme = (t: string | null | undefined): Theme => {
  if (!t) return 'PeopleFlow Midnight';
  if (t === 'Executive Light' || t === 'PeopleFlow Light') {
    return 'PeopleFlow Light';
  }
  return 'PeopleFlow Midnight';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    const localTheme = localStorage.getItem('theme');
    return normalizeTheme(localTheme);
  });

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme === 'PeopleFlow Light' ? 'light' : 'dark');

    if (authService.isAuthenticated()) {
      try {
        await authService.updateTheme(newTheme);
      } catch (err) {
        console.error('Failed to sync theme with server:', err);
      }
    }
  };

  // Keep theme in sync with documentElement on load/change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'PeopleFlow Light' ? 'light' : 'dark');
  }, [theme]);

  // Sync with user details when loaded from API
  useEffect(() => {
    if (user) {
      const userTheme = normalizeTheme((user as any).theme || (user as any).theme_name);
      if (userTheme !== theme) {
        setThemeState(userTheme);
      }
    }
  }, [user]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
