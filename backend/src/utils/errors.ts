export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Unauthorized', details?: unknown) {
    return new AppError(message, 401, 'UNAUTHORIZED', details);
  }

  static forbidden(message = 'Forbidden', details?: unknown) {
    return new AppError(message, 403, 'FORBIDDEN', details);
  }

  static notFound(message = 'Resource not found', details?: unknown) {
    return new AppError(message, 404, 'NOT_FOUND', details);
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static tooManyRequests(message = 'Too many requests', details?: unknown) {
    return new AppError(message, 429, 'TOO_MANY_REQUESTS', details);
  }

  static internal(message = 'Internal server error', details?: unknown) {
    return new AppError(message, 500, 'INTERNAL_ERROR', details, false);
  }

  static serviceUnavailable(message = 'Service unavailable', details?: unknown) {
    return new AppError(message, 503, 'SERVICE_UNAVAILABLE', details, false);
  }
}

export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>;

  constructor(fields: Record<string, string[]>) {
    super('Validation failed', 400, 'VALIDATION_ERROR', fields);
    this.fields = fields;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}
