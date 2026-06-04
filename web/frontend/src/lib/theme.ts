export type Theme = 'light' | 'dark';

const KEY = 'roadmap_theme';

export function getStoredTheme(): Theme {
  const v = localStorage.getItem(KEY);
  return v === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
}

export function initTheme() {
  applyTheme(getStoredTheme());
}
