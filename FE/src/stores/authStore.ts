import { create } from 'zustand';
import type { User } from '@/types/user';
import { authStorage } from '@/api/authStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
}

const storedUser = authStorage.getUserJson();

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser ? (JSON.parse(storedUser) as User) : null,
  token: authStorage.getAccessToken(),
  setAuth: (user, token) => {
    authStorage.setUserJson(JSON.stringify(user));
    authStorage.setAccessToken(token);
    set({ user, token });
  },
  setToken: (token) => {
    authStorage.setAccessToken(token);
    set({ token });
  },
  clearAuth: () => {
    authStorage.clear();
    set({ user: null, token: null });
  },
}));
