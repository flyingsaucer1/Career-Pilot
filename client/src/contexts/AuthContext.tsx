import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { User } from '../types/user.types';
import { authService } from '../services/auth.service';
import { setApiToken } from '../services/api';
import { useTheme } from '../hooks/useTheme';

import { AuthContext } from './AuthContextState';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);
  const { setTheme } = useTheme();

  const setAccessToken = useCallback((token: string) => {
    setAccessTokenState(token);
  }, []);

  // Sync access token to API client
  useEffect(() => {
    setApiToken(accessToken);
  }, [accessToken]);

  // Attempt silent refresh on mount to restore session
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const restoreSession = async () => {
      try {
        const data = await authService.refreshTokens();
        setAccessTokenState(data.accessToken);
        setUser(data.user);
        if (data.user.preferences?.theme) setTheme(data.user.preferences.theme);
      } catch {
        // No valid refresh token — user is logged out
        setUser(null);
        setAccessTokenState(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [setTheme]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    setAccessTokenState(data.accessToken);
    setUser(data.user);
    if (data.user.preferences?.theme) setTheme(data.user.preferences.theme);
  }, [setTheme]);

  const register = useCallback(async (name: string, email: string, password: string, consent?: { acceptTerms: boolean; acceptAIDataUse: boolean }) => {
    const data = await authService.register({ name, email, password, ...consent });
    setAccessTokenState(data.accessToken);
    setUser(data.user);
    if (data.user.preferences?.theme) setTheme(data.user.preferences.theme);
  }, [setTheme]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setAccessTokenState(null);
    }
  }, []);

  const setAIConsent = useCallback(async (accept: boolean) => { setUser(await authService.setAIConsent(accept)); }, []);

  useEffect(() => {
    const forceLogout = () => {
      setUser(null);
      setAccessTokenState(null);
    };
    window.addEventListener('auth:logout', forceLogout);
    return () => window.removeEventListener('auth:logout', forceLogout);
  }, []);

  const updateProfile = useCallback(async (input: { name: string; email: string; currentPassword?: string }) => {
    setUser(await authService.updateProfile(input));
  }, []);

  const updateThemePreference = useCallback(async (theme: 'light' | 'dark') => {
    const updatedUser = await authService.updatePreferences(theme);
    setUser(updatedUser);
    setTheme(theme);
  }, [setTheme]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const data = await authService.changePassword({ currentPassword, newPassword });
    setAccessTokenState(data.accessToken);
    setUser(data.user);
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    const result = await authService.deleteAccount(password);
    setUser(null);
    setAccessTokenState(null);
    return result;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        login,
        register,
        setAIConsent,
        logout,
        setAccessToken,
        updateProfile,
        updateThemePreference,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
