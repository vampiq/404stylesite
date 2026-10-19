import { create } from 'zustand';
import { api, refreshSession, setAccessToken, setAuthLostHandler } from '@/lib/api';
import type { AuthResponse, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'authed' | 'guest';
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (d: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => {
  const apply = (r: AuthResponse) => { setAccessToken(r.accessToken); set({ user: r.user, status: 'authed' }); };
  return {
    user: null,
    status: 'idle',
    async init() {
      if (get().status !== 'idle') return;
      set({ status: 'loading' });
      const r = await refreshSession();
      if (r) apply(r); else set({ user: null, status: 'guest' });
    },
    async login(email, password) { apply(await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false })); },
    async register(d) { apply(await api<AuthResponse>('/auth/register', { method: 'POST', body: d, auth: false })); },
    async logout() {
      await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
      setAccessToken(null);
      set({ user: null, status: 'guest' });
    },
  };
});

setAuthLostHandler(() => useAuth.setState({ user: null, status: 'guest' }));
