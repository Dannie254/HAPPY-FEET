import { Router } from 'express';
import {
  register,
  login,
  logout,
  refresh,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateMe,
  getSessions,
  revokeSession,
  revokeAll,
  enableMfa,
  disableMfa,
  verifyMfa,
  getMfaSetup,
} from './auth.controller.js';
import { googleAuth, googleCallback, appleAuth, appleCallback } from './oauth.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  enableMfaSchema,
  disableMfaSchema,
  mfaLoginSchema,
} from './auth.schemas.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', validate(logoutSchema), logout);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), resendVerification);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/apple', appleAuth);
router.get('/apple/callback', appleCallback);

router.use(requireAuth);

router.post('/change-password', validate(changePasswordSchema), changePassword);
router.get('/me', getMe);
router.patch('/me', validate(updateProfileSchema), updateMe);
router.get('/sessions', getSessions);
router.delete('/sessions/:sessionId', revokeSession);
router.delete('/sessions', revokeAll);

router.get('/mfa/setup', getMfaSetup);
router.post('/mfa/enable', validate(enableMfaSchema), enableMfa);
router.post('/mfa/disable', validate(disableMfaSchema), disableMfa);
router.post('/mfa/verify', validate(mfaLoginSchema), verifyMfa);

export default router;
