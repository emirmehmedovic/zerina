import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';

export type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyPrefix: string;
  keyGenerator?: (req: any) => string;
};

export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  const limiter = rateLimit({
    windowMs: options.windowMs,
    limit: options.maxRequests,
    legacyHeaders: false,
    standardHeaders: true,
    message: options.message ?? 'Too many requests, please try again later.',
    keyGenerator: options.keyGenerator
      ? (req) => options.keyGenerator!(req)
      : (req) => `${options.keyPrefix}:${req.ip}:${(req as any).user?.sub ?? 'anon'}`,
  });

  return limiter;
}
