import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ENV } from '../env';

const CSRF_COOKIE = 'csrf_token';

export function issueCsrfToken(req: Request, res: Response) {
  // Reuse if present
  let token = req.cookies[CSRF_COOKIE] as string | undefined;
  if (!token) {
    token = crypto.randomBytes(24).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // must be readable by browser JS to compare header if needed
      secure: ENV.cookieSecure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
  return token;
}

export function csrfProtect(exclusions: Array<{ method?: string; pathStartsWith: string }> = []) {
  const isSafeMethod = (m?: string) => !m || ['GET', 'HEAD', 'OPTIONS'].includes(m);
  return (req: Request, res: Response, next: NextFunction) => {
    if (isSafeMethod(req.method)) return next();
    const path = req.path || '';
    // Exclusions (e.g., auth/login, auth/register, auth/logout, dev endpoints)
    for (const ex of exclusions) {
      const methodOk = !ex.method || ex.method === req.method;
      if (methodOk && path.startsWith(ex.pathStartsWith)) return next();
    }

    const cookieToken = req.cookies[CSRF_COOKIE] as string | undefined;
    const headerToken = (req.get('X-CSRF-Token') || req.get('x-csrf-token') || '').trim();
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return res.status(403).json({ error: 'csrf_forbidden' });
    }
    next();
  };
}
