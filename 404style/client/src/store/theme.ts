import { create } from 'zustand';

type Theme = 'dark' | 'light';
const KEY = '404style:theme';

const apply = (t: Theme) => {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(KEY, t); } catch { /* приватный режим */ }
};

export const useTheme = create<{ theme: Theme; toggle: () => void }>((set, get) => ({
  theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  toggle() {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    apply(next);
    set({ theme: next });
  },
}));
