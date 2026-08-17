import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../prisma';
import { VendorApplicationStatus } from '@prisma/client';
import {
  renderVendorApplicationApprovedEmail,
  renderVendorApplicationRejectedEmail,
} from '../emails/templates';
import { enqueueEmail } from '../lib/email';
import { ENV } from '../env';
import { notifyShopApproved } from '../lib/notifications';

const router = Router();

const promoteSchema = z.object({
  email: z.string().email(),
});

// POST /api/v1/admin/promote - Promote a user to admin role (admin only)
router.post('/promote', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = promoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const { email } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, role: true },
    });

    return res.json({
      message: `User ${updatedUser.email} promoted to ${updatedUser.role}`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error promoting user:', error);
    return res.status(500).json({ error: 'server_error' });
  }
});

const vendorApplicationsQuerySchema = z.object({
  status: z.nativeEnum(VendorApplicationStatus).optional(),
  q: z.string().optional(),
  take: z.string().transform((v) => Number(v || '20')).optional(),
  skip: z.string().transform((v) => Number(v || '0')).optional(),
});

router.get('/vendor-applications', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = vendorApplicationsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_query', details: parsed.error.flatten() });
  }

  const { status, q, take = 20, skip = 0 } = parsed.data;
  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { legalName: { contains: q, mode: 'insensitive' } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.vendorApplication.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      take: Math.max(1, Math.min(100, Number(take) || 20)),
      skip: Math.max(0, Number(skip) || 0),
      select: {
        id: true,
        userId: true,
        status: true,
        legalName: true,
        country: true,
        submittedAt: true,
        reviewedAt: true,
        reviewedById: true,
        notes: true,
        rejectionReason: true,
        identityVerificationStatus: true,
        identityVerificationProvider: true,
        identityVerificationCheckedAt: true,
        identityVerificationNotes: true,
        identityVerificationId: true,
        securityDepositRequired: true,
        securityDepositStatus: true,
        securityDepositAmountCents: true,
        securityDepositCurrency: true,
        securityDepositPaidAt: true,
        user: { select: { email: true, name: true, role: true } },
        reviewedBy: { select: { id: true, email: true, name: true } },
        vendorDocuments: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            storageKey: true,
            uploadedAt: true,
          },
        },
      } as any,
    }),
    prisma.vendorApplication.count({ where }),
  ]);

  res.json({ items, total });
});

const updateVendorApplicationSchema = z.object({
  status: z.nativeEnum(VendorApplicationStatus),
  notes: z.string().max(5000).optional(),
  rejectionReason: z.string().max(2000).optional(),
});

router.patch('/vendor-applications/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const parsed = updateVendorApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const { status, notes, rejectionReason } = parsed.data;
  const admin = (req as any).user as { sub: string };

  const application = await prisma.vendorApplication.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });
  if (!application) {
    return res.status(404).json({ error: 'not_found' });
  }

  const updateData: any = {
    status,
    reviewedAt: new Date(),
    reviewedById: admin.sub,
    notes,
    rejectionReason: status === 'REJECTED' ? rejectionReason ?? null : null,
  };

  const updated = await prisma.vendorApplication.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      status: true,
      legalName: true,
      reviewedAt: true,
      reviewedById: true,
      notes: true,
      rejectionReason: true,
      identityVerificationStatus: true,
      identityVerificationProvider: true,
      identityVerificationCheckedAt: true,
      identityVerificationNotes: true,
      securityDepositRequired: true,
      securityDepositStatus: true,
      securityDepositAmountCents: true,
      securityDepositCurrency: true,
      securityDepositPaidAt: true,
      vendorDocuments: {
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          storageKey: true,
          uploadedAt: true,
        },
      },
    } as any,
  });

  const applicant = await prisma.user.findUnique({
    where: { id: application.userId },
    select: { email: true, name: true, role: true },
  });

  if (status === 'APPROVED') {
    await prisma.user.update({ where: { id: application.userId }, data: { role: 'VENDOR' } });
    // Also activate the vendor's shop if it exists and is pending
    const activatedShops = await prisma.shop.findMany({
      where: { ownerId: application.userId, status: 'PENDING_APPROVAL' },
      select: { id: true, name: true },
    });
    await prisma.shop.updateMany({
      where: { ownerId: application.userId, status: 'PENDING_APPROVAL' },
      data: { status: 'ACTIVE' },
    });
    // Send notification for shop approval
    for (const shop of activatedShops) {
      notifyShopApproved({
        vendorUserId: application.userId,
        shopName: shop.name,
      }).catch((err) => console.error('[admin] Failed to notify shop approval:', err));
    }
    if (applicant?.email) {
      const email = renderVendorApplicationApprovedEmail({
        applicantName: applicant.name,
        dashboardUrl: `${ENV.frontendUrl}/vendor/dashboard`,
      });
      await enqueueEmail({ to: applicant.email, subject: email.subject, html: email.html, text: email.text });
    }
  }

  if (status === 'REJECTED') {
    await prisma.user.update({ where: { id: application.userId }, data: { role: 'BUYER' } });
    // Suspend the vendor's shop if it exists
    await prisma.shop.updateMany({
      where: { ownerId: application.userId, status: { in: ['PENDING_APPROVAL', 'ACTIVE'] } },
      data: { status: 'SUSPENDED' },
    });
    if (applicant?.email) {
      const email = renderVendorApplicationRejectedEmail({
        applicantName: applicant.name,
        rejectionReason: rejectionReason ?? null,
        resubmissionUrl: `${ENV.frontendUrl}/vendor/apply`,
      });
      await enqueueEmail({ to: applicant.email, subject: email.subject, html: email.html, text: email.text });
    }
  }

  await prisma.adminAuditLog.create({
    data: {
      actorId: admin.sub,
      action: 'VENDOR_APPLICATION_STATUS_CHANGE',
      meta: {
        applicationId: application.id,
        previousStatus: application.status,
        newStatus: status,
        notes: notes ?? null,
        rejectionReason: rejectionReason ?? null,
      },
    },
  });

  res.json({ application: updated });
});

// GET /api/v1/admin/earnings - Platform earnings dashboard
router.get('/earnings', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { period = '30d' } = req.query as { period?: string };

  // Calculate date range
  let startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case 'all':
      startDate = new Date(0);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  // Get all successful payments in period
  const payments = await prisma.payment.findMany({
    where: {
      status: 'SUCCEEDED',
      createdAt: { gte: startDate },
    },
    select: {
      id: true,
      amountCents: true,
      applicationFeeCents: true,
      transferAmountCents: true,
      netAmountCents: true,
      currency: true,
      createdAt: true,
      order: {
        select: {
          id: true,
          shop: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Aggregate totals
  const totals = payments.reduce(
    (acc, p) => ({
      totalRevenue: acc.totalRevenue + p.amountCents,
      platformFees: acc.platformFees + p.applicationFeeCents,
      vendorPayouts: acc.vendorPayouts + p.transferAmountCents,
      transactionCount: acc.transactionCount + 1,
    }),
    { totalRevenue: 0, platformFees: 0, vendorPayouts: 0, transactionCount: 0 }
  );

  // Group by shop
  const shopEarnings = new Map<string, { shopId: string; shopName: string; shopSlug: string; revenue: number; platformFee: number; vendorPayout: number; orders: number }>();
  for (const p of payments) {
    const shop = p.order?.shop;
    if (!shop) continue;
    const existing = shopEarnings.get(shop.id) ?? {
      shopId: shop.id,
      shopName: shop.name,
      shopSlug: shop.slug,
      revenue: 0,
      platformFee: 0,
      vendorPayout: 0,
      orders: 0,
    };
    existing.revenue += p.amountCents;
    existing.platformFee += p.applicationFeeCents;
    existing.vendorPayout += p.transferAmountCents;
    existing.orders += 1;
    shopEarnings.set(shop.id, existing);
  }

  // Daily breakdown for chart
  const dailyMap = new Map<string, { date: string; revenue: number; platformFee: number }>();
  for (const p of payments) {
    const dateKey = p.createdAt.toISOString().split('T')[0];
    const existing = dailyMap.get(dateKey) ?? { date: dateKey, revenue: 0, platformFee: 0 };
    existing.revenue += p.amountCents;
    existing.platformFee += p.applicationFeeCents;
    dailyMap.set(dateKey, existing);
  }

  const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    period,
    totals,
    shopBreakdown: Array.from(shopEarnings.values()).sort((a, b) => b.platformFee - a.platformFee),
    dailyBreakdown,
    recentPayments: payments.slice(0, 20).map((p) => ({
      id: p.id,
      amountCents: p.amountCents,
      platformFeeCents: p.applicationFeeCents,
      transferAmountCents: p.transferAmountCents,
      currency: p.currency,
      createdAt: p.createdAt,
      shopName: p.order?.shop?.name ?? 'Unknown',
    })),
  });
});

export default router;
