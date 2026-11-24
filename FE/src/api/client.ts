import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { authStorage } from './authStorage';
import { useAuthStore } from '@/stores/authStore';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 동시에 여러 요청이 401을 받아도 토큰 갱신은 한 번만 한다.
let refreshing: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshing) {
    const refreshToken = authStorage.getRefreshToken();
    refreshing = (
      refreshToken
        ? axios
            .post(`${baseURL}/api/v1/auth/refresh`, { refreshToken }, { timeout: 10000 })
            .then((res) => res.data.data.accessToken as string)
        : Promise.reject(new Error('no refresh token'))
    ).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

function expireSession() {
  useAuthStore.getState().clearAuth();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthCall = original?.url?.includes('/api/v1/auth/');
    if (error.response?.status !== 401 || !original || original._retried || isAuthCall) {
      return Promise.reject(error);
    }
    original._retried = true;
    try {
      const token = await refreshAccessToken();
      useAuthStore.getState().setToken(token);
      original.headers.Authorization = `Bearer ${token}`;
      return apiClient(original);
    } catch {
      expireSession();
      return Promise.reject(error);
    }
  },
);

export default apiClient;
