import { createContext } from 'react';
import type { User } from '../types/user.types';
export interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, consent?: { acceptTerms: boolean; acceptAIDataUse: boolean }) => Promise<void>;
  setAIConsent: (accept: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setAccessToken: (token: string) => void;
  updateProfile: (input: { name: string; email: string; currentPassword?: string }) => Promise<void>;
  updateThemePreference: (theme: 'light' | 'dark') => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<{ storageCleanupPending: boolean }>;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
