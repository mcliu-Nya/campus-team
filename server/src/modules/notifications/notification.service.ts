import type { Notification as NotificationRow } from '@prisma/client';

import { errors } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import type { NotificationDto } from '../../types/dto.js';

function toDto(row: NotificationRow): NotificationDto {
  return {
    id: row.id,
    recipientUserId: row.recipientUserId,
    recruitmentId: row.recruitmentId,
    recruitmentTitle: row.recruitmentTitle,
    joinerUserId: row.joinerUserId,
    joinerName: row.joinerName,
    joinerStudentId: row.joinerStudentId,
    joinerCollege: row.joinerCollege,
    joinerContact: row.joinerContact,
    joinerContactType: row.joinerContactType,
    content: row.content,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function list(userId: string): Promise<NotificationDto[]> {
  const rows = await prisma.notification.findMany({
    where: { recipientUserId: userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toDto);
}

export async function markRead(id: string, userId: string): Promise<NotificationDto> {
  const row = await prisma.notification.findUnique({ where: { id } });
  if (!row) throw errors.notFound('通知不存在');
  if (row.recipientUserId !== userId) throw errors.forbidden('没有操作权限');
  if (row.read) return toDto(row);

  const updated = await prisma.notification.update({ where: { id }, data: { read: true } });
  return toDto(updated);
}

export async function markAllRead(userId: string): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: { recipientUserId: userId, read: false },
    data: { read: true },
  });
  return { count: result.count };
}
