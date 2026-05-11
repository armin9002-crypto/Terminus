import { useEffect, useState } from 'react';
import { Theme } from '../lib/theme';

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

    if (theme === 'light') {
      document.body.style.background = '#f8fafc';
      document.body.style.color = '#0f172a';
    } else if (theme === 'sepia') {
      document.body.style.background = 
        'linear-gradient(135deg, #1c1510 0%, #241d16 48%, #1c1510 100%)';
      document.body.style.color = '#f5e6d3';
    } else {
      document.body.style.background = 
        'radial-gradient(circle at top left, rgba(20,184,166,0.16), transparent 28rem), linear-gradient(135deg, #0f1117 0%, #101522 48%, #121827 100%)';
      document.body.style.color = '#f1f5f9';
    }
  }, [theme]);

  return { theme, setTheme };
}