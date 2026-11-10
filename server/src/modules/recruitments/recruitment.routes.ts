import { Router } from 'express';

import { asyncHandler, currentUserId, errors, ok, optionalUserId } from '../../lib/http.js';
import { optionalAuth as optionalTokenAuth, requireAuth } from '../../middleware/auth.js';
import {
  cancel,
  create,
  getDetail,
  join,
  leave,
  list,
  remove,
  removeMember,
  reopen,
  update,
} from './recruitment.service.js';

export const recruitmentRouter = Router();

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0].trim();
  return undefined;
}

/** 多值筛选：既支持 ?college=a,b，也支持 ?college=a&college=b */
function asList(value: unknown): string[] | undefined {
  const raw = Array.isArray(value) ? value : [value];
  const flat = raw
    .filter((item): item is string => typeof item === 'string')
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return flat.length > 0 ? flat : undefined;
}

function asNumber(value: unknown): number | undefined {
  const text = asString(value);
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** noUncheckedIndexedAccess 下 req.params.id 可能是 undefined，统一在这里兜底。 */
function paramId(req: { params: Record<string, string | undefined> }): string {
  const id = req.params.id;
  if (!id) throw errors.notFound('招募不存在或已被删除');
  return id;
}

recruitmentRouter.get(
  '/',
  optionalTokenAuth,
  asyncHandler(async (req, res) => {
    const spotRaw = asString(req.query.spot);
    const withinRaw = asString(req.query.publishedWithin);
    ok(
      res,
      await list({
        keyword: asString(req.query.keyword),
        // 契约参数是单数 college / type；同时兼容复数写法，老版本客户端无需升级即可生效
        college: asList(req.query.college ?? req.query.colleges),
        type: asList(req.query.type ?? req.query.types),
        spot:
          spotRaw === 'available' || spotRaw === 'scarce' || spotRaw === 'any' ? spotRaw : undefined,
        publishedWithin:
          withinRaw === '1d' || withinRaw === '3d' || withinRaw === '7d' || withinRaw === 'all'
            ? withinRaw
            : undefined,
        page: asNumber(req.query.page),
        pageSize: asNumber(req.query.pageSize),
      }),
    );
  }),
);

recruitmentRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    ok(res, await create(req.body, currentUserId(res)), '招募发布成功', 201);
  }),
);

recruitmentRouter.get(
  '/:id',
  optionalTokenAuth,
  asyncHandler(async (req, res) => {
    ok(res, await getDetail(paramId(req), optionalUserId(res)));
  }),
);

recruitmentRouter.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    ok(res, await update(paramId(req), req.body, currentUserId(res)), '招募已更新');
  }),
);

recruitmentRouter.post(
  '/:id/join',
  requireAuth,
  asyncHandler(async (req, res) => {
    ok(res, await join(paramId(req), req.body, currentUserId(res)), '已加入队伍');
  }),
);

recruitmentRouter.post(
  '/:id/leave',
  requireAuth,
  asyncHandler(async (req, res) => {
    ok(res, await leave(paramId(req), currentUserId(res)), '已退出队伍');
  }),
);

recruitmentRouter.post(
  '/:id/remove',
  requireAuth,
  asyncHandler(async (req, res) => {
    const joinId = req.body?.joinId;
    if (typeof joinId !== 'string' || joinId.length === 0) {
      throw errors.validation('缺少 joinId');
    }
    ok(res, await removeMember(paramId(req), joinId, currentUserId(res)), '已移除成员');
  }),
);

recruitmentRouter.post(
  '/:id/cancel',
  requireAuth,
  asyncHandler(async (req, res) => {
    ok(res, await cancel(paramId(req), currentUserId(res)), '招募已取消');
  }),
);

recruitmentRouter.post(
  '/:id/reopen',
  requireAuth,
  asyncHandler(async (req, res) => {
    ok(res, await reopen(paramId(req), currentUserId(res), req.body?.neededCount), '已重新发布');
  }),
);

/** 物理删除：仅限已满员 / 已结束 / 已取消的招募，记录与关联数据一并移除。 */
recruitmentRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = paramId(req);
    await remove(id, currentUserId(res));
    ok(res, { id }, '招募已删除');
  }),
);
