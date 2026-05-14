import { useEffect, useState } from 'react';
import { Theme } from '../lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('terminus-theme') as Theme | null;
      return saved || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('terminus-theme', theme);

    if (theme === 'light') {
      document.body.style.background =
        'radial-gradient(circle at top left, rgba(15,118,110,0.11), transparent 28rem), linear-gradient(135deg, #eef3f7 0%, #e3eaf1 48%, #edf4f8 100%)';
      document.body.style.color = '#0b1220';
    } else if (theme === 'graphite') {
      document.body.style.background =
        'radial-gradient(circle at top left, rgba(45,212,191,0.14), transparent 28rem), linear-gradient(135deg, #0b1220 0%, #111827 48%, #0f172a 100%)';
      document.body.style.color = '#f8fafc';
    } else if (theme === 'sepia') {
      document.body.style.background = 
        'radial-gradient(circle at top left, rgba(240,179,109,0.12), transparent 28rem), linear-gradient(135deg, #211a14 0%, #2a2119 48%, #241c15 100%)';
      document.body.style.color = '#fff7ed';
    } else if (theme === 'midnight') {
      document.body.style.background =
        'radial-gradient(circle at top left, rgba(56,189,248,0.13), transparent 28rem), linear-gradient(135deg, #101015 0%, #181922 48%, #111827 100%)';
      document.body.style.color = '#f8fafc';
    } else {
      document.body.style.background = 
        'radial-gradient(circle at top left, rgba(20,184,166,0.16), transparent 28rem), linear-gradient(135deg, #0f1117 0%, #101522 48%, #121827 100%)';
      document.body.style.color = '#f1f5f9';
    }
  }, [theme]);

  return { theme, setTheme };
}
