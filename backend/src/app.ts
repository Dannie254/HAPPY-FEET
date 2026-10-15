import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { AppError, isAppError } from './utils/errors.js';
import { errorResponse } from './utils/api-response.js';
import authRoutes from './modules/auth/auth.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import productRoutes from './modules/products/product.routes.js';
import searchRoutes from './modules/search/search.routes.js';

const app = express();

app.set('trust proxy', 1);

const cspNonceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;
  // Set CSP header manually with nonce
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    ...(env.CSP_REPORT_URI ? [`report-uri ${env.CSP_REPORT_URI}`] : []),
  ].join('; '));
  next();
};

app.use(cspNonceMiddleware);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400,
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

const authBodyLimit = express.json({ limit: '100kb' });
const authUrlencodedLimit = express.urlencoded({ extended: true, limit: '100kb' });

function getClientIdentifier(req: Request): string {
  const ip = req.ip || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';
  return `${ip}:${userAgent}`;
}

const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: errorResponse('TOO_MANY_REQUESTS', 'Too many requests, please try again later'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
  handler: (req, _res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    _res
      .status(429)
      .json(errorResponse('TOO_MANY_REQUESTS', 'Too many requests, please try again later'));
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.RATE_LIMIT_AUTH_MAX,
  message: errorResponse(
    'TOO_MANY_REQUESTS',
    'Too many authentication attempts, please try again later'
  ),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: errorResponse('TOO_MANY_REQUESTS', 'Too many search requests, please try again later'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
});

app.use('/api/', generalLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/v1/auth/reset-password', authLimiter);
app.use('/api/v1/search', searchLimiter);

app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        path: req.path,
        statusCode: _res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
      'HTTP Request'
    );
  });
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get(`${env.API_PREFIX}/health`, (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(`${env.API_PREFIX}/auth`, authBodyLimit, authUrlencodedLimit, authRoutes);
app.use(`${env.API_PREFIX}/categories`, categoryRoutes);
app.use(`${env.API_PREFIX}/products`, productRoutes);
app.use(`${env.API_PREFIX}/search`, searchRoutes);

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND'));
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (isAppError(err)) {
    logger.warn(
      {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        path: _req.path,
        method: _req.method,
      },
      'Application error'
    );

    res.status(err.statusCode).json(errorResponse(err.code, err.message, err.details));
    return;
  }

  logger.error(
    {
      error: err.message,
      stack: err.stack,
      path: _req.path,
      method: _req.method,
    },
    'Unexpected error'
  );

  if (env.NODE_ENV === 'production') {
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'An unexpected error occurred'));
  } else {
    res.status(500).json(errorResponse('INTERNAL_ERROR', err.message, { stack: err.stack }));
  }
});

let server: ReturnType<typeof app.listen> | null = null;

export async function startServer(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  server = app.listen(env.PORT, () => {
    logger.info(
      { environment: env.NODE_ENV, apiPrefix: env.API_PREFIX },
      `Server started on port ${env.PORT}`
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');

    if (server) {
      server.close(async () => {
        await disconnectDatabase();
        await disconnectRedis();
        logger.info('Server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.error({ error: err.message, stack: err.stack }, 'Uncaught exception');
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
  });
}

export { app };
