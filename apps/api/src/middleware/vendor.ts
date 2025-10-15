import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../prisma';

export async function ensureApprovedVendor(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user as { sub: string; role: 'BUYER' | 'VENDOR' | 'ADMIN' } | undefined;
    if (!user) {
      return res.status(401).json({ error: 'unauthenticated', code: 'UNAUTHENTICATED' });
    }
    if (user.role === 'ADMIN') {
      return next();
    }
    if (user.role !== 'VENDOR') {
      return res.status(403).json({ error: 'not_vendor' });
    }

    const approved = await prisma.vendorApplication.findFirst({
      where: { userId: user.sub, status: 'APPROVED' },
      orderBy: { submittedAt: 'desc' },
      select: { id: true, status: true, reviewedAt: true },
    });

    if (!approved) {
      return res.status(403).json({ error: 'vendor_not_approved' });
    }

    (req as any).vendorApplication = approved;
    return next();
  } catch (error) {
    console.error('[middleware] ensureApprovedVendor error', error);
    return res.status(500).json({ error: 'vendor_access_check_failed' });
  }
}
