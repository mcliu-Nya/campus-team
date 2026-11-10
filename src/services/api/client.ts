import type { ApiErrorCode, ApiEnvelope } from '@/types/api';
import { AppError } from '@/lib/errors';
import { API_BASE_URL, API_TIMEOUT } from '../config';

/**
 * 统一 HTTP 客户端：
 * - 自动注入 Bearer token（登录后由 AuthProvider 调用 setAuthToken）；
 * - 统一解析 { success, data, message } / { success, code, message }；
 * - 超时与网络异常统一抛 AppError，页面只处理 message。
 */

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export type QueryValue = string | number | boolean | null | undefined | string[];

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  auth?: boolean;
  /** 额外请求头，可覆盖默认 Authorization */
  headers?: Record<string, string>;
}

export function buildQueryString(query?: Record<string, QueryValue>): string {
  if (!query) return '';
  const params: string[] = [];
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value.join(','))}`);
      return;
    }
    params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  });
  return params.length > 0 ? `?${params.join('&')}` : '';
}

function mapHttpStatusToCode(status: number): ApiErrorCode {
  if (status === 401) return 'AUTH_REQUIRED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'INVALID_STATUS';
  if (status === 422 || status === 400) return 'VALIDATION_ERROR';
  return 'UNKNOWN_ERROR';
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true, headers: extraHeaders } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;
  if (extraHeaders) Object.assign(headers, extraHeaders);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}${buildQueryString(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new AppError(
      'NETWORK_ERROR',
      aborted ? '请求超时，请检查网络后重试' : '网络异常，无法连接服务器',
    );
  } finally {
    clearTimeout(timer);
  }

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload && payload.success === false ? payload.message : `请求失败（${response.status}）`;
    const code = payload && payload.success === false ? payload.code : mapHttpStatusToCode(response.status);
    throw new AppError(code ?? mapHttpStatusToCode(response.status), message);
  }

  if (!payload) {
    throw new AppError('UNKNOWN_ERROR', '服务器返回了无法解析的数据');
  }

  if (payload.success === false) {
    throw new AppError(payload.code, payload.message);
  }

  return payload.data;
}
