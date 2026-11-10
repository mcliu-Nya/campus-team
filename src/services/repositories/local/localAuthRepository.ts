import type { AuthSession, LoginRequest } from '@/types/api';
import type { User } from '@/types/models';

import { nowIso } from '@/lib/date';
import { AppError } from '@/lib/errors';
import { createUserId } from '@/lib/id';
import { validateLoginForm } from '@/lib/validate';
import type { AuthRepository } from '../types';
import { withDb } from './localDb';

const TOKEN_PREFIX = 'local:';

/**
 * 本地登录/注册：
 * - 学号不存在 -> 直接注册；
 * - 学号已存在 -> 校验姓名与学院，一致即登录；
 * - token 使用 local:<userId> 形式，仅用于本地会话恢复。
 */
export const localAuthRepository: AuthRepository = {
  async login(input: LoginRequest): Promise<AuthSession> {
    const values = {
      realName: input.realName.trim(),
      studentId: input.studentId.trim(),
      college: input.college.trim(),
    };

    const errors = validateLoginForm(values);
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) throw new AppError('VALIDATION_ERROR', firstError);

    return withDb(async (db) => {
      const existing = db.users.find((user) => user.studentId === values.studentId);
      if (existing) {
        if (existing.realName !== values.realName || existing.college !== values.college) {
          throw new AppError('AUTH_MISMATCH', '该学号已注册，姓名或二级学院与注册信息不一致');
        }
        return { token: `${TOKEN_PREFIX}${existing.id}`, user: existing };
      }

      const user: User = {
        id: createUserId(),
        realName: values.realName,
        studentId: values.studentId,
        college: values.college,
        createdAt: nowIso(),
      };
      db.users.push(user);
      return { token: `${TOKEN_PREFIX}${user.id}`, user };
    });
  },

  async me(token: string): Promise<User> {
    const userId = token.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : token;
    const user = await withDb<User | null>(
      (db) => db.users.find((item) => item.id === userId) ?? null,
      { readOnly: true },
    );
    if (!user) throw new AppError('AUTH_REQUIRED', '登录状态已失效，请重新登录');
    return user;
  },
};
