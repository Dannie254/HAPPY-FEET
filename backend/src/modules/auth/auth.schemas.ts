import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
      .optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    revokeAllSessions: z.boolean().optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
      .optional(),
  }),
});

export const enableMfaSchema = z.object({
  body: z.object({
    code: z.string().length(6, 'MFA code must be 6 digits'),
  }),
});

export const disableMfaSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Password is required'),
  }),
});

export const mfaLoginSchema = z.object({
  body: z.object({
    code: z.string().length(6, 'MFA code must be 6 digits'),
    sessionId: z.string().min(1, 'Session ID is required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type LogoutInput = z.infer<typeof logoutSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['body'];
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type EnableMfaInput = z.infer<typeof enableMfaSchema>['body'];
export type DisableMfaInput = z.infer<typeof disableMfaSchema>['body'];
export type MfaLoginInput = z.infer<typeof mfaLoginSchema>['body'];
