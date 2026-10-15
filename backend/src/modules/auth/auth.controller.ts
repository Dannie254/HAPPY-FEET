import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { successResponse } from '../../utils/api-response.js';
import {
  decodeTokenUnsafe,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt.utils.js';
import * as authService from './auth.service.js';
import {
  generateMfaSecret,
  getMfaUri,
  verifyMfaToken,
  generateBackupCodes,
  hashBackupCodes,
} from './mfa.utils.js';
import { AppError } from '../../utils/errors.js';
import type { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';

function getClientInfo(req: Request) {
  return {
    userAgent: req.get('user-agent'),
    ip: req.ip,
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  rememberMe = false
) {
  const accessMaxAge = 15 * 60 * 1000;
  const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: accessMaxAge,
    path: '/',
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: refreshMaxAge,
    path: '/api/v1/auth/refresh',
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
}

function setNoCacheHeaders(res: Response) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { userAgent, ip } = getClientInfo(req);
  const result = await authService.register(req.body, userAgent, ip);

  setNoCacheHeaders(res);
  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken, false);

  res.status(201).json(
    successResponse({
      user: result.user,
      accessExpiresIn: result.tokens.accessExpiresIn,
      refreshExpiresIn: result.tokens.refreshExpiresIn,
    })
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { userAgent, ip } = getClientInfo(req);
  const { rememberMe } = req.body;

  const result = await authService.login(req.body, userAgent, ip);

  setNoCacheHeaders(res);
  if (result.mfaRequired) {
    res.json(
      successResponse({
        user: result.user,
        mfaRequired: true,
        sessionId: result.sessionId,
      })
    );
    return;
  }

  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken, rememberMe);

  res.json(
    successResponse({
      user: result.user,
      accessExpiresIn: result.tokens.accessExpiresIn,
      refreshExpiresIn: result.tokens.refreshExpiresIn,
    })
  );
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (refreshToken) {
    const payload = decodeTokenUnsafe(refreshToken);
    if (payload?.sessionId) {
      await authService.logout(payload.sessionId, req.body.revokeAllSessions);
    }
  }

  clearAuthCookies(res);
  setNoCacheHeaders(res);

  res.json(successResponse({ message: 'Logged out successfully' }));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw AppError.unauthorized('Refresh token required');
  }

  const { userAgent, ip } = getClientInfo(req);
  const result = await authService.refreshTokens(refreshToken, userAgent, ip);

  setNoCacheHeaders(res);
  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken, false);

  res.json(
    successResponse({
      user: result.user,
      accessExpiresIn: result.tokens.accessExpiresIn,
      refreshExpiresIn: result.tokens.refreshExpiresIn,
    })
  );
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.body.token);

  setNoCacheHeaders(res);
  res.json(successResponse({ message: 'Email verified successfully' }));
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  await authService.resendVerification(req.body.email);

  setNoCacheHeaders(res);
  res.json(successResponse({ message: 'Verification email sent' }));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);

  setNoCacheHeaders(res);
  res.json(successResponse({ message: 'If the email exists, a reset link has been sent' }));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);

  setNoCacheHeaders(res);
  res.json(successResponse({ message: 'Password reset successfully' }));
});

export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.sub;
  await authService.changePassword(userId, req.body);

  clearAuthCookies(res);
  setNoCacheHeaders(res);

  res.json(successResponse({ message: 'Password changed successfully. Please log in again.' }));
});

export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getProfile(req.user!.sub);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  setNoCacheHeaders(res);
  res.json(successResponse({ user }));
});

export const updateMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.updateProfile(req.user!.sub, req.body);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  setNoCacheHeaders(res);
  res.json(successResponse({ user }));
});

export const getSessions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const sessions = await authService.getUserSessions(req.user!.sub);

  setNoCacheHeaders(res);
  res.json(
    successResponse({
      sessions: sessions.map((s) => ({
        id: s._id,
        userAgent: s.userAgent,
        ip: s.ip,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
    })
  );
});

export const revokeSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await authService.revokeUserSession(req.user!.sub, req.params.sessionId);

  setNoCacheHeaders(res);
  res.json(successResponse({ message: 'Session revoked' }));
});

export const revokeAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await authService.revokeAllSessions(req.user!.sub);

  clearAuthCookies(res);
  setNoCacheHeaders(res);

  res.json(successResponse({ message: 'All sessions revoked' }));
});

export const getMfaSetup = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getProfile(req.user!.sub);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  if (user.mfaEnabled) {
    throw AppError.conflict('MFA is already enabled');
  }

  const secret = generateMfaSecret();
  const uri = getMfaUri(user.email, secret);
  const backupCodes = generateBackupCodes();
  const hashedBackupCodes = await hashBackupCodes(backupCodes);

  await authService.updateMfaSetup(user._id.toString(), secret, hashedBackupCodes);

  setNoCacheHeaders(res);
  res.json(
    successResponse({
      secret,
      uri,
      backupCodes,
    })
  );
});

export const enableMfa = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getProfile(req.user!.sub);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  if (user.mfaEnabled) {
    throw AppError.conflict('MFA is already enabled');
  }

  const { code } = req.body;
  const isValid = await verifyMfaToken(code, user.mfaSecret || '');

  if (!isValid) {
    throw AppError.badRequest('Invalid MFA code');
  }

  await authService.enableMfa(user._id.toString());

  setNoCacheHeaders(res);
  res.json(successResponse({ message: 'MFA enabled successfully' }));
});

export const disableMfa = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getProfile(req.user!.sub);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  if (!user.mfaEnabled) {
    throw AppError.conflict('MFA is not enabled');
  }

  const { password } = req.body;
  const isValid = await authService.verifyUserPassword(user._id.toString(), password);

  if (!isValid) {
    throw AppError.unauthorized('Invalid password');
  }

  await authService.disableMfa(user._id.toString());

  setNoCacheHeaders(res);
  res.json(successResponse({ message: 'MFA disabled successfully' }));
});

export const verifyMfa = asyncHandler(async (req: Request, res: Response) => {
  const { code, sessionId } = req.body;

  const session = await authService.getSessionById(sessionId);
  if (!session) {
    throw AppError.notFound('Session not found');
  }

  const user = await authService.getProfile(session.userId.toString());
  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    throw AppError.forbidden('MFA not configured');
  }

  const isValid = await verifyMfaToken(code, user.mfaSecret);

  if (!isValid) {
    const backupCodeValid = await authService.verifyUserBackupCode(user._id.toString(), code);
    if (!backupCodeValid) {
      throw AppError.unauthorized('Invalid MFA code');
    }
  }

  const tokens = await authService.issueTokensForUser(user, req.get('user-agent'), req.ip);

  setNoCacheHeaders(res);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken, false);

  res.json(
    successResponse({
      user,
      accessExpiresIn: tokens.accessExpiresIn,
      refreshExpiresIn: tokens.refreshExpiresIn,
    })
  );
});
