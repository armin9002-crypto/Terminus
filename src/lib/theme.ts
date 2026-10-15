export type Theme = 'graphite' | 'porcelain' | 'system';
export type ResolvedTheme = Exclude<Theme, 'system'>;

export function parseTheme(value: string | null): Theme {
  if (value === 'porcelain' || value === 'light') return 'porcelain';
  if (value === 'system') return 'system';
  return 'graphite';
}

export function resolveTheme(theme: Theme, systemLight: boolean): ResolvedTheme {
  return theme === 'system' ? (systemLight ? 'porcelain' : 'graphite') : theme;
}
