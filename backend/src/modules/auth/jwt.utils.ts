import type { SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import type { TokenPayload, JWTPair } from '../../shared/types.js';

const ACCESS_TOKEN_SECRET = env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = env.JWT_REFRESH_SECRET;

const accessSignOptions: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'],
  algorithm: 'HS256',
};

const refreshSignOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'],
  algorithm: 'HS256',
};

export function generateAccessToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, accessSignOptions);
}

export function generateRefreshToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, refreshSignOptions);
}

export function generateTokenPair(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): JWTPair {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const accessDecoded = jwt.decode(accessToken) as TokenPayload;
  const refreshDecoded = jwt.decode(refreshToken) as TokenPayload;

  return {
    accessToken,
    refreshToken,
    accessExpiresIn: (accessDecoded.exp || 0) - (accessDecoded.iat || 0),
    refreshExpiresIn: (refreshDecoded.exp || 0) - (refreshDecoded.iat || 0),
  };
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
  } catch {
    return null;
  }
}

export function decodeTokenUnsafe(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiry(token: string): Date | null {
  const decoded = decodeTokenUnsafe(token);
  if (!decoded || !decoded.exp) return null;
  return new Date(decoded.exp * 1000);
}

export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return expiry < new Date();
}
