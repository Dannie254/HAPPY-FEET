import crypto from 'crypto';
import { generateSecret, generateURI, verify } from 'otplib';
import { env } from '../../config/env.js';

export function generateMfaSecret(): string {
  return generateSecret();
}

export function getMfaUri(userEmail: string, secret: string): string {
  return generateURI({ issuer: 'Happy Feet', label: userEmail, secret });
}

export async function verifyMfaToken(token: string, secret: string): Promise<boolean> {
  const result = await verify({ token, secret });
  return result.valid;
}

export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const bcrypt = await import('bcryptjs');
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

export async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  for (const hashed of hashedCodes) {
    if (await bcrypt.compare(code, hashed)) {
      return true;
    }
  }
  return false;
}