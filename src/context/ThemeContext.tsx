'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    const body = document.body;
    let isDark = false;

    if (mode === 'dark') {
      isDark = true;
    } else if (mode === 'light') {
      isDark = false;
    } else {
      // System preference
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      root.classList.add('dark');
      if (body) body.classList.add('dark');
      setResolvedTheme('dark');
    } else {
      root.classList.remove('dark');
      if (body) body.classList.remove('dark');
      setResolvedTheme('light');
    }
  };

  useEffect(() => {
    // Read saved theme from localStorage
    const savedTheme = (localStorage.getItem('theme') as ThemeMode) || 'system';
    setThemeState(savedTheme);
    applyTheme(savedTheme);

    // Listen for system theme changes if mode is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentSaved = (localStorage.getItem('theme') as ThemeMode) || 'system';
      if (currentSaved === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme musi być używane wewnątrz ThemeProvider');
  }
  return context;
}
