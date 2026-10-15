import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../modules/auth/jwt.utils.js';
import { AppError } from '../../utils/errors.js';
import type { UserRole } from '../../shared/types.js';
import { logger } from '../../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: UserRole;
    sessionId: string;
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    throw AppError.unauthorized('Authentication required');
  }

  const payload = verifyAccessToken(accessToken);
  if (!payload) {
    throw AppError.unauthorized('Invalid or expired access token');
  }

  (req as AuthenticatedRequest).user = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
  };

  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      logger.warn(
        { userId: authReq.user.sub, role: authReq.user.role, requiredRoles: allowedRoles },
        'Access denied: insufficient role'
      );
      throw AppError.forbidden('Insufficient permissions');
    }

    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    next();
    return;
  }

  const payload = verifyAccessToken(accessToken);
  if (payload) {
    (req as AuthenticatedRequest).user = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }

  next();
}
