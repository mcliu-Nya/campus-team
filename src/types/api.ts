/**
 * API 契约类型：请求体 / 响应包 / 错误码。
 * 与 docs/api.md 中的定义保持一致。
 */

import type {
  ActivityType,
  AppNotification,
  ContactType,
  ISODateString,
  MemberView,
  Paginated,
  RecruitmentDetail,
  RecruitmentQuery,
  RecruitmentSummary,
  TeamEntry,
  User,
} from './models';

/** 统一成功响应 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
}

/** 统一错误响应 */
export interface ApiFailure {
  success: false;
  code: ApiErrorCode;
  message: string;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

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

/** POST /api/auth/login */
export interface LoginRequest {
  realName: string;
  studentId: string;
  college: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

/** POST /api/recruitments 与 PATCH /api/recruitments/:id */
export interface RecruitmentWriteRequest {
  title: string;
  college: string;
  activityType: ActivityType;
  neededCount: number;
  requirements: string;
  contactType: ContactType;
  contact: string;
  activityUrl: string;
  extra: string;
  deadline: ISODateString | null;
}

/** POST /api/recruitments/:id/join */
export interface JoinRequest {
  contactType: ContactType;
  contact: string;
}

/** POST /api/recruitments/:id/remove */
export interface RemoveMemberRequest {
  joinId: string;
}

/** POST /api/recruitments/:id/reopen */
export interface ReopenRequest {
  neededCount?: number;
}

/** GET /api/recruitments 的查询参数（扁平化，便于拼 query string） */
export interface RecruitmentListQuery extends Omit<RecruitmentQuery, 'colleges' | 'types'> {
  college?: string;
  type?: ActivityType;
}

export type {
  AppNotification,
  MemberView,
  Paginated,
  RecruitmentDetail,
  RecruitmentSummary,
  TeamEntry,
  User,
};
