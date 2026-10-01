import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { createSingleFlight } from '../utils/singleFlight';

const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// In-memory access token (not in localStorage for XSS safety)
let currentAccessToken: string | null = null;

export const setApiToken = (token: string | null): void => {
  currentAccessToken = token;
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends httpOnly cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — inject access token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

// Response interceptor — handle 401 with token refresh
const refreshFlight = createSingleFlight<string>();

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const publicAuthRequest = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']
      .some((path) => originalRequest.url?.includes(path));

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh') && !publicAuthRequest) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshFlight.run(async () => {
          const { data } = await apiClient.post<{ data: { accessToken: string } }>('/auth/refresh');
          currentAccessToken = data.data.accessToken;
          return data.data.accessToken;
        });
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        currentAccessToken = null;
        // Let the app handle logout via AuthContext
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
