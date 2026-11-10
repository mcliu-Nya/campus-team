import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** 与前端 src/types/api.ts 的 ApiErrorCode 保持一致 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_REQUIRED'
  | 'AUTH_MISMATCH'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'ALREADY_JOINED'
  | 'RECRUITMENT_FULL'
  | 'INVALID_STATUS'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errors = {
  validation: (message: string) => new ApiError(422, 'VALIDATION_ERROR', message),
  authRequired: (message = '请先登录后再操作') => new ApiError(401, 'AUTH_REQUIRED', message),
  authMismatch: (message: string) => new ApiError(401, 'AUTH_MISMATCH', message),
  forbidden: (message = '没有操作权限') => new ApiError(403, 'FORBIDDEN', message),
  notFound: (message = '资源不存在') => new ApiError(404, 'NOT_FOUND', message),
  alreadyJoined: (message = '你已加入该队伍，请勿重复加入') =>
    new ApiError(409, 'ALREADY_JOINED', message),
  full: (message = '名额已满，无法加入') => new ApiError(409, 'RECRUITMENT_FULL', message),
  invalidStatus: (message: string) => new ApiError(409, 'INVALID_STATUS', message),
};

export function ok<T>(res: Response, data: T, message = '', status = 200): void {
  res.status(status).json({ success: true, data, message });
}

export function fail(res: Response, error: ApiError): void {
  res.status(error.status).json({ success: false, code: error.code, message: error.message });
}

/** 包装 async 路由，把 rejection 交给统一错误中间件（Express 4 不会自动捕获）。 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

/** requireAuth 之后读取当前用户 id */
export function currentUserId(res: Response): string {
  const userId = res.locals.userId as string | undefined;
  if (!userId) throw errors.authRequired();
  return userId;
}

export function optionalUserId(res: Response): string | undefined {
  return res.locals.userId as string | undefined;
}
