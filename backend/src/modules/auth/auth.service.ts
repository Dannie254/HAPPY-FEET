import crypto from 'crypto';
import type { UserDocument } from '../users/user.model.js';
import { UserModel } from '../users/user.model.js';
import { SessionModel } from './session.model.js';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  needsRehash,
} from './password.utils.js';
import { generateTokenPair, verifyRefreshToken } from './jwt.utils.js';
import {
  createSession,
  validateSession,
  revokeSession,
  revokeAllUserSessions,
  rotateRefreshToken,
  getActiveSessions,
} from './session.utils.js';
import {
  createAuthToken,
  validateAuthToken,
  consumeAuthToken,
  invalidateAuthTokens,
  getEmailVerificationExpiryMs,
  getPasswordResetExpiryMs,
} from './auth-token.utils.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
} from './email.service.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { UserRole, UserStatus, AuthProvider, TokenType } from '../../shared/types.js';
import type { RegisterInput, LoginInput, ChangePasswordInput } from './auth.schemas.js';
import { verifyMfaToken } from './mfa.utils.js';

export interface AuthResult {
  user: UserDocument;
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessExpiresIn: number;
    refreshExpiresIn: number;
  };
  mfaRequired?: boolean;
  sessionId?: string;
}

export async function register(
  input: RegisterInput,
  userAgent?: string,
  ip?: string
): Promise<AuthResult> {
  const existingUser = await UserModel.findOne({
    $or: [{ email: input.email.toLowerCase() }, ...(input.phone ? [{ phone: input.phone }] : [])],
  });

  if (existingUser) {
    throw AppError.conflict('User with this email or phone already exists');
  }

  const passwordValidation = validatePasswordStrength(input.password);
  if (!passwordValidation.valid) {
    throw AppError.badRequest('Password does not meet requirements', passwordValidation.errors);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await UserModel.create({
    email: input.email.toLowerCase(),
    phone: input.phone,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    role: UserRole.CUSTOMER,
    status: UserStatus.PENDING_VERIFICATION,
    authProvider: AuthProvider.LOCAL,
    emailVerified: false,
  });

  const { token } = await createAuthToken(
    user._id.toString(),
    TokenType.EMAIL_VERIFICATION,
    getEmailVerificationExpiryMs()
  );
  await sendVerificationEmail(user.email, user.firstName, token);

  const tokens = await issueTokensForUser(user, userAgent, ip);

  logger.info({ userId: user._id, email: user.email }, 'User registered');

  return { user, tokens };
}

export async function login(
  input: LoginInput,
  userAgent?: string,
  ip?: string
): Promise<AuthResult> {
  const user = await UserModel.findOne({ email: input.email.toLowerCase() }).select(
    '+passwordHash'
  );

  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  if (user.authProvider !== AuthProvider.LOCAL) {
    throw AppError.unauthorized(`Please sign in with ${user.authProvider}`);
  }

  if (!user.passwordHash) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const isValid = await verifyPassword(user.passwordHash, input.password);
  if (!isValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw AppError.forbidden('Account suspended');
  }

  if (user.status === UserStatus.DELETED) {
    throw AppError.unauthorized('Account not found');
  }

  if (user.status === UserStatus.PENDING_VERIFICATION) {
    throw AppError.forbidden('Please verify your email address first');
  }

  if (await needsRehash(user.passwordHash)) {
    user.passwordHash = await hashPassword(input.password);
    await user.save();
  }

  user.lastLoginAt = new Date();
  await user.save();

  if (user.mfaEnabled) {
    const sessionId = crypto.randomUUID();
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId,
    };

    const tokens = generateTokenPair(payload);
    const refreshToken = tokens.refreshToken;

    await createSession(user._id.toString(), refreshToken, userAgent, ip);

    logger.info({ userId: user._id, email: user.email }, 'User logged in - MFA required');

    return { user, tokens, mfaRequired: true, sessionId };
  }

  const tokens = await issueTokensForUser(user, userAgent, ip);

  logger.info({ userId: user._id, email: user.email }, 'User logged in');

  return { user, tokens };
}

export async function logout(sessionId: string, revokeAll: boolean = false): Promise<void> {
  if (revokeAll) {
    const session = await SessionModel.findById(sessionId);
    if (session) {
      await revokeAllUserSessions(session.userId.toString());
    }
  } else {
    await revokeSession(sessionId);
  }
}

export async function refreshTokens(
  refreshToken: string,
  userAgent?: string,
  ip?: string
): Promise<AuthResult> {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw AppError.unauthorized('Invalid refresh token');
  }

  const session = await validateSession(payload.sessionId, refreshToken, userAgent, ip);
  if (!session) {
    throw AppError.unauthorized('Session invalid or expired');
  }

  const user = await UserModel.findById(payload.sub);
  if (!user) {
    throw AppError.unauthorized('User not found');
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw AppError.forbidden('Account not active');
  }

  const newRefreshToken = generateSecureToken();
  const newTokens = await rotateRefreshToken(
    session._id.toString(),
    refreshToken,
    newRefreshToken,
    userAgent,
    ip
  );
  if (!newTokens) {
    throw AppError.unauthorized('Failed to rotate token');
  }

  const newTokenPair = generateTokenPair({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    sessionId: session._id.toString(),
  });

  logger.info({ userId: user._id }, 'Tokens refreshed');

  return { user, tokens: newTokenPair };
}

export async function verifyEmail(token: string): Promise<UserDocument> {
  const authToken = await validateAuthToken('', TokenType.EMAIL_VERIFICATION, token);
  if (!authToken) {
    throw AppError.badRequest('Invalid or expired verification token');
  }

  const user = await UserModel.findById(authToken.userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  if (user.emailVerified) {
    throw AppError.conflict('Email already verified');
  }

  user.emailVerified = true;
  user.status = UserStatus.ACTIVE;
  await user.save();

  await consumeAuthToken(authToken._id.toString());

  await sendWelcomeEmail(user.email, user.firstName);

  logger.info({ userId: user._id }, 'Email verified');

  return user;
}

export async function resendVerification(email: string): Promise<void> {
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    return;
  }

  if (user.emailVerified) {
    throw AppError.conflict('Email already verified');
  }

  await invalidateAuthTokens(user._id.toString(), TokenType.EMAIL_VERIFICATION);

  const { token } = await createAuthToken(
    user._id.toString(),
    TokenType.EMAIL_VERIFICATION,
    getEmailVerificationExpiryMs()
  );
  await sendVerificationEmail(user.email, user.firstName, token);

  logger.info({ userId: user._id }, 'Verification email resent');
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    return;
  }

  if (user.authProvider !== AuthProvider.LOCAL) {
    return;
  }

  await invalidateAuthTokens(user._id.toString(), TokenType.PASSWORD_RESET);

  const { token } = await createAuthToken(
    user._id.toString(),
    TokenType.PASSWORD_RESET,
    getPasswordResetExpiryMs()
  );
  await sendPasswordResetEmail(user.email, user.firstName, token);

  logger.info({ userId: user._id }, 'Password reset email sent');
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    throw AppError.badRequest('Password does not meet requirements', passwordValidation.errors);
  }

  const authToken = await validateAuthToken('', TokenType.PASSWORD_RESET, token);
  if (!authToken) {
    throw AppError.badRequest('Invalid or expired reset token');
  }

  const user = await UserModel.findById(authToken.userId).select('+passwordHash +passwordHistory');
  if (!user) {
    throw AppError.notFound('User not found');
  }

  const isSamePassword = await verifyPassword(user.passwordHash || '', password);
  if (isSamePassword) {
    throw AppError.badRequest('New password must be different from current password');
  }

  if (user.passwordHistory && user.passwordHistory.length > 0) {
    for (const oldHash of user.passwordHistory) {
      const isReused = await verifyPassword(oldHash, password);
      if (isReused) {
        throw AppError.badRequest('Password has been used recently. Please choose a different password.');
      }
    }
  }

  const passwordHistory = user.passwordHistory || [];
  passwordHistory.unshift(user.passwordHash || '');
  if (passwordHistory.length > 5) {
    passwordHistory.pop();
  }

  user.passwordHash = await hashPassword(password);
  user.passwordHistory = passwordHistory;
  await user.save();

  await consumeAuthToken(authToken._id.toString());

  await revokeAllUserSessions(user._id.toString());

  await sendPasswordChangedEmail(user.email, user.firstName);

  logger.info({ userId: user._id }, 'Password reset');
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const user = await UserModel.findById(userId).select('+passwordHash +passwordHistory');
  if (!user) {
    throw AppError.notFound('User not found');
  }

  if (user.authProvider !== AuthProvider.LOCAL) {
    throw AppError.badRequest('Cannot change password for OAuth accounts');
  }

  const isValid = await verifyPassword(user.passwordHash || '', input.currentPassword);
  if (!isValid) {
    throw AppError.unauthorized('Current password is incorrect');
  }

  const passwordValidation = validatePasswordStrength(input.newPassword);
  if (!passwordValidation.valid) {
    throw AppError.badRequest('Password does not meet requirements', passwordValidation.errors);
  }

  const isSamePassword = await verifyPassword(user.passwordHash || '', input.newPassword);
  if (isSamePassword) {
    throw AppError.badRequest('New password must be different from current password');
  }

  if (user.passwordHistory && user.passwordHistory.length > 0) {
    for (const oldHash of user.passwordHistory) {
      const isReused = await verifyPassword(oldHash, input.newPassword);
      if (isReused) {
        throw AppError.badRequest('Password has been used recently. Please choose a different password.');
      }
    }
  }

  const passwordHistory = user.passwordHistory || [];
  passwordHistory.unshift(user.passwordHash || '');
  if (passwordHistory.length > 5) {
    passwordHistory.pop();
  }

  user.passwordHash = await hashPassword(input.newPassword);
  user.passwordHistory = passwordHistory;
  await user.save();

  await revokeAllUserSessions(userId);

  await sendPasswordChangedEmail(user.email, user.firstName);

  logger.info({ userId }, 'Password changed');
}

export async function getProfile(userId: string): Promise<UserDocument | null> {
  return UserModel.findById(userId);
}

export async function updateProfile(
  userId: string,
  data: { firstName?: string; lastName?: string; phone?: string }
): Promise<UserDocument | null> {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true, runValidators: true }
  );
  return user;
}

export async function getUserSessions(userId: string) {
  return getActiveSessions(userId);
}

export async function revokeUserSession(userId: string, sessionId: string): Promise<void> {
  const session = await SessionModel.findById(sessionId);
  if (!session || session.userId.toString() !== userId) {
    throw AppError.notFound('Session not found');
  }
  await revokeSession(sessionId);
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await revokeAllUserSessions(userId);
}

export async function issueTokensForUser(
  user: UserDocument,
  userAgent?: string,
  ip?: string
): Promise<AuthResult['tokens']> {
  const sessionId = crypto.randomUUID();
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    sessionId,
  };

  const tokens = generateTokenPair(payload);
  const refreshToken = tokens.refreshToken;

  return createSession(user._id.toString(), refreshToken, userAgent, ip).then(() => tokens);
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function updateMfaSetup(userId: string, secret: string, backupCodes: string[]): Promise<void> {
  await UserModel.findByIdAndUpdate(userId, {
    mfaSecret: secret,
    mfaBackupCodes: backupCodes,
  });
}

export async function enableMfa(userId: string): Promise<void> {
  await UserModel.findByIdAndUpdate(userId, {
    mfaEnabled: true,
  });
}

export async function disableMfa(userId: string): Promise<void> {
  await UserModel.findByIdAndUpdate(userId, {
    mfaEnabled: false,
    mfaSecret: null,
    mfaBackupCodes: [],
  });
}

export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  const user = await UserModel.findById(userId).select('+passwordHash');
  if (!user || !user.passwordHash) {
    return false;
  }
  const { verifyPassword } = await import('./password.utils.js');
  return verifyPassword(user.passwordHash, password);
}

export async function verifyUserBackupCode(userId: string, code: string): Promise<boolean> {
  const user = await UserModel.findById(userId).select('+mfaBackupCodes');
  if (!user || !user.mfaBackupCodes || user.mfaBackupCodes.length === 0) {
    return false;
  }
  const { verifyBackupCode } = await import('./mfa.utils.js');
  return verifyBackupCode(code, user.mfaBackupCodes);
}

export async function getSessionById(sessionId: string) {
  const { getSessionById: getSession } = await import('./session.utils.js');
  return getSession(sessionId);
}
