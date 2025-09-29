import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';
import { badRequest } from './errors';

export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) return badRequest(res, parsed.error.flatten());
    (req as any).validated = parsed.data as any;
    next();
  };
}
