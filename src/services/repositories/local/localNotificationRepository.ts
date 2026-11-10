import type { AppNotification, User } from '@/types/models';
import { AppError } from '@/lib/errors';
import type { NotificationRepository } from '../types';
import { withDb } from './localDb';

export const localNotificationRepository: NotificationRepository = {
  async list(viewer: User): Promise<AppNotification[]> {
    return withDb(
      (db) =>
        db.notifications
          .filter((item) => item.recipientUserId === viewer.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      { readOnly: true },
    );
  },

  async markRead(id: string, viewer: User): Promise<AppNotification> {
    return withDb((db) => {
      const notification = db.notifications.find(
        (item) => item.id === id && item.recipientUserId === viewer.id,
      );
      if (!notification) throw new AppError('NOT_FOUND', '通知不存在');
      notification.read = true;
      return notification;
    });
  },

  async unreadCount(viewer: User): Promise<number> {
    return withDb(
      (db) =>
        db.notifications.filter((item) => item.recipientUserId === viewer.id && !item.read)
          .length,
      { readOnly: true },
    );
  },
};
