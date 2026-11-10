import type { ApiErrorCode } from '@/types/api';

/** 业务异常：所有仓储实现都抛出该异常，页面只关心 message 与 code。 */
export class AppError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return '操作失败，请稍后重试';
}

export function isAuthError(error: unknown): boolean {
  return error instanceof AppError && (error.code === 'AUTH_REQUIRED' || error.code === 'AUTH_MISMATCH');
}

export const AUTH_REQUIRED_MESSAGE = '请先登录后再操作';
