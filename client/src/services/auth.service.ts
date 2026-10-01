import apiClient from './api';
import type { AuthResponseData, LoginFormValues } from '../types/api.types';
import type { User } from '../types/user.types';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  acceptTerms?: boolean;
  acceptAIDataUse?: boolean;
}

interface ApiWrapper<T> {
  data: T;
  message: string;
  success: boolean;
}

export const authService = {
  async setAIConsent(accept: boolean): Promise<User> {
    return (await apiClient.post<ApiWrapper<{ user: User }>>('/auth/ai-consent', { accept })).data.data.user;
  },
  async register(input: RegisterInput): Promise<AuthResponseData> {
    const { data } = await apiClient.post<ApiWrapper<AuthResponseData>>('/auth/register', input);
    return data.data;
  },

  async login(input: LoginFormValues): Promise<AuthResponseData> {
    const { data } = await apiClient.post<ApiWrapper<AuthResponseData>>('/auth/login', input);
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async refreshTokens(): Promise<{ accessToken: string; user: User }> {
    const { data } =
      await apiClient.post<ApiWrapper<{ accessToken: string; user: User }>>('/auth/refresh');
    // After refresh, fetch the current user
    const accessToken = data.data.accessToken;
    const meResponse = await apiClient.get<ApiWrapper<{ user: User }>>('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { accessToken, user: meResponse.data.data.user };
  },

  async getMe(token: string): Promise<User> {
    const { data } = await apiClient.get<ApiWrapper<{ user: User }>>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.data.user;
  },

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  async updateProfile(input: { name: string; email: string; currentPassword?: string }): Promise<User> {
    const { data } = await apiClient.patch<ApiWrapper<{ user: User }>>('/auth/profile', input);
    return data.data.user;
  },

  async updatePreferences(theme: 'light' | 'dark'): Promise<User> {
    const { data } = await apiClient.patch<ApiWrapper<{ user: User }>>('/auth/preferences', { theme });
    return data.data.user;
  },

  async changePassword(input: { currentPassword: string; newPassword: string }): Promise<AuthResponseData> {
    const { data } = await apiClient.post<ApiWrapper<AuthResponseData>>('/auth/change-password', input);
    return data.data;
  },

  async deleteAccount(password: string): Promise<{ storageCleanupPending: boolean }> {
    const { data } = await apiClient.delete<ApiWrapper<{ storageCleanupPending: boolean }>>('/auth/account', {
      data: { password },
    });
    return data.data;
  },
};
