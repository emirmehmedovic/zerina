import type { Response } from 'express';

type Details = unknown;

export function badRequest(res: Response, details?: Details) {
  return res.status(400).json({ error: 'invalid_body', code: 'INVALID_BODY', details });
}

export function unauthorized(res: Response) {
  return res.status(401).json({ error: 'unauthenticated', code: 'UNAUTHENTICATED' });
}

export function forbidden(res: Response) {
  return res.status(403).json({ error: 'forbidden', code: 'FORBIDDEN' });
}

export function notFound(res: Response, message = 'not_found') {
  return res.status(404).json({ error: message, code: 'NOT_FOUND' });
}

export function conflict(res: Response, message = 'conflict', code = 'CONFLICT') {
  return res.status(409).json({ error: message, code });
}

export function locked(res: Response, retryAfterSeconds?: number) {
  return res.status(429).json({ error: 'account_locked', code: 'ACCOUNT_LOCKED', retryAfterSeconds });
}

export function serverError(res: Response, message = 'server_error') {
  return res.status(500).json({ error: message });
}
