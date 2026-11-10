import { Router } from 'express';

import { asyncHandler, currentUserId, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { myEnded, myRecruitments, myTeams } from '../recruitments/recruitment.service.js';

export const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get(
  '/teams',
  asyncHandler(async (_req, res) => {
    ok(res, await myTeams(currentUserId(res)));
  }),
);

meRouter.get(
  '/recruitments',
  asyncHandler(async (_req, res) => {
    ok(res, await myRecruitments(currentUserId(res)));
  }),
);

meRouter.get(
  '/ended',
  asyncHandler(async (_req, res) => {
    ok(res, await myEnded(currentUserId(res)));
  }),
);
