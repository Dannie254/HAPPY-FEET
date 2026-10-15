import type { Types } from 'mongoose';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

export enum TokenType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export interface IUser {
  _id: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  authProvider: AuthProvider;
  providerId?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  passwordHistory?: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession {
  _id: string;
  userId: Types.ObjectId | string;
  refreshTokenHash: string;
  userAgent?: string;
  ip?: string;
  fingerprintHash?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  sessionId: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface JWTPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

export interface IAuthToken {
  _id: string;
  userId: Types.ObjectId | string;
  type: TokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
