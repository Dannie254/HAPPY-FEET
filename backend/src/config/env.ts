import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('/api/v1'),

  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),

  MONGODB_URI: z.string().url(),
  MONGODB_DB_NAME: z.string(),

  REDIS_URL: z.string().url(),
  REDIS_TTL_DEFAULT: z.coerce.number().default(300),
  REDIS_TTL_PRODUCTS: z.coerce.number().default(600),
  REDIS_TTL_CATEGORIES: z.coerce.number().default(3600),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  ARGON2_MEMORY_COST: z.coerce.number().default(65536),
  ARGON2_TIME_COST: z.coerce.number().default(3),
  ARGON2_PARALLELISM: z.coerce.number().default(1),

  EMAIL_VERIFICATION_EXPIRY: z.string().default('24h'),
  PASSWORD_RESET_EXPIRY: z.string().default('1h'),
  SESSION_ROTATION_ENABLED: z.coerce.boolean().default(true),
  SESSION_MAX_AGE: z.coerce.number().default(86400000),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),
  APPLE_CALLBACK_URL: z.string().url().optional(),

  MPESA_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  MPESA_CONSUMER_KEY: z.string().optional(),
  MPESA_CONSUMER_SECRET: z.string().optional(),
  MPESA_SHORTCODE: z.string().optional(),
  MPESA_PASSKEY: z.string().optional(),
  MPESA_CALLBACK_URL: z.string().url().optional(),
  MPESA_TIMEOUT_URL: z.string().url().optional(),
  MPESA_RESULT_URL: z.string().url().optional(),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.coerce.boolean().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().optional(),

  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_WEBHOOK_URL: z.string().url().optional(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(5),

  CORS_ORIGIN: z.string(),

  CSP_REPORT_URI: z.string().optional(),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.coerce.boolean().default(false),

  FEATURE_AI_ASSISTANT: z.coerce.boolean().default(false),
  FEATURE_3D_VIEWER: z.coerce.boolean().default(false),
  FEATURE_WHATSAPP_INTEGRATION: z.coerce.boolean().default(false),
});

export const env = envSchema.parse(process.env);

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
