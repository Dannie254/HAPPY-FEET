import type { Request, Response, NextFunction } from 'express';

export type AsyncHandler<TReq extends Request = Request> = (
  req: TReq,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function asyncHandler<TReq extends Request = Request>(fn: AsyncHandler<TReq>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as TReq, res, next)).catch(next);
  };
}
