import { Router } from 'express';

import { asyncHandler, currentUserId, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { login, me } from './auth.service.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    ok(res, await login(req.body));
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (_req, res) => {
    ok(res, await me(currentUserId(res)));
  }),
);
