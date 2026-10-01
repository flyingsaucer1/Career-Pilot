import crypto from 'node:crypto';
import mongoose, { Types } from 'mongoose';
import { User, IUser } from '../models/User.model';
import { PasswordResetToken } from '../models/PasswordResetToken.model';
import { Resume } from '../models/Resume.model';
import { Analysis } from '../models/Analysis.model';
import { ATSResult } from '../models/ATSResult.model';
import { ResumeVersion } from '../models/ResumeVersion.model';
import { PendingFileDeletion } from '../models/PendingFileDeletion.model';
import { JobApplication } from '../models/JobApplication.model';
import { InterviewSession } from '../models/InterviewSession.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from '../validators/auth.validator';
import { AuthTokens } from '../types/auth.types';
import { env } from '../config/env';
import { sendPasswordResetEmail } from './email.service';
import { retryPendingFileDeletions } from './resume.service';
import { AI_CONSENT_VERSION } from '../middlewares/aiBudget.middleware';

const makeOperationalError = (message: string, statusCode: number) => {
  const error = new Error(message) as Error & { statusCode: number; isOperational: boolean };
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

const createTokens = (user: IUser): AuthTokens => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    sessionVersion: user.sessionVersion ?? 0,
  };
  return { accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) };
};

const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

export class AuthService {
  async register(input: RegisterInput): Promise<{ user: object; tokens: AuthTokens }> {
    if (env.NODE_ENV === 'production' && !input.acceptTerms) throw makeOperationalError('Review and accept the terms before creating an account.', 400);
    if (await User.exists({ email: input.email })) {
      throw makeOperationalError('An account with this email already exists', 409);
    }
    const user = await User.create({ ...input, termsAcceptedAt: input.acceptTerms ? new Date() : undefined, aiConsentVersion: input.acceptAIDataUse ? AI_CONSENT_VERSION : undefined, aiConsentAt: input.acceptAIDataUse ? new Date() : undefined });
    return { user: user.toJSON(), tokens: createTokens(user) };
  }

  async login(input: LoginInput): Promise<{ user: object; tokens: AuthTokens }> {
    const user = await User.findOne({ email: input.email }).select('+password +sessionVersion');
    if (!user || !(await user.comparePassword(input.password))) {
      throw makeOperationalError('Invalid email or password', 401);
    }
    return { user: user.toJSON(), tokens: createTokens(user) };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.id).select('+sessionVersion');
    if (!user || user.sessionVersion !== payload.sessionVersion) {
      throw makeOperationalError('Your session has expired. Please log in again.', 401);
    }
    return createTokens(user);
  }

  async invalidateSession(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = verifyRefreshToken(refreshToken);
      await User.updateOne(
        { _id: payload.id, sessionVersion: payload.sessionVersion },
        { $inc: { sessionVersion: 1 } }
      );
    } catch {
      // Logout remains idempotent for expired or malformed cookies.
    }
  }

  async getMe(userId: string): Promise<object> {
    const user = await User.findById(userId);
    if (!user) throw makeOperationalError('User not found', 404);
    return user.toJSON();
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await User.findOneAndUpdate({
      email,
      $or: [{ lastPasswordResetAt: { $exists: false } }, { lastPasswordResetAt: { $lte: new Date(Date.now() - env.PASSWORD_RESET_COOLDOWN_SECONDS * 1000) } }],
    }, { $set: { lastPasswordResetAt: new Date() } });
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    await PasswordResetToken.deleteMany({ userId: user._id, usedAt: { $exists: false } });
    const reset = await PasswordResetToken.create({
      userId: user._id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60_000),
    });
    const resetUrl = `${env.CLIENT_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`;
    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch {
      await PasswordResetToken.deleteOne({ _id: reset._id });
      throw makeOperationalError('Password reset email could not be sent. Please try again later.', 503);
    }
  }

  async resetPassword(rawToken: string, password: string): Promise<void> {
    const session = await mongoose.startSession();
    let resetSucceeded = false;
    try {
      await session.withTransaction(async () => {
        const reset = await PasswordResetToken.findOne({
          tokenHash: hashToken(rawToken),
          usedAt: { $exists: false },
          expiresAt: { $gt: new Date() },
        }).session(session);
        if (!reset) throw makeOperationalError('This password reset link is invalid or has expired.', 400);

        const user = await User.findById(reset.userId).select('+password +sessionVersion').session(session);
        if (!user) throw makeOperationalError('This password reset link is invalid or has expired.', 400);
        user.password = password;
        user.sessionVersion += 1;
        await user.save({ session });
        reset.usedAt = new Date();
        await reset.save({ session });
        await PasswordResetToken.deleteMany({ userId: user._id, _id: { $ne: reset._id } }, { session });
        resetSucceeded = true;
      });
    } finally {
      await session.endSession();
    }
    if (!resetSucceeded) throw makeOperationalError('Password could not be reset. Please try again.', 503);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<object> {
    const user = await User.findById(userId).select('+password');
    if (!user) throw makeOperationalError('User not found', 404);
    if (input.email !== user.email) {
      if (!input.currentPassword || !(await user.comparePassword(input.currentPassword))) {
        throw makeOperationalError('Enter your current password to change your email.', 401);
      }
      if (await User.exists({ email: input.email, _id: { $ne: user._id } })) {
        throw makeOperationalError('An account with this email already exists', 409);
      }
    }
    user.name = input.name;
    user.email = input.email;
    await user.save();
    return user.toJSON();
  }

  async updatePreferences(userId: string, theme: 'light' | 'dark'): Promise<object> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { 'preferences.theme': theme } },
      { new: true, runValidators: true }
    );
    if (!user) throw makeOperationalError('User not found', 404);
    return user.toJSON();
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<{ user: object; tokens: AuthTokens }> {
    const user = await User.findById(userId).select('+password +sessionVersion');
    if (!user || !(await user.comparePassword(input.currentPassword))) {
      throw makeOperationalError('Current password is incorrect.', 401);
    }
    if (await user.comparePassword(input.newPassword)) {
      throw makeOperationalError('Choose a password different from your current password.', 400);
    }
    user.password = input.newPassword;
    user.sessionVersion += 1;
    await user.save();
    return { user: user.toJSON(), tokens: createTokens(user) };
  }

  async deleteAccount(userId: string, password: string): Promise<{ storageCleanupPending: boolean }> {
    const user = await User.findById(userId).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw makeOperationalError('Password is incorrect.', 401);
    }

    const ownerId = new Types.ObjectId(userId);
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // Serialize concurrent writes/uploads with deletion of this account.
        const owner = await User.updateOne({ _id: ownerId }, { $inc: { writeFence: 1 } }, { session });
        if (!owner.matchedCount) throw makeOperationalError('Account is no longer available.', 409);
        const resumes = await Resume.find({ userId: ownerId }).select('_id cloudinaryPublicId cloudinaryDeliveryType').session(session);
        if (resumes.length) {
          await PendingFileDeletion.insertMany(
            resumes.map((resume) => ({ userId: ownerId, resumeId: resume._id, publicId: resume.cloudinaryPublicId, deliveryType: resume.cloudinaryDeliveryType })),
            { session }
          );
        }
        await Analysis.deleteMany({ userId: ownerId }, { session });
        await ATSResult.deleteMany({ userId: ownerId }, { session });
        await ResumeVersion.deleteMany({ userId: ownerId }, { session });
        await Resume.deleteMany({ userId: ownerId }, { session });
        await JobApplication.deleteMany({ userId: ownerId }, { session });
        await InterviewSession.deleteMany({ userId: ownerId }, { session });
        await PasswordResetToken.deleteMany({ userId: ownerId }, { session });
        const result = await User.deleteOne({ _id: ownerId }, { session });
        if (result.deletedCount !== 1) throw makeOperationalError('Account changed during deletion. Please retry.', 409);
      });
    } catch (error) {
      if ((error as { isOperational?: boolean }).isOperational) throw error;
      throw makeOperationalError('Could not safely delete your account. Please try again.', 503);
    } finally {
      await session.endSession();
    }

    await retryPendingFileDeletions();
    return { storageCleanupPending: await PendingFileDeletion.exists({ userId: ownerId }) !== null };
  }
}

export const authService = new AuthService();
