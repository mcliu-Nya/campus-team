import { Router } from 'express';

import { errors, asyncHandler, currentUserId, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { list, markAllRead, markRead } from './notification.service.js';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    ok(res, await list(currentUserId(res)));
  }),
);

notificationRouter.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    // noUncheckedIndexedAccess 下 req.params.id 可能是 undefined，这里显式兜底。
    const id = req.params.id;
    if (!id) throw errors.notFound('通知不存在');
    ok(res, await markRead(id, currentUserId(res)), '已标记为已读');
  }),
);

// 前端「全部已读」当前通过逐个 PATCH 实现，这个批量接口留给后续优化使用。
notificationRouter.post(
  '/read-all',
  asyncHandler(async (_req, res) => {
    ok(res, await markAllRead(currentUserId(res)), '已全部标记为已读');
  }),
);
