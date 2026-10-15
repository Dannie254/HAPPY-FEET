import type { SessionDocument } from './session.model.js';
import { SessionModel } from './session.model.js';
import { hashPassword, verifyPassword } from './password.utils.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import crypto from 'crypto';

export interface SessionDeviceFingerprint {
  userAgent: string;
  ip: string;
  fingerprintHash: string;
}

function generateFingerprintHash(userAgent?: string, ip?: string): string {
  const data = `${userAgent || ''}:${ip || ''}:${env.JWT_REFRESH_SECRET}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function createSession(
  userId: string,
  refreshToken: string,
  userAgent?: string,
  ip?: string
): Promise<SessionDocument> {
  const refreshTokenHash = await hashPassword(refreshToken);
  const expiresAt = new Date(Date.now() + env.SESSION_MAX_AGE);
  const fingerprintHash = generateFingerprintHash(userAgent, ip);

  const session = await SessionModel.create({
    userId,
    refreshTokenHash,
    userAgent,
    ip,
    fingerprintHash,
    expiresAt,
  });

  return session;
}

export async function validateSession(
  sessionId: string,
  refreshToken: string,
  userAgent?: string,
  ip?: string
): Promise<SessionDocument | null> {
  const session = await SessionModel.findById(sessionId).select('+refreshTokenHash +fingerprintHash');

  if (!session) {
    return null;
  }

  if (session.revokedAt) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    return null;
  }

  const isValid = await verifyPassword(session.refreshTokenHash, refreshToken);
  if (!isValid) {
    return null;
  }

  const expectedFingerprint = generateFingerprintHash(userAgent, ip);
  if (session.fingerprintHash !== expectedFingerprint) {
    logger.warn({ sessionId, userId: session.userId }, 'Session fingerprint mismatch - possible token theft');
    return null;
  }

  return session;
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  const result = await SessionModel.findByIdAndUpdate(
    sessionId,
    { revokedAt: new Date() },
    { new: true }
  );
  return !!result;
}

export async function revokeAllUserSessions(userId: string): Promise<number> {
  const result = await SessionModel.updateMany(
    { userId, revokedAt: { $exists: false } },
    { revokedAt: new Date() }
  );
  return result.modifiedCount;
}

export async function revokeOtherSessions(
  userId: string,
  currentSessionId: string
): Promise<number> {
  const result = await SessionModel.updateMany(
    { userId, _id: { $ne: currentSessionId }, revokedAt: { $exists: false } },
    { revokedAt: new Date() }
  );
  return result.modifiedCount;
}

export async function rotateRefreshToken(
  sessionId: string,
  oldRefreshToken: string,
  newRefreshToken: string,
  userAgent?: string,
  ip?: string
): Promise<SessionDocument | null> {
  const session = await validateSession(sessionId, oldRefreshToken, userAgent, ip);
  if (!session) {
    return null;
  }

  const newRefreshTokenHash = await hashPassword(newRefreshToken);
  session.refreshTokenHash = newRefreshTokenHash;
  session.expiresAt = new Date(Date.now() + env.SESSION_MAX_AGE);
  session.fingerprintHash = generateFingerprintHash(userAgent, ip);
  await session.save();

  return session;
}

export async function cleanupExpiredSessions(): Promise<number> {
  const result = await SessionModel.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  logger.info({ deletedCount: result.deletedCount }, 'Cleaned up expired sessions');
  return result.deletedCount;
}

export async function getActiveSessions(userId: string): Promise<SessionDocument[]> {
  return SessionModel.find({
    userId,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
}

export async function getSessionById(sessionId: string): Promise<SessionDocument | null> {
  return SessionModel.findById(sessionId);
}
