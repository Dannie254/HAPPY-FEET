import { OAuth2Client } from 'google-auth-library';
import { UserModel } from '../users/user.model.js';
import type { UserDocument } from '../users/user.model.js';
import { UserRole, UserStatus, AuthProvider } from '../../shared/types.js';
import { AppError } from '../../utils/errors.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { issueTokensForUser } from './auth.service.js';
import { generateTokenPair } from './jwt.utils.js';
import crypto from 'crypto';

const googleClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_CALLBACK_URL
);

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function getGoogleAuthUrl(state?: string): Promise<string> {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
    prompt: 'consent',
  });
}

export async function handleGoogleCallback(code: string): Promise<GoogleUserInfo> {
  const { tokens } = await googleClient.getToken(code);
  googleClient.setCredentials(tokens);

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token!,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw AppError.unauthorized('Invalid Google token');
  }

  return {
    sub: payload.sub,
    email: payload.email!,
    email_verified: payload.email_verified!,
    given_name: payload.given_name,
    family_name: payload.family_name,
    picture: payload.picture,
  };
}

export async function findOrCreateGoogleUser(
  googleUser: GoogleUserInfo,
  userAgent?: string,
  ip?: string
) {
  let user = await UserModel.findOne({
    authProvider: AuthProvider.GOOGLE,
    providerId: googleUser.sub,
  });

  if (user) {
    user.lastLoginAt = new Date();
    await user.save();
    return issueTokensForUserWithMfa(user, userAgent, ip);
  }

  user = await UserModel.findOne({ email: googleUser.email.toLowerCase() });

  if (user) {
    if (user.authProvider !== AuthProvider.LOCAL && user.authProvider !== AuthProvider.GOOGLE) {
      throw AppError.conflict(
        `Account exists with ${user.authProvider}. Please sign in with ${user.authProvider}.`
      );
    }

    user.authProvider = AuthProvider.GOOGLE;
    user.providerId = googleUser.sub;
    user.emailVerified = googleUser.email_verified;
    user.lastLoginAt = new Date();
    if (googleUser.given_name && !user.firstName) user.firstName = googleUser.given_name;
    if (googleUser.family_name && !user.lastName) user.lastName = googleUser.family_name;
    await user.save();

    return issueTokensForUserWithMfa(user, userAgent, ip);
  }

  user = await UserModel.create({
    email: googleUser.email.toLowerCase(),
    firstName: googleUser.given_name || 'User',
    lastName: googleUser.family_name || '',
    authProvider: AuthProvider.GOOGLE,
    providerId: googleUser.sub,
    emailVerified: googleUser.email_verified,
    role: UserRole.CUSTOMER,
    status: googleUser.email_verified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
  });

  logger.info({ userId: user._id, email: user.email }, 'Google user created');

  return issueTokensForUserWithMfa(user, userAgent, ip);
}

export interface AppleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

export async function handleAppleCallback(idToken: string, userAgent?: string, ip?: string) {
  const appleKeys = await fetchApplePublicKeys();
  const payload = await verifyAppleToken(idToken, appleKeys);

  if (!payload) {
    throw AppError.unauthorized('Invalid Apple token');
  }

  const appleUser: AppleUserInfo = {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified,
    name: payload.name,
  };

  return findOrCreateAppleUser(appleUser, userAgent, ip);
}

async function fetchApplePublicKeys(): Promise<Record<string, string>> {
  const response = await fetch('https://appleid.apple.com/auth/keys');
  const data = (await response.json()) as { keys: Array<{ kid: string; n: string; e: string }> };
  const keys: Record<string, string> = {};
  for (const key of data.keys) {
    keys[key.kid] = `-----BEGIN PUBLIC KEY-----\n${key.n}\n-----END PUBLIC KEY-----`;
  }
  return keys;
}

async function verifyAppleToken(
  idToken: string,
  publicKeys: Record<string, string>
): Promise<AppleUserInfo | null> {
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;

  const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
  const kid = header.kid;

  if (!publicKeys[kid]) return null;

  return {
    sub: '',
    email: undefined,
    email_verified: undefined,
    name: undefined,
  };
}

async function findOrCreateAppleUser(appleUser: AppleUserInfo, userAgent?: string, ip?: string) {
  if (!appleUser.email) {
    throw AppError.badRequest('Apple account must have an email');
  }

  let user = await UserModel.findOne({
    authProvider: AuthProvider.APPLE,
    providerId: appleUser.sub,
  });

  if (user) {
    user.lastLoginAt = new Date();
    await user.save();
    return issueTokensForUserWithMfa(user, userAgent, ip);
  }

  user = await UserModel.findOne({ email: appleUser.email.toLowerCase() });

  if (user) {
    if (user.authProvider !== AuthProvider.LOCAL && user.authProvider !== AuthProvider.APPLE) {
      throw AppError.conflict(
        `Account exists with ${user.authProvider}. Please sign in with ${user.authProvider}.`
      );
    }

    user.authProvider = AuthProvider.APPLE;
    user.providerId = appleUser.sub;
    user.emailVerified = appleUser.email_verified ?? false;
    user.lastLoginAt = new Date();
    if (appleUser.name?.firstName && !user.firstName) user.firstName = appleUser.name.firstName;
    if (appleUser.name?.lastName && !user.lastName) user.lastName = appleUser.name.lastName;
    await user.save();

    return issueTokensForUserWithMfa(user, userAgent, ip);
  }

  user = await UserModel.create({
    email: appleUser.email.toLowerCase(),
    firstName: appleUser.name?.firstName || 'User',
    lastName: appleUser.name?.lastName || '',
    authProvider: AuthProvider.APPLE,
    providerId: appleUser.sub,
    emailVerified: appleUser.email_verified ?? false,
    role: UserRole.CUSTOMER,
    status: appleUser.email_verified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
  });

  logger.info({ userId: user._id, email: user.email }, 'Apple user created');

  return issueTokensForUserWithMfa(user, userAgent, ip);
}

async function issueTokensForUserWithMfa(
  user: UserDocument,
  userAgent?: string,
  ip?: string
): Promise<{ accessToken: string; refreshToken: string; accessExpiresIn: number; refreshExpiresIn: number; mfaRequired: boolean; sessionId?: string }> {
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

    const { createSession } = await import('./session.utils.js');
    await createSession(user._id.toString(), refreshToken, userAgent, ip);

    return { ...tokens, mfaRequired: true, sessionId };
  }

  const tokens = await issueTokensForUser(user, userAgent, ip);
  return { ...tokens, mfaRequired: false };
}

export { googleClient };
