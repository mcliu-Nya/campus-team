import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { ApiError, fail } from '../lib/http.js';

export function notFoundHandler(_req: Request, res: Response): void {
  fail(res, new ApiError(404, 'NOT_FOUND', '接口不存在'));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApiError) {
    fail(res, error);
    return;
  }

  if (error instanceof ZodError) {
    fail(res, new ApiError(422, 'VALIDATION_ERROR', error.issues[0]?.message ?? '参数校验失败'));
    return;
  }

  console.error('[api] unhandled error', error);
  fail(res, new ApiError(500, 'UNKNOWN_ERROR', '服务器内部错误，请稍后再试'));
}
