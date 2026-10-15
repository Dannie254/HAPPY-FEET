import crypto from 'crypto';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { successResponse } from '../../utils/api-response.js';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  findOrCreateGoogleUser,
  handleAppleCallback,
} from './oauth.service.js';
import { setAuthCookies } from './auth.controller.js';
import { AppError } from '../../utils/errors.js';

function getClientInfo(req: Request) {
  return {
    userAgent: req.get('user-agent'),
    ip: req.ip,
  };
}

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const state = crypto.randomBytes(32).toString('hex');
  const url = await getGoogleAuthUrl(state);
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/api/v1/auth/google/callback',
  });
  res.json(successResponse({ url }));
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const storedState = req.cookies?.oauth_state;

  if (!code || typeof code !== 'string') {
    throw AppError.badRequest('Authorization code required');
  }

  if (!state || typeof state !== 'string' || state !== storedState) {
    throw AppError.badRequest('Invalid OAuth state');
  }

  res.clearCookie('oauth_state', { path: '/api/v1/auth/google/callback' });

  const { userAgent, ip } = getClientInfo(req);
  const result = await findOrCreateGoogleUser(await handleGoogleCallback(code), userAgent, ip);

  if (result.mfaRequired) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/mfa?sessionId=${result.sessionId}`);
    return;
  }

  setAuthCookies(res, result.accessToken, result.refreshToken, false);

  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?success=true`);
});

export const appleAuth = asyncHandler(async (req: Request, res: Response) => {
  const state = crypto.randomBytes(32).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/api/v1/auth/apple/callback',
  });
  res.json(successResponse({ url: '' }));
});

export const appleCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const storedState = req.cookies?.oauth_state;

  if (!code || typeof code !== 'string') {
    throw AppError.badRequest('Authorization code required');
  }

  if (!state || typeof state !== 'string' || state !== storedState) {
    throw AppError.badRequest('Invalid OAuth state');
  }

  res.clearCookie('oauth_state', { path: '/api/v1/auth/apple/callback' });

  const { userAgent, ip } = getClientInfo(req);
  const result = await handleAppleCallback(code, userAgent, ip);

  if (result.mfaRequired) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/mfa?sessionId=${result.sessionId}`);
    return;
  }

  setAuthCookies(res, result.accessToken, result.refreshToken, false);

  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?success=true`);
});
