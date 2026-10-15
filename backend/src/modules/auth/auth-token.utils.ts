import crypto from 'crypto';
import type { AuthTokenDocument } from './auth-token.model.js';
import { AuthTokenModel } from './auth-token.model.js';
import type { TokenType } from '../../shared/types.js';
import { hashPassword, verifyPassword } from './password.utils.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createAuthToken(
  userId: string,
  type: TokenType,
  expiresInMs: number
): Promise<{ token: string; tokenHash: string; expiresAt: Date }> {
  const token = generateSecureToken();
  const tokenHash = await hashPassword(token);
  const expiresAt = new Date(Date.now() + expiresInMs);

  await AuthTokenModel.create({
    userId,
    type,
    tokenHash,
    expiresAt,
  });

  return { token, tokenHash, expiresAt };
}

export async function validateAuthToken(
  userId: string,
  type: TokenType,
  token: string
): Promise<AuthTokenDocument | null> {
  const authToken = await AuthTokenModel.findOne({
    userId,
    type,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).select('+tokenHash');

  if (!authToken) {
    return null;
  }

  const isValid = await verifyPassword(authToken.tokenHash, token);
  if (!isValid) {
    return null;
  }

  return authToken;
}

export async function consumeAuthToken(authTokenId: string): Promise<boolean> {
  const result = await AuthTokenModel.findByIdAndUpdate(
    authTokenId,
    { usedAt: new Date() },
    { new: true }
  );
  return !!result;
}

export async function invalidateAuthTokens(userId: string, type: TokenType): Promise<number> {
  const result = await AuthTokenModel.updateMany(
    { userId, type, usedAt: { $exists: false } },
    { usedAt: new Date() }
  );
  return result.modifiedCount;
}

export async function cleanupExpiredAuthTokens(): Promise<number> {
  const result = await AuthTokenModel.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  logger.info({ deletedCount: result.deletedCount }, 'Cleaned up expired auth tokens');
  return result.deletedCount;
}

export function getEmailVerificationExpiryMs(): number {
  return parseDuration(env.EMAIL_VERIFICATION_EXPIRY);
}

export function getPasswordResetExpiryMs(): number {
  return parseDuration(env.PASSWORD_RESET_EXPIRY);
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 24 * 60 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}
