import type { User } from '@prisma/client';
import { z } from 'zod';

import { errors } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { signToken } from '../../middleware/auth.js';
import type { UserDto } from '../../types/dto.js';

export const loginSchema = z.object({
  realName: z.string().trim().min(2, '请填写真实姓名').max(20, '姓名过长'),
  studentId: z
    .string()
    .trim()
    .min(4, '学号至少 4 位')
    .max(20, '学号过长')
    .regex(/^[0-9A-Za-z]+$/, '学号只能包含字母和数字'),
  college: z.string().trim().min(2, '请选择二级学院').max(40, '学院名称过长'),
});

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    realName: user.realName,
    studentId: user.studentId,
    college: user.college,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function login(input: unknown): Promise<{ token: string; user: UserDto }> {
  const data = loginSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { studentId: data.studentId } });
  if (existing) {
    if (existing.realName !== data.realName || existing.college !== data.college) {
      throw errors.authMismatch('该学号已注册，姓名或二级学院与注册信息不一致');
    }
    return { token: signToken(existing.id), user: toUserDto(existing) };
  }

  try {
    const created = await prisma.user.create({ data });
    return { token: signToken(created.id), user: toUserDto(created) };
  } catch (cause) {
    // 并发注册同学号：唯一索引冲突后退回登录校验
    if (typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === 'P2002') {
      const retried = await prisma.user.findUnique({ where: { studentId: data.studentId } });
      if (retried && retried.realName === data.realName && retried.college === data.college) {
        return { token: signToken(retried.id), user: toUserDto(retried) };
      }
      throw errors.authMismatch('该学号已注册，姓名或二级学院与注册信息不一致');
    }
    throw cause;
  }
}

export async function me(userId: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw errors.authRequired('登录状态已失效，请重新登录');
  return toUserDto(user);
}
