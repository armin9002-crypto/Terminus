import { useEffect, useState } from 'react';
import { parseTheme, resolveTheme, type Theme } from './theme';

function readPreference(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => parseTheme(readPreference('terminus-theme')));
  const [systemLight, setSystemLight] = useState(() => window.matchMedia('(prefers-color-scheme: light)').matches);
  const [reduceTransparency, setReduceTransparency] = useState(() => readPreference('terminus-reduce-transparency') === 'true');
  const [reduceMotion, setReduceMotion] = useState(() => readPreference('terminus-reduce-motion') === 'true');
  const [preferenceError, setPreferenceError] = useState(false);
  const resolvedTheme = resolveTheme(theme, systemLight);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: light)');
    const update = () => setSystemLight(query.matches);
    query.addEventListener('change', update);
    update();
    const sync = (event: StorageEvent) => {
      if (event.key === 'terminus-theme') setTheme(parseTheme(event.newValue));
      if (event.key === 'terminus-reduce-transparency') setReduceTransparency(event.newValue === 'true');
      if (event.key === 'terminus-reduce-motion') setReduceMotion(event.newValue === 'true');
    };
    window.addEventListener('storage', sync);
    return () => { query.removeEventListener('change', update); window.removeEventListener('storage', sync); };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.reduceTransparency = String(reduceTransparency);
    document.documentElement.dataset.reduceMotion = String(reduceMotion);
    try {
      localStorage.setItem('terminus-theme', theme);
      localStorage.setItem('terminus-reduce-transparency', String(reduceTransparency));
      localStorage.setItem('terminus-reduce-motion', String(reduceMotion));
      setPreferenceError(false);
    } catch { setPreferenceError(true); }
  }, [theme, resolvedTheme, reduceTransparency, reduceMotion]);

  return { theme, setTheme, resolvedTheme, reduceTransparency, setReduceTransparency, reduceMotion, setReduceMotion, preferenceError };
}
