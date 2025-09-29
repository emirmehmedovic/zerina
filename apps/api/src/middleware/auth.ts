import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../env';

export type JwtPayload = {
  sub: string; // user id
  role: 'BUYER' | 'VENDOR' | 'ADMIN';
};

export const COOKIE_NAME = ENV.cookieName;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[COOKIE_NAME] as string | undefined;
    if (!token) return res.status(401).json({ error: 'unauthenticated', code: 'UNAUTHENTICATED' });
    const payload = jwt.verify(token, ENV.sessionSecret) as JwtPayload;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'unauthenticated', code: 'UNAUTHENTICATED' });
  }
}

export function withAuth(optional = false) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = req.cookies[COOKIE_NAME] as string | undefined;
      if (!token) {
        if (optional) return next();
        return next(new Error('unauthenticated'));
      }
      const payload = jwt.verify(token, ENV.sessionSecret) as JwtPayload;
      (req as any).user = payload;
      next();
    } catch (e) {
      if (optional) return next();
      next(e);
    }
  };
}

export function requireRole(...roles: Array<JwtPayload['role']>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user) return res.status(401).json({ error: 'unauthenticated', code: 'UNAUTHENTICATED' });
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'forbidden', code: 'FORBIDDEN' });
    next();
  };
}
