import { useEffect, useState } from 'react';
import { Theme } from '@/lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('terminus-theme') as Theme) || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('terminus-theme', theme);
    document.documentElement.style.transition = 'all 0.3s ease';
  }, [theme]);

  return { theme, setTheme };
}