import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env.js';
import { errors } from '../lib/http.js';

interface TokenPayload {
  sub: string;
}

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function verify(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    if (!payload.sub) throw new Error('missing sub');
    return payload.sub;
  } catch {
    throw errors.authRequired('登录状态已失效，请重新登录');
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = readToken(req);
  if (!token) {
    next(errors.authRequired());
    return;
  }
  try {
    res.locals.userId = verify(token);
    next();
  } catch (cause) {
    next(cause);
  }
}

/** 可选鉴权：带合法 token 时注入 userId，无 token 或 token 失效都按游客处理。 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = readToken(req);
  if (token) {
    try {
      res.locals.userId = verify(token);
    } catch {
      res.locals.userId = undefined;
    }
  }
  next();
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}
