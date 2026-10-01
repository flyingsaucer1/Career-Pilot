import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response.utils';
import { env } from '../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.COOKIE_SAME_SITE,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, tokens } = await authService.register(req.body);
    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(
      res,
      { user, accessToken: tokens.accessToken },
      'Account created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, tokens } = await authService.login(req.body);
    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, { user, accessToken: tokens.accessToken }, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.invalidateSession(req.cookies?.refreshToken as string | undefined);
    res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: undefined });
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.requestPasswordReset(req.body.email);
    sendSuccess(res, null, 'If an account exists for that email, a reset link has been sent.');
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: undefined });
    sendSuccess(res, null, 'Password reset successfully. Sign in with your new password.');
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.updateProfile(req.user!.id, req.body);
    sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.updatePreferences(req.user!.id, req.body.theme);
    sendSuccess(res, { user }, 'Preferences updated successfully');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, tokens } = await authService.changePassword(req.user!.id, req.body);
    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, { user, accessToken: tokens.accessToken }, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.deleteAccount(req.user!.id, req.body.password);
    res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: undefined });
    sendSuccess(
      res,
      result,
      result.storageCleanupPending
        ? 'Account deleted. Stored files are queued for cleanup.'
        : 'Account and associated data deleted successfully.',
      result.storageCleanupPending ? 202 : 200
    );
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken) {
      sendError(res, 'Refresh token not found. Please log in.', 401);
      return;
    }
    const tokens = await authService.refreshTokens(refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, { accessToken: tokens.accessToken }, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, { user }, 'Profile fetched successfully');
  } catch (error) {
    next(error);
  }
};
