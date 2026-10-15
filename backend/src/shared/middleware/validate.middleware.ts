import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../../utils/errors.js';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const formattedErrors: Record<string, string[]> = {};

      for (const [field, messages] of Object.entries(errors)) {
        if (messages) {
          formattedErrors[field] = messages;
        }
      }

      throw AppError.badRequest('Validation failed', formattedErrors);
    }

    req.body = result.data.body || req.body;
    req.query = result.data.query || req.query;
    req.params = result.data.params || req.params;

    next();
  };
}
