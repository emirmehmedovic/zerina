import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { IdentityVerificationStatus, VendorApplicationStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { enqueueEmail } from '../lib/email';
import { renderOrderShippedEmail } from '../emails/templates';
import { z } from 'zod';
import { badRequest } from '../utils/errors';
import { validateQuery } from '../utils/validate';
import { stripe } from '../lib/stripe';
import { ENV } from '../env';
import { createRateLimiter } from '../middleware/rateLimit';
import { ensureApprovedVendor } from '../middleware/vendor';
import { IdentityProviderClient } from '../lib/identity';

const router = Router();

const vendorUpgradeLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1h window
  maxRequests: 5,
  keyPrefix: 'vendor-upgrade',
  message: 'Previše pokušaja. Pokušajte ponovo kasnije.',
});

const identityClient = new IdentityProviderClient();

type VendorApplicationSummary = {
  id: string;
  status: VendorApplicationStatus;
  submittedAt: Date;
  reviewedAt: Date | null;
  notes: string | null;
  rejectionReason: string | null;
  identityVerificationStatus: IdentityVerificationStatus;
  identityVerificationProvider: string | null;
  identityVerificationCheckedAt: Date | null;
  identityVerificationNotes: string | null;
  vendorDocuments: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    uploadedAt: Date;
  }>;
};

const vendorDocumentSelect = {
  id: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  storageKey: true,
  uploadedAt: true,
  applicationId: true,
} as const;

async function reassignVendorDocuments(params: {
  userId: string;
  applicationId: string;
  documentIds: string[];
}) {
  const { userId, applicationId, documentIds } = params;

  if (documentIds.length > 0) {
    const docs = await prisma.vendorDocument.findMany({
      where: { id: { in: documentIds }, userId },
      select: { id: true, applicationId: true },
    });

    if (docs.length !== documentIds.length) {
      const error = new Error('INVALID_DOCUMENTS');
      (error as any).code = 'INVALID_DOCUMENTS';
      throw error;
    }

    const conflicting = docs.find((doc) => doc.applicationId && doc.applicationId !== applicationId);
    if (conflicting) {
      const error = new Error('DOCUMENT_IN_USE');
      (error as any).code = 'DOCUMENT_IN_USE';
      throw error;
    }
  }

  await prisma.vendorDocument.updateMany({
    where: documentIds.length
      ? { userId, applicationId, id: { notIn: documentIds } }
      : { userId, applicationId },
    data: { applicationId: null },
  });

  if (documentIds.length) {
    await prisma.vendorDocument.updateMany({
      where: { userId, id: { in: documentIds } },
      data: { applicationId },
    });
  }
}

const vendorApplicationBodySchema = z.object({
  legalName: z.string().trim().min(3).max(255).optional(),
  country: z.string().trim().min(2).max(120).optional(),
  address: z.string().trim().min(5).max(500).optional(),
  contactPhone: z.string().trim().min(6).max(32).optional(),
  documentIds: z.array(z.string().cuid()).max(10).optional(),
});

const SESSION_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function refreshSessionCookie(res: Response, userId: string, role: 'BUYER' | 'VENDOR' | 'ADMIN') {
  const token = jwt.sign({ sub: userId, role }, ENV.sessionSecret, { expiresIn: '7d' });
  res.cookie(ENV.cookieName, token, {
    httpOnly: true,
    secure: ENV.cookieSecure,
    sameSite: ENV.nodeEnv === 'production' ? 'none' : 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

async function verifyCaptchaToken(req: Request, res: Response): Promise<boolean> {
  if (!ENV.captchaSecretKey) {
    return true;
  }

  const captchaToken = (req.body?.captchaToken ?? req.headers['x-captcha-token']) as string | undefined;
  if (!captchaToken) {
    res.status(400).json({ error: 'captcha_required' });
    return false;
  }

  try {
    if (ENV.captchaProvider === 'recaptcha') {
      const params = new URLSearchParams();
      params.append('secret', ENV.captchaSecretKey);
      params.append('response', captchaToken);
      if (req.ip) {
        params.append('remoteip', req.ip);
      }

      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`Captcha provider HTTP ${response.status}`);
      }

      const data = (await response.json()) as { success: boolean; score?: number; ['error-codes']?: string[] };
      if (!data.success || (typeof data.score === 'number' && data.score < ENV.captchaMinScore)) {
        res.status(400).json({
          error: 'captcha_failed',
          details: { score: data.score ?? null, errors: data['error-codes'] ?? [] },
        });
        return false;
      }

      return true;
    }

    res.status(500).json({ error: 'captcha_provider_not_supported' });
    return false;
  } catch (error) {
    console.error('[vendor] captcha verification failed', error);
    res.status(502).json({ error: 'captcha_verification_failed' });
    return false;
  }
}

async function captchaGuard(req: Request, res: Response, next: NextFunction) {
  const captchaOk = await verifyCaptchaToken(req, res);
  if (!captchaOk) {
    return;
  }

  if (req.body && typeof req.body === 'object') {
    delete (req.body as Record<string, unknown>).captchaToken;
  }

  return next();
}

router.post('/stripe/connect', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string; email?: string };

  try {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: user.sub },
    }) as any;
    if (!shop) {
      return res.status(404).json({ error: 'shop_not_found' });
    }
    if (shop.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'shop_not_active', status: shop.status });
    }

    const owner = await prisma.user.findUnique({
      where: { id: shop.ownerId },
      select: { email: true, name: true },
    });

    let accountId = shop.stripeAccountId ?? null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: owner?.email ?? user.email,
        business_profile: {
          name: shop.name || undefined,
          product_description: 'Marketplace vendor',
          support_email: owner?.email ?? user.email,
          url: ENV.frontendUrl,
        },
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
      });

      const updateData = {
        stripeAccountId: account.id,
        stripeOnboardedAt: account.details_submitted ? new Date() : null,
        stripeDetailsSubmitted: Boolean(account.details_submitted),
        stripeChargesEnabled: Boolean(account.charges_enabled),
        stripePayoutsEnabled: Boolean(account.payouts_enabled),
        stripeDefaultCurrency: account.default_currency ?? null,
      };

      await prisma.shop.update({
        where: { id: shop.id },
        data: updateData as any,
      });

      accountId = account.id;
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId!,
      refresh_url: `${ENV.frontendUrl}/dashboard/settings/payments?refresh=true`,
      return_url: `${ENV.frontendUrl}/dashboard/settings/payments?connected=true`,
      type: 'account_onboarding',
    });

    return res.json({ url: accountLink.url });
  } catch (error) {
    console.error('[vendor] stripe connect error', error);
    return res.status(500).json({ error: 'stripe_connect_failed' });
  }
});

router.get('/stripe/status', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };

  try {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: user.sub },
    } as any);

    const accountId = shop?.stripeAccountId ?? null;
    if (!shop) {
      return res.status(404).json({ error: 'shop_not_found' });
    }
    if (shop.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'shop_not_active', status: shop.status });
    }
    if (!accountId) {
      return res.json({ connected: false });
    }

    const account = await stripe.accounts.retrieve(accountId);
    const connected = Boolean(account.details_submitted && account.charges_enabled);

    const updateData: any = {
      stripeDetailsSubmitted: Boolean(account.details_submitted),
      stripeChargesEnabled: Boolean(account.charges_enabled),
      stripePayoutsEnabled: Boolean(account.payouts_enabled),
      stripeDefaultCurrency: account.default_currency ?? null,
    };

    if (connected && !shop.stripeOnboardedAt) {
      updateData.stripeOnboardedAt = new Date();
    }

    await prisma.shop.update({ where: { id: shop.id }, data: updateData as any });

    return res.json({
      connected,
      payouts_enabled: account.payouts_enabled,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements?.currently_due ?? [],
      default_currency: account.default_currency,
    });
  } catch (error) {
    console.error('[vendor] stripe status error', error);
    return res.status(500).json({ error: 'stripe_status_failed' });
  }
});

router.post('/stripe/dashboard-link', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };

  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub } });
    const accountId = shop?.stripeAccountId ?? null;
    if (!shop) {
      return res.status(404).json({ error: 'shop_not_found' });
    }
    if (shop.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'shop_not_active', status: shop.status });
    }
    if (!accountId) {
      return res.status(404).json({ error: 'account_not_connected' });
    }

    const loginLink = await stripe.accounts.createLoginLink(accountId);

    return res.json({ url: loginLink.url });
  } catch (error) {
    console.error('[vendor] stripe dashboard link error', error);
    return res.status(500).json({ error: 'stripe_dashboard_link_failed' });
  }
});

const discountCodeBodySchema = z.object({
  code: z.string().min(3).max(32),
  description: z.string().max(255).optional(),
  percentOff: z.number().int().min(1).max(100),
  expiresAt: z.string().optional(),
  maxUsesPerUser: z.number().int().min(1).max(50).optional(),
});

// GET /api/v1/vendor/discount-codes — list discount codes for vendor
router.get('/discount-codes', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ items: [] });

  const codes = await prisma.discountCode.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { redemptions: true } } },
  });

  const items = codes.map((code: (typeof codes)[number]) => {
    const { _count, ...rest } = code;
    return {
      ...rest,
      redemptionsCount: _count.redemptions,
    };
  });

  res.json({ items });
});

// POST /api/v1/vendor/discount-codes — create a new discount code
router.post('/discount-codes', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.status(403).json({ error: 'forbidden' });

  const parsed = discountCodeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', code: 'INVALID_BODY', details: parsed.error.flatten() });
  }

  const body = parsed.data;
  const normalizedCode = body.code.trim().toUpperCase();
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if (expiresAt && isNaN(expiresAt.getTime())) {
    return badRequest(res, 'invalid_expiry');
  }

  try {
    const created = await prisma.discountCode.create({
      data: {
        shopId: shop.id,
        code: normalizedCode,
        description: body.description,
        percentOff: body.percentOff,
        expiresAt,
        maxUsesPerUser: body.maxUsesPerUser ?? 1,
      },
    });
    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'code_exists', code: 'CONFLICT' });
    }
    throw err;
  }
});

// PATCH /api/v1/vendor/discount-codes/:id/status — toggle active flag
router.patch('/discount-codes/:id/status', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id } = req.params;
  const schema = z.object({ active: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', code: 'INVALID_BODY', details: parsed.error.flatten() });
  }

  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.status(403).json({ error: 'forbidden' });

  const existing = await prisma.discountCode.findUnique({ where: { id }, select: { id: true, shopId: true } });
  if (!existing || existing.shopId !== shop.id) return res.status(404).json({ error: 'not_found' });

  const updated = await prisma.discountCode.update({ where: { id }, data: { active: parsed.data.active } });
  res.json(updated);
});

// POST /api/v1/vendor/upgrade — submit vendor application (no auto role escalation)
router.post('/upgrade', requireAuth, captchaGuard, vendorUpgradeLimiter, async (req, res) => {
  const authUser = (req as any).user as { sub: string; role: 'BUYER' | 'VENDOR' | 'ADMIN' };

  const dbUser = await prisma.user.findUnique({ where: { id: authUser.sub } });
  if (!dbUser) {
    return res.status(404).json({ error: 'user_not_found' });
  }

  const userWithVerification = dbUser as typeof dbUser & {
    emailVerifiedAt?: Date | null;
    phoneNumber?: string | null;
    phoneVerifiedAt?: Date | null;
  };

  if (dbUser.role === 'ADMIN') {
    return res.json({
      status: 'already_admin',
      verification: {
        emailVerified: Boolean(userWithVerification.emailVerifiedAt),
        phoneVerified: Boolean(userWithVerification.phoneVerifiedAt),
        phoneRequired: ENV.requirePhoneVerification,
      },
    });
  }

  const parsed = vendorApplicationBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const verificationMeta = {
    emailVerified: Boolean(userWithVerification.emailVerifiedAt),
    phoneVerified: Boolean(userWithVerification.phoneVerifiedAt),
    phoneRequired: ENV.requirePhoneVerification,
  };

  const selectApplicationFields = {
    id: true,
    status: true,
    submittedAt: true,
    reviewedAt: true,
    notes: true,
    rejectionReason: true,
    legalName: true,
    country: true,
    address: true,
    contactPhone: true,
    identityVerificationStatus: true,
    identityVerificationProvider: true,
    identityVerificationCheckedAt: true,
    identityVerificationNotes: true,
    securityDepositRequired: true,
    securityDepositStatus: true,
    securityDepositAmountCents: true,
    securityDepositCurrency: true,
    securityDepositPaymentIntentId: true,
    vendorDocuments: { select: vendorDocumentSelect },
  } as const;

  let existing = await prisma.vendorApplication.findFirst({
    where: { userId: dbUser.id },
    orderBy: { submittedAt: 'desc' },
    select: selectApplicationFields,
  });

  const data = parsed.data;
  const securityDepositRequired = Boolean(ENV.securityDepositEnabled);

  const legalName = data.legalName ?? existing?.legalName ?? dbUser.name ?? `Vendor ${dbUser.id.slice(0, 6)}`;
  const country = data.country ?? existing?.country ?? 'Unknown';
  const address = data.address !== undefined ? data.address : existing?.address ?? null;
  const contactPhone = data.contactPhone !== undefined ? data.contactPhone : existing?.contactPhone ?? null;
  const documentIds = Array.isArray(data.documentIds)
    ? data.documentIds
    : (existing?.vendorDocuments?.map((doc) => doc.id) ?? []);

  let roleChanged = false;
  let finalRole: 'BUYER' | 'VENDOR' | 'ADMIN' = dbUser.role as any;

  if (existing && existing.status === 'APPROVED') {
    if (dbUser.role !== 'VENDOR') {
      await prisma.user.update({ where: { id: dbUser.id }, data: { role: 'VENDOR' } });
      roleChanged = true;
      finalRole = 'VENDOR';
    }

    if (roleChanged) {
      refreshSessionCookie(res, dbUser.id, finalRole);
    }

    return res.json({
      status: existing.status,
      application: existing,
      verification: verificationMeta,
    });
  }

  if (existing && existing.status === 'PENDING') {
    existing = await prisma.vendorApplication.update({
      where: { id: existing.id },
      data: {
        legalName,
        country,
        address,
        contactPhone,
        securityDepositRequired,
        securityDepositStatus: securityDepositRequired ? 'PENDING' : 'NOT_REQUIRED',
        securityDepositAmountCents: securityDepositRequired ? ENV.securityDepositAmountCents || 0 : null,
        securityDepositCurrency: securityDepositRequired ? ENV.securityDepositCurrency : null,
      },
      select: selectApplicationFields,
    });
  }

  let application = existing;

  if (!application) {
    application = await prisma.vendorApplication.create({
      data: {
        userId: dbUser.id,
        legalName,
        country,
        address,
        contactPhone,
        securityDepositRequired,
        securityDepositStatus: securityDepositRequired ? 'PENDING' : 'NOT_REQUIRED',
        securityDepositAmountCents: securityDepositRequired ? ENV.securityDepositAmountCents || 0 : null,
        securityDepositCurrency: securityDepositRequired ? ENV.securityDepositCurrency : null,
        identityVerificationStatus: 'PENDING',
      } as any,
      select: selectApplicationFields,
    });
  }

  try {
    await reassignVendorDocuments({ userId: dbUser.id, applicationId: application.id, documentIds });
  } catch (error: any) {
    const code = error?.code;
    if (code === 'INVALID_DOCUMENTS') {
      return res.status(400).json({ error: 'invalid_document_ids' });
    }
    if (code === 'DOCUMENT_IN_USE') {
      return res.status(409).json({ error: 'document_in_use' });
    }
    throw error;
  }

  let identityVerification = {
    status: 'PENDING' as 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'FAILED',
    provider: ENV.identityProvider ?? null,
    reference: null as string | null,
    score: null as number | null,
    reason: null as string | null,
  };

  try {
    if (!existing && ENV.identityProvider) {
      const identityResult = await identityClient.submitVerification({
        applicantId: dbUser.id,
        legalName,
        email: dbUser.email,
        country,
        referenceId: application.id,
      });

      let mappedStatus: 'PENDING' | 'VERIFIED' | 'FAILED' = 'PENDING';
      if (identityResult.status === 'verified') mappedStatus = 'VERIFIED';
      if (identityResult.status === 'failed') mappedStatus = 'FAILED';

      const scoreBelowThreshold =
        typeof identityResult.score === 'number' && identityResult.score < ENV.identityMinScore;
      if (scoreBelowThreshold) {
        mappedStatus = 'FAILED';
      }

      const checkedAt = mappedStatus === 'VERIFIED' || mappedStatus === 'FAILED' ? new Date() : null;
      const notes =
        identityResult.reason ?? (scoreBelowThreshold ? `score_below_threshold:${identityResult.score}` : null);

      await prisma.vendorApplication.update({
        where: { id: application.id },
        data: {
          identityVerificationStatus: mappedStatus,
          identityVerificationProvider: identityResult.provider,
          identityVerificationId: identityResult.reference,
          identityVerificationCheckedAt: checkedAt,
          identityVerificationNotes: notes,
        } as any,
      });

      identityVerification = {
        status: mappedStatus,
        provider: identityResult.provider,
        reference: identityResult.reference,
        score: identityResult.score ?? null,
        reason: notes,
      };
    }
  } catch (error) {
    console.error('[vendor] identity submission failed', error);
    if (!existing) {
      await prisma.vendorApplication.update({
        where: { id: application.id },
        data: {
          identityVerificationStatus: 'FAILED',
          identityVerificationNotes: 'identity_submission_failed',
          identityVerificationCheckedAt: new Date(),
        } as any,
      });

      identityVerification = {
        status: 'FAILED',
        provider: ENV.identityProvider ?? null,
        reference: null,
        score: null,
        reason: 'identity_submission_failed',
      };
    }
  }

  if (dbUser.role !== 'VENDOR') {
    await prisma.user.update({ where: { id: dbUser.id }, data: { role: 'VENDOR' } });
    roleChanged = true;
    finalRole = 'VENDOR';
  }

  const finalApplication = await prisma.vendorApplication.findUnique({
    where: { id: application.id },
    select: selectApplicationFields,
  });

  if (roleChanged) {
    refreshSessionCookie(res, dbUser.id, finalRole);
  }

  return res.status(201).json({
    status: finalApplication?.status ?? application.status,
    application: finalApplication ?? application,
    securityDeposit: securityDepositRequired
      ? {
          required: true,
          amountCents: ENV.securityDepositAmountCents || 0,
          currency: ENV.securityDepositCurrency,
        }
      : { required: false },
    identityVerification,
    verification: verificationMeta,
  });
});

router.get('/application-status', requireAuth, async (req, res) => {
  const authUser = (req as any).user as { sub: string };

  const user = await prisma.user.findUnique({
    where: { id: authUser.sub },
  });

  if (!user) {
    return res.status(404).json({ error: 'user_not_found' });
  }

  const application = (await prisma.vendorApplication.findFirst({
    where: { userId: user.id },
    orderBy: { submittedAt: 'desc' },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      reviewedAt: true,
      notes: true,
      rejectionReason: true,
      identityVerificationStatus: true,
      identityVerificationProvider: true,
      identityVerificationCheckedAt: true,
      identityVerificationNotes: true,
      vendorDocuments: { select: vendorDocumentSelect },
    },
  })) as VendorApplicationSummary | null;

  const requiresSecurityDeposit = Boolean(
    ENV.securityDepositEnabled && application && application.status !== 'REJECTED'
  );

  const securityDeposit = requiresSecurityDeposit
    ? {
        required: true,
        amountCents: ENV.securityDepositAmountCents || 0,
        currency: ENV.securityDepositCurrency,
      }
    : { required: false, amountCents: 0, currency: ENV.securityDepositCurrency };

  const userWithContact = user as typeof user & {
    emailVerifiedAt?: Date | null;
    phoneNumber?: string | null;
    phoneVerifiedAt?: Date | null;
  };

  res.json({
    user: {
      email: userWithContact.email,
      emailVerified: Boolean(userWithContact.emailVerifiedAt),
      phoneNumber: userWithContact.phoneNumber ?? null,
      phoneVerified: Boolean(userWithContact.phoneVerifiedAt),
      phoneRequired: ENV.requirePhoneVerification,
    },
    application,
    securityDeposit,
  });
});

// GET /api/v1/vendor/overview — stats for the current vendor's shop
router.get('/overview', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string; role: 'BUYER'|'VENDOR'|'ADMIN' };
  // Find the vendor's shop
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true, name: true, slug: true, status: true } });
  if (!shop) return res.json({ shop: null, productsTotal: 0, publishedCount: 0, draftCount: 0, lowStockCount: 0, ordersTotal: 0 });

  const [productsTotal, publishedCount, draftCount, lowStockCount, ordersTotal, revenueData] = await Promise.all([
    prisma.product.count({ where: { shopId: shop.id } }),
    prisma.product.count({ where: { shopId: shop.id, status: 'PUBLISHED' } }),
    prisma.product.count({ where: { shopId: shop.id, status: 'DRAFT' } }),
    prisma.product.count({ where: { shopId: shop.id, stock: { lt: 5 } } }),
    prisma.order.count({ where: { shopId: shop.id } }),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { shopId: shop.id, status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] } },
    }),
  ]);
  const totalRevenueCents = revenueData._sum.totalCents || 0;
  res.json({ shop, productsTotal, publishedCount, draftCount, lowStockCount, ordersTotal, totalRevenueCents });
});

// Query schemas
const vendorProductsQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(['DRAFT','PUBLISHED','ARCHIVED','SUSPENDED']).optional(),
  lowStock: z.string().optional(),
  lowStockThreshold: z.string().optional(),
  take: z.string().transform((v)=> Number(v||'50')).optional(),
  skip: z.string().transform((v)=> Number(v||'0')).optional(),
});

const vendorOrdersQuerySchema = z.object({
  status: z.enum(['PENDING_PAYMENT','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED']).optional(),
  take: z.string().transform((v)=> Number(v||'20')).optional(),
  skip: z.string().transform((v)=> Number(v||'0')).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
});

// GET /api/v1/vendor/products — list products for current vendor with filters
router.get('/products', requireAuth, ensureApprovedVendor, validateQuery(vendorProductsQuerySchema), async (req, res) => {
  const user = (req as any).user as { sub: string; role: 'BUYER'|'VENDOR'|'ADMIN' };
  const { q, status, lowStock, lowStockThreshold = '5', take = 50, skip = 0 } = (req as any).validated as any;
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ items: [], total: 0 });
  const where: any = { shopId: shop.id };
  if (q) (where as any).title = { contains: q, mode: 'insensitive' };
  if (status) (where as any).status = status as any;
  if (lowStock) {
    const thr = Number(lowStockThreshold) || 5;
    (where as any).stock = { lt: thr };
  }
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(100, Number(take) || 50)), skip: Math.max(0, Number(skip) || 0),
      select: { id: true, title: true, slug: true, priceCents: true, currency: true, stock: true, status: true } }),
    prisma.product.count({ where }),
  ]);
  res.json({ items, total });
});

// GET /api/v1/vendor/analytics/customer-insights — customer segmentation and geographic data
router.get('/analytics/customer-insights', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const days = Math.max(1, Math.min(365, Number((req.query as any).days) || 90));
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ newVsReturning: { new: 0, returning: 0 }, geo: [] });

  const since = new Date();
  since.setDate(since.getDate() - days);

  const orders = await prisma.order.findMany({
    where: { shopId: shop.id, createdAt: { gte: since } },
    select: { buyerId: true, shippingAddress: true },
  });

  // New vs Returning
  const customerOrderCounts = new Map<string, number>();
  for (const order of orders) {
    if (order.buyerId) {
      customerOrderCounts.set(order.buyerId, (customerOrderCounts.get(order.buyerId) || 0) + 1);
    }
  }

  let newCustomers = 0;
  let returningCustomers = 0;
  for (const count of customerOrderCounts.values()) {
    if (count === 1) {
      newCustomers++;
    } else {
      returningCustomers++;
    }
  }

  // Geographic data
  const geo = new Map<string, number>();
  for (const order of orders) {
    const country = order.shippingAddress?.country;
    if (country) {
      geo.set(country, (geo.get(country) || 0) + 1);
    }
  }

  res.json({
    newVsReturning: { new: newCustomers, returning: returningCustomers },
    geo: Array.from(geo.entries()).map(([country, orders]) => ({ country, orders })),
  });
});

export default router;
 
// GET /api/v1/vendor/orders — list orders for the vendor's shop
router.get('/orders', requireAuth, ensureApprovedVendor, validateQuery(vendorOrdersQuerySchema), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { status, take = 20, skip = 0, from, to, q = '' } = (req as any).validated as any;
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ items: [], total: 0 });
  const where: any = { shopId: shop.id };
  if (status) where.status = status;
  // Optional date range filter on createdAt
  if (from || to) {
    where.createdAt = {} as any;
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) (where.createdAt as any).gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) (where.createdAt as any).lte = d;
    }
  }
  // Search by order id or buyer email/name (best-effort; depends on relation naming)
  if (q) {
    const s = q.trim();
    where.OR = [
      { id: { contains: s, mode: 'insensitive' } as any },
      { buyer: { email: { contains: s, mode: 'insensitive' } } } as any,
      { buyer: { name: { contains: s, mode: 'insensitive' } } } as any,
    ];
  }
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(take) || 20,
      skip: Number(skip) || 0,
      select: {
        id: true,
        totalCents: true,
        currency: true,
        status: true,
        createdAt: true,
        buyer: { select: { id: true, email: true, name: true } },
        items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            quantity: true,
            priceCents: true,
            product: {
              select: {
                title: true,
                slug: true,
                images: { take: 1, select: { storageKey: true } },
              },
            },
            variant: {
              select: {
                id: true,
                attributes: true,
              },
            },
          },
        },
        shippingAddress: { select: { street: true, city: true, postalCode: true, country: true } },
        billingAddress: { select: { street: true, city: true, postalCode: true, country: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);
  res.json({ items, total });
});

// PATCH /api/v1/vendor/orders/:id/status — update order status (owner shop only)
router.patch('/orders/:id/status', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id } = req.params;
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.status(403).json({ error: 'forbidden' });
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      shopId: true,
      status: true,
      shippedNotifiedAt: true,
      buyer: { select: { email: true, name: true } },
      shop: { select: { name: true } },
    },
  });
  if (!order || order.shopId !== shop.id) return res.status(404).json({ error: 'not_found' });
  const schema = z.object({ status: z.enum(['PROCESSING','SHIPPED','DELIVERED','CANCELLED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  const updated = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
    select: { id: true, status: true, shippedNotifiedAt: true },
  });

  if (parsed.data.status === 'SHIPPED' && !order.shippedNotifiedAt && order.buyer?.email) {
    sendShipmentEmail(order.id).catch((err) => {
      console.error('[vendor] failed to send shipment email', err);
    });
  }

  res.json(updated);
});

async function sendShipmentEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { email: true, name: true } },
      shop: { select: { name: true } },
      items: {
        select: {
          product: { select: { title: true } },
          quantity: true,
        },
      },
    },
  });

  if (!order || !order.buyer?.email || order.shippedNotifiedAt) return;

  const email = renderOrderShippedEmail({
    orderId: order.id,
    buyerName: order.buyer.name,
    shopName: order.shop?.name,
    items: order.items.map((item) => `${item.quantity} × ${item.product?.title ?? 'Product'}`),
  });

  await enqueueEmail({
    to: order.buyer.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { shippedNotifiedAt: new Date() },
  });
}

// GET /api/v1/vendor/analytics/sales?days=30 — sales totals per day and top products
router.get('/analytics/sales', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const days = Math.max(1, Math.min(365, Number((req.query as any).days) || 30));
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ days, series: [], topProducts: [] });
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  const validStatuses = ['PROCESSING','SHIPPED','DELIVERED','REFUNDED'] as const;
  const orders = await prisma.order.findMany({
    where: { shopId: shop.id, status: { in: validStatuses as any }, createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      createdAt: true,
      items: { select: { productId: true, priceCents: true, quantity: true } },
    },
  });
  // Build date index
  const fmt = (d: Date) => d.toISOString().slice(0,10);
  const seriesMap = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    seriesMap.set(fmt(d), 0);
  }
  const productTotals = new Map<string, { qty: number; revenueCents: number }>();
  for (const o of orders) {
    const day = fmt(new Date(o.createdAt));
    const daySum = o.items.reduce((s: number, it: { priceCents: number; quantity: number; }) => s + it.priceCents * it.quantity, 0);
    seriesMap.set(day, (seriesMap.get(day) || 0) + daySum);
    for (const it of o.items) {
      const cur = productTotals.get(it.productId) || { qty: 0, revenueCents: 0 };
      cur.qty += it.quantity;
      cur.revenueCents += it.priceCents * it.quantity;
      productTotals.set(it.productId, cur);
    }
  }
  const productIds = Array.from(productTotals.keys());
  const products = productIds.length ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true, slug: true } }) : [];
  const topProducts = productIds
    .map((id) => ({ id, title: products.find((p: { id: string; }) => p.id === id)?.title || id, slug: products.find((p: { id: string; }) => p.id === id)?.slug || '', qty: productTotals.get(id)!.qty, revenueCents: productTotals.get(id)!.revenueCents }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 10);
  const series = Array.from(seriesMap.entries()).map(([date, totalCents]) => ({ date, totalCents }));
  res.json({ days, series, topProducts });
});

// GET /api/v1/vendor/analytics/kpis?days=30 — overall KPIs for period
router.get('/analytics/kpis', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const days = Math.max(1, Math.min(365, Number((req.query as any).days) || 30));
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ days, revenueCents: 0, orders: 0, items: 0, avgOrderValueCents: 0 });
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  const orders = await prisma.order.findMany({
    where: { shopId: shop.id, createdAt: { gte: since } },
    select: { id: true, totalCents: true, items: { select: { quantity: true } } },
  });
  const revenueCents = orders.reduce((s: number, o: { totalCents: number | null; }) => s + (o.totalCents || 0), 0);
  const ordersCount = orders.length;
  const items = orders.reduce((s: number, o: { items: { quantity: number; }[]; }) => s + o.items.reduce((a: number, it: { quantity: number; }) => a + it.quantity, 0), 0);
  const avgOrderValueCents = ordersCount ? Math.round(revenueCents / ordersCount) : 0;
  res.json({ days, revenueCents, orders: ordersCount, items, avgOrderValueCents });
});

// GET /api/v1/vendor/analytics/top-products?limit=10&days=30 — top products by revenue
router.get('/analytics/top-products', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const limit = Math.max(1, Math.min(50, Number((req.query as any).limit) || 10));
  const days = Math.max(1, Math.min(365, Number((req.query as any).days) || 30));
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ items: [] });
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  const orders = await prisma.order.findMany({
    where: { shopId: shop.id, createdAt: { gte: since } },
    select: { items: { select: { productId: true, priceCents: true, quantity: true } } },
  });
  const totals = new Map<string, { qty: number; revenueCents: number }>();
  for (const o of orders) {
    for (const it of o.items) {
      const cur = totals.get(it.productId) || { qty: 0, revenueCents: 0 };
      cur.qty += it.quantity;
      cur.revenueCents += it.priceCents * it.quantity;
      totals.set(it.productId, cur);
    }
  }
  const ids = Array.from(totals.keys());
  const products = ids.length ? await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, slug: true } }) : [];
  const items = ids
    .map((id) => ({ id, title: products.find((p: { id: string; }) => p.id === id)?.title || id, slug: products.find((p: { id: string; }) => p.id === id)?.slug || '', qty: totals.get(id)!.qty, revenueCents: totals.get(id)!.revenueCents }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, limit);
  res.json({ items });
});

// GET /api/v1/vendor/analytics/top-customers?limit=10&days=30 — top customers by revenue (buyerId only)
router.get('/analytics/top-customers', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const limit = Math.max(1, Math.min(50, Number((req.query as any).limit) || 10));
  const days = Math.max(1, Math.min(365, Number((req.query as any).days) || 30));
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ items: [] });
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  const orders = await prisma.order.findMany({
    where: { shopId: shop.id, createdAt: { gte: since } },
    select: { buyerId: true, totalCents: true },
  });
  const totals = new Map<string, number>();
  for (const o of orders) {
    const id = o.buyerId || 'anonymous';
    totals.set(id, (totals.get(id) || 0) + (o.totalCents || 0));
  }
  const items = Array.from(totals.entries())
    .map(([buyerId, revenueCents]) => ({ buyerId, revenueCents }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, limit);
  res.json({ items });
});

// GET /api/v1/vendor/analytics/product/:productId?days=90 — detailed analytics for a specific product
router.get('/analytics/product/:productId', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { productId } = req.params;
  const days = Math.max(1, Math.min(365, Number((req.query as any).days) || 90));
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ product: null, series: [], kpis: {} });
  
  // Verify product belongs to vendor
  const product = await prisma.product.findFirst({ 
    where: { id: productId, shopId: shop.id },
    select: { id: true, title: true, slug: true, priceCents: true, currency: true, stock: true }
  });
  if (!product) return res.json({ product: null, series: [], kpis: {} });
  
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  
  // Get all orders with this product
  const orders = await prisma.order.findMany({
    where: { 
      shopId: shop.id, 
      createdAt: { gte: since },
      items: { some: { productId } }
    },
    select: { 
      id: true, 
      createdAt: true,
      items: { 
        where: { productId },
        select: { quantity: true, priceCents: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
  
  // Build daily series
  const seriesMap = new Map<string, { qty: number; revenueCents: number }>();
  const fmt = (d: Date) => d.toISOString().slice(0,10);
  
  // Initialize all days in range
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    seriesMap.set(fmt(d), { qty: 0, revenueCents: 0 });
  }
  
  // Populate with actual data
  for (const o of orders) {
    const day = fmt(new Date(o.createdAt));
    const entry = seriesMap.get(day) || { qty: 0, revenueCents: 0 };
    for (const item of o.items) {
      entry.qty += item.quantity;
      entry.revenueCents += item.priceCents * item.quantity;
    }
    seriesMap.set(day, entry);
  }
  
  // Convert to array and calculate KPIs
  const series = Array.from(seriesMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // Calculate KPIs
  const totalQty = series.reduce((sum, day) => sum + day.qty, 0);
  const totalRevenue = series.reduce((sum, day) => sum + day.revenueCents, 0);
  const daysWithSales = series.filter(day => day.qty > 0).length;
  
  // Calculate seasonal patterns (group by month)
  const monthlyData = new Map<string, { qty: number; revenueCents: number; count: number }>();
  for (const day of series) {
    const month = day.date.slice(0, 7); // YYYY-MM
    const entry = monthlyData.get(month) || { qty: 0, revenueCents: 0, count: 0 };
    entry.qty += day.qty;
    entry.revenueCents += day.revenueCents;
    entry.count += day.qty > 0 ? 1 : 0;
    monthlyData.set(month, entry);
  }
  
  const seasonal = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      avgQtyPerDay: data.count ? data.qty / data.count : 0,
      avgRevenuePerDay: data.count ? data.revenueCents / data.count : 0,
      totalQty: data.qty,
      totalRevenueCents: data.revenueCents
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  // Simple linear projection for next 30 days
  // Use last 30 days of data for projection if available
  const recentDays = Math.min(30, series.length);
  const recentSeries = series.slice(-recentDays);
  const recentQty = recentSeries.reduce((sum, day) => sum + day.qty, 0);
  const recentRevenue = recentSeries.reduce((sum, day) => sum + day.revenueCents, 0);
  
  const projectedDailyQty = recentDays > 0 ? recentQty / recentDays : 0;
  const projectedDailyRevenue = recentDays > 0 ? recentRevenue / recentDays : 0;
  
  const projection = {
    next30Days: {
      projectedQty: Math.round(projectedDailyQty * 30),
      projectedRevenueCents: Math.round(projectedDailyRevenue * 30)
    },
    next90Days: {
      projectedQty: Math.round(projectedDailyQty * 90),
      projectedRevenueCents: Math.round(projectedDailyRevenue * 90)
    }
  };
  
  // Return combined data
  res.json({
    product,
    series,
    kpis: {
      totalQty,
      totalRevenueCents: totalRevenue,
      avgOrderValueCents: totalQty > 0 ? Math.round(totalRevenue / totalQty) : 0,
      daysWithSales
    },
    seasonal,
    projection
  });
});

// GET /api/v1/vendor/analytics/seasonal?days=365 — seasonal analysis across all products
router.get('/analytics/seasonal', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const days = Math.max(90, Math.min(730, Number((req.query as any).days) || 365)); // At least 90 days, max 2 years
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ seasonal: [], weekday: [] });
  
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  
  // Get all orders
  const orders = await prisma.order.findMany({
    where: { 
      shopId: shop.id, 
      createdAt: { gte: since }
    },
    select: { 
      id: true, 
      createdAt: true,
      totalCents: true,
      items: { select: { quantity: true } }
    }
  });
  
  // Monthly analysis
  const monthlyData = new Map<string, { orders: number; items: number; revenueCents: number }>();
  
  // Weekday analysis (0 = Sunday, 6 = Saturday)
  const weekdayData = new Map<number, { orders: number; items: number; revenueCents: number }>();
  for (let i = 0; i < 7; i++) {
    weekdayData.set(i, { orders: 0, items: 0, revenueCents: 0 });
  }
  
  for (const order of orders) {
    const date = new Date(order.createdAt);
    const month = date.toISOString().slice(0, 7); // YYYY-MM
    const weekday = date.getDay(); // 0-6
    
    // Monthly aggregation
    const monthEntry = monthlyData.get(month) || { orders: 0, items: 0, revenueCents: 0 };
    monthEntry.orders += 1;
    monthEntry.items += order.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
    monthEntry.revenueCents += order.totalCents;
    monthlyData.set(month, monthEntry);
    
    // Weekday aggregation
    const weekdayEntry = weekdayData.get(weekday)!;
    weekdayEntry.orders += 1;
    weekdayEntry.items += order.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
    weekdayEntry.revenueCents += order.totalCents;
    weekdayData.set(weekday, weekdayEntry);
  }
  
  // Convert to arrays
  const seasonal = Array.from(monthlyData.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  const weekday = Array.from(weekdayData.entries())
    .map(([day, data]) => ({ 
      day, 
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
      ...data 
    }))
    .sort((a, b) => a.day - b.day);
  
  res.json({ seasonal, weekday });
});

// GET /api/v1/vendor/analytics/projections?days=90 — sales projections based on historical data
router.get('/analytics/projections', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const days = Math.max(30, Math.min(365, Number((req.query as any).days) || 90));
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ projections: {} });
  
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  
  // Get daily sales data
  const orders = await prisma.order.findMany({
    where: { 
      shopId: shop.id, 
      createdAt: { gte: since }
    },
    select: { 
      createdAt: true,
      totalCents: true,
      items: { select: { quantity: true } }
    }
  });
  
  // Group by day
  const dailyData = new Map<string, { orders: number; items: number; revenueCents: number }>();
  const fmt = (d: Date) => d.toISOString().slice(0,10);
  
  // Initialize all days in range
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    dailyData.set(fmt(d), { orders: 0, items: 0, revenueCents: 0 });
  }
  
  // Fill with actual data
  for (const order of orders) {
    const day = fmt(new Date(order.createdAt));
    const entry = dailyData.get(day) || { orders: 0, items: 0, revenueCents: 0 };
    entry.orders += 1;
    entry.items += order.items.reduce((sum: number, item: { quantity: number; }) => sum + item.quantity, 0);
    entry.revenueCents += order.totalCents;
    dailyData.set(day, entry);
  }
  
  // Convert to array for analysis
  const dailySeries = Array.from(dailyData.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // Calculate averages for projection
  const totalOrders = dailySeries.reduce((sum, day) => sum + day.orders, 0);
  const totalItems = dailySeries.reduce((sum, day) => sum + day.items, 0);
  const totalRevenue = dailySeries.reduce((sum, day) => sum + day.revenueCents, 0);
  
  const avgDailyOrders = days > 0 ? totalOrders / days : 0;
  const avgDailyItems = days > 0 ? totalItems / days : 0;
  const avgDailyRevenue = days > 0 ? totalRevenue / days : 0;
  
  // Calculate growth rate (simple linear)
  let growthRate = 0;
  if (dailySeries.length >= 30) {
    const firstPeriod = dailySeries.slice(0, Math.floor(dailySeries.length / 2));
    const secondPeriod = dailySeries.slice(Math.floor(dailySeries.length / 2));
    
    const firstAvg = firstPeriod.reduce((sum: number, day: { revenueCents: number; }) => sum + day.revenueCents, 0) / firstPeriod.length;
    const secondAvg = secondPeriod.reduce((sum: number, day: { revenueCents: number; }) => sum + day.revenueCents, 0) / secondPeriod.length;
    
    if (firstAvg > 0) {
      growthRate = (secondAvg - firstAvg) / firstAvg;
    }
  }
  
  // Project for different periods
  const projections = {
    next30Days: {
      orders: Math.round(avgDailyOrders * 30),
      items: Math.round(avgDailyItems * 30),
      revenueCents: Math.round(avgDailyRevenue * 30 * (1 + growthRate/3))
    },
    next90Days: {
      orders: Math.round(avgDailyOrders * 90),
      items: Math.round(avgDailyItems * 90),
      revenueCents: Math.round(avgDailyRevenue * 90 * (1 + growthRate))
    },
    next365Days: {
      orders: Math.round(avgDailyOrders * 365),
      items: Math.round(avgDailyItems * 365),
      revenueCents: Math.round(avgDailyRevenue * 365 * (1 + growthRate * 2))
    },
    growthRate: growthRate
  };
  
  res.json({ 
    projections,
    historicalData: {
      days,
      totalOrders,
      totalItems,
      totalRevenueCents: totalRevenue,
      avgDailyOrders,
      avgDailyItems,
      avgDailyRevenueCents: avgDailyRevenue
    }
  });
});
// GET /api/v1/vendor/analytics/status-counts — counts of orders by status for vendor's shop
router.get('/analytics/status-counts', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ counts: {} });
  const statuses = ['PENDING_PAYMENT','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED'] as const;
  const results = await Promise.all(statuses.map(async (s) => [s, await prisma.order.count({ where: { shopId: shop.id, status: s as any } })] as const));
  const counts = Object.fromEntries(results);
  res.json({ counts });
});

// GET /api/v1/vendor/inventory/low-stock?threshold=5&take=10 — low stock products for vendor's shop
router.get('/inventory/low-stock', requireAuth, ensureApprovedVendor, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const threshold = Number((req.query as any).threshold) || 5;
  const take = Number((req.query as any).take) || 10;
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ items: [] });
  const items = await prisma.product.findMany({
    where: { shopId: shop.id, stock: { lt: threshold } },
    orderBy: { stock: 'asc' },
    take,
    select: { id: true, title: true, slug: true, stock: true },
  });
  res.json({ items });
});
