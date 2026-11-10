import type { AppNotification, User } from '@/types/models';
import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type { NotificationRepository } from '../types';

export const remoteNotificationRepository: NotificationRepository = {
  list(viewer: User): Promise<AppNotification[]> {
    void viewer;
    return apiRequest<AppNotification[]>(endpoints.notifications);
  },

  markRead(id: string, viewer: User): Promise<AppNotification> {
    void viewer;
    return apiRequest<AppNotification>(endpoints.notificationRead(id), { method: 'PATCH' });
  },

  async unreadCount(viewer: User): Promise<number> {
    void viewer;
    const list = await apiRequest<AppNotification[]>(endpoints.notifications);
    return list.filter((item) => !item.read).length;
  },
};
