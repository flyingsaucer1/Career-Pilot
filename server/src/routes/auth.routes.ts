import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { productionRateStore } from '../services/rateLimit.service';
import { User } from '../models/User.model';
import { AI_CONSENT_VERSION } from '../middlewares/aiBudget.middleware';
import {
  register, login, logout, refresh, getMe, forgotPassword, resetPassword,
  updateProfile, updatePreferences, changePassword, deleteAccount,
} from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema,
  updateProfileSchema, updatePreferencesSchema, changePasswordSchema, deleteAccountSchema,
} from '../validators/auth.validator';

const router = Router();
const loginLimiter = rateLimit({
  store: productionRateStore('login'),
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});
const accountCreationLimiter = rateLimit({
  store: productionRateStore('register'),
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many account creation attempts. Please try again later.' },
});
const recoveryLimiter = rateLimit({
  store: productionRateStore('recovery'),
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password recovery attempts. Please try again later.' },
});
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, store: productionRateStore('reset'), standardHeaders: true, legacyHeaders: false });

// Public routes
router.post('/register', accountCreationLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', recoveryLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', resetLimiter, validate(resetPasswordSchema), resetPassword);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/ai-consent', authenticate, async (req, res, next) => {
  if (typeof req.body.accept !== 'boolean') { res.status(400).json({ success: false, message: 'Choose whether to accept AI processing.' }); return; }
  try {
    const user = await User.findByIdAndUpdate(req.user!.id, req.body.accept ? { $set: { aiConsentVersion: AI_CONSENT_VERSION, aiConsentAt: new Date() } } : { $unset: { aiConsentVersion: 1, aiConsentAt: 1 } }, { new: true });
    if (!user) { res.status(401).json({ success: false }); return; }
    res.json({ success: true, data: { user: user.toJSON() } });
  } catch (error) { next(error); }
});
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.patch('/preferences', authenticate, validate(updatePreferencesSchema), updatePreferences);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.delete('/account', authenticate, validate(deleteAccountSchema), deleteAccount);

export default router;
