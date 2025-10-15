import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { prisma } from '../prisma';
import { requireAuth, withAuth } from '../middleware/auth';
import { stripe } from '../lib/stripe';
import { ENV } from '../env';
import { PaymentStatus } from '@prisma/client';
import { enqueueEmail } from '../lib/email';
import { renderOrderConfirmedEmail } from '../emails/templates';

const router = Router();

const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  qty: z.number().int().positive(),
});

type ValidateItemsOptions = {
  discountCode?: string;
  userId?: string;
};

type DiscountCalculation = {
  id: string;
  code: string;
  percentOff: number;
  amountCents: number;
  shopId: string;
  shopName?: string | null;
};

type ShopSummaryMeta = {
  shopId: string;
  amountCents: number;
  discountCents: number;
  platformFeeCents: number;
  transferAmountCents: number;
  stripeAccountId: string;
};

const discountError = (error: string, message: string, status = 400) => ({ error, message, status });

// Shared validator
async function validateItems(
  items: Array<{ productId: string; variantId?: string; qty: number }>,
  opts: ValidateItemsOptions = {}
) {
  const results = [] as Array<{
    productId: string;
    variantId?: string;
    title: string;
    slug: string;
    priceCents: number;
    currency: string;
    qty: number;
    stock: number;
    image?: string | null;
    shopId: string;
    shop?: { id: string; name: string; slug: string };
  }>;
  for (const it of items) {
    const product = await prisma.product.findUnique({
      where: { id: it.productId },
      include: {
        variants: true,
        images: { orderBy: { position: 'asc' }, take: 1 },
        shop: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!product || product.status !== 'PUBLISHED') {
      throw { error: 'invalid_item', productId: it.productId };
    }
    let price = product.priceCents;
    let stock = product.stock;
    if (it.variantId) {
      const variant = product.variants.find((v: { id: string }) => v.id === it.variantId);
      if (!variant) throw { error: 'invalid_variant', productId: it.productId, variantId: it.variantId };
      price = variant.priceCents;
      stock = variant.stock;
    }
    if (stock < it.qty) {
      throw { error: 'insufficient_stock', productId: it.productId, variantId: it.variantId, stock };
    }
    results.push({
      productId: it.productId,
      variantId: it.variantId,
      title: product.title,
      slug: product.slug,
      priceCents: price,
      currency: product.currency,
      qty: it.qty,
      stock,
      image: product.images[0]?.storageKey || null,
      shopId: product.shopId,
      shop: product.shop ? { id: product.shop.id, name: product.shop.name, slug: product.shop.slug } : undefined,
    });
  }
  const totalCents = results.reduce((sum, r) => sum + r.priceCents * r.qty, 0);

  let discount: DiscountCalculation | null = null;
  const normalizedCode = opts.discountCode?.trim().toUpperCase();

  if (normalizedCode) {
    if (!opts.userId) {
      throw discountError('discount_requires_login', 'You must be signed in to apply a discount code.', 401);
    }

    const code = await prisma.discountCode.findUnique({
      where: { code: normalizedCode },
      include: { shop: { select: { id: true, name: true } } },
    });

    if (!code || !code.active) {
      throw discountError('discount_invalid', 'Discount code not found or inactive.');
    }

    if (code.expiresAt && code.expiresAt.getTime() < Date.now()) {
      throw discountError('discount_expired', 'This discount code has expired.');
    }

    const uses = await prisma.discountCodeRedemption.count({
      where: { discountCodeId: code.id, userId: opts.userId },
    });

    if (uses >= (code.maxUsesPerUser || 1)) {
      throw discountError('discount_limit_reached', 'You have already used this discount code the maximum number of times.');
    }

    const eligibleSubtotal = results
      .filter((r) => r.shopId === code.shopId)
      .reduce((sum, r) => sum + r.priceCents * r.qty, 0);

    if (eligibleSubtotal <= 0) {
      throw discountError('discount_not_applicable', 'This discount code does not apply to items in your cart.');
    }

    const amountCents = Math.floor((eligibleSubtotal * code.percentOff) / 100);

    if (amountCents <= 0) {
      throw discountError('discount_not_applicable', 'This discount code cannot be applied to your cart total.');
    }

    discount = {
      id: code.id,
      code: code.code,
      percentOff: code.percentOff,
      amountCents,
      shopId: code.shopId,
      shopName: code.shop?.name,
    };
  }

  const discountCents = discount?.amountCents ?? 0;
  const payableCents = Math.max(0, totalCents - discountCents);

  return {
    items: results,
    totalCents,
    currency: results[0]?.currency || 'EUR',
    discount,
    discountCents,
    payableCents,
  };
}

// POST /api/v1/checkout/validate — validate cart and return normalized items + totals
router.post('/validate', withAuth(true), async (req, res) => {
  const schema = z.object({
    items: z.array(cartItemSchema).min(1),
    discountCode: z.string().trim().min(3).max(64).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  const user = (req as any).user as { sub: string } | undefined;
  const requestedDiscount = parsed.data.discountCode?.trim();
  if (requestedDiscount && !user) {
    return res.status(401).json({ error: 'discount_requires_login', message: 'Sign in to apply a discount code.' });
  }
  try {
    const result = await validateItems(parsed.data.items, {
      discountCode: requestedDiscount,
      userId: user?.sub,
    });
    return res.json(result);
  } catch (e: any) {
    if (e && e.error) return res.status(e.status || 400).json(e);
    return res.status(500).json({ error: 'server_error' });
  }
});

// POST /api/v1/checkout/payment-intent — create a Stripe PaymentIntent for the current cart
router.post('/payment-intent', requireAuth, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const schema = z.object({
    items: z.array(cartItemSchema).min(1),
    discountCode: z.string().trim().min(3).max(64).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });

  let validateRes: Awaited<ReturnType<typeof validateItems>>;
  try {
    validateRes = await validateItems(parsed.data.items, {
      discountCode: parsed.data.discountCode,
      userId: user.sub,
    });
  } catch (e: any) {
    return res.status(e?.status || 400).json(e);
  }

  const payableCents = validateRes.payableCents ?? validateRes.totalCents;
  if (!payableCents || payableCents <= 0) {
    return res.status(400).json({ error: 'payment_not_required', message: 'No payment required for this order.' });
  }

  const items = validateRes.items as Array<{ productId: string; variantId?: string; priceCents: number; qty: number; shopId: string }>;
  const byShop = new Map<string, typeof items>();
  for (const it of items) {
    const bucket = byShop.get(it.shopId) || [];
    bucket.push(it);
    byShop.set(it.shopId, bucket);
  }

  const shopIds = Array.from(byShop.keys());
  const shops = await prisma.shop.findMany({
    where: { id: { in: shopIds } },
    select: { id: true, name: true, stripeAccountId: true },
  });
  const shopIndex = new Map(shops.map((shop) => [shop.id, shop]));

  const platformFeePercent = Number.isFinite(ENV.stripePlatformFeePercent)
    ? Math.max(0, ENV.stripePlatformFeePercent)
    : 0;

  const shopSummaries: ShopSummaryMeta[] = [];
  for (const [shopId, list] of byShop.entries()) {
    const shop = shopIndex.get(shopId);
    if (!shop || !shop.stripeAccountId) {
      return res.status(400).json({ error: 'shop_not_connected', shopId });
    }

    const rawTotalCents = list.reduce((sum, it) => sum + it.priceCents * it.qty, 0);
    const discountCents = validateRes.discount?.shopId === shopId
      ? Math.min(validateRes.discount.amountCents, rawTotalCents)
      : 0;
    const amountCents = Math.max(0, rawTotalCents - discountCents);
    const platformFeeCents = Math.round((amountCents * platformFeePercent) / 100);
    const transferAmountCents = Math.max(amountCents - platformFeeCents, 0);

    shopSummaries.push({
      shopId,
      amountCents,
      discountCents,
      platformFeeCents,
      transferAmountCents,
      stripeAccountId: shop.stripeAccountId,
    });
  }

  const totalShopAmount = shopSummaries.reduce((sum, s) => sum + s.amountCents, 0);
  if (totalShopAmount !== payableCents) {
    // Adjust rounding differences by applying the delta to the first shop entry
    const delta = payableCents - totalShopAmount;
    if (shopSummaries[0]) {
      shopSummaries[0].amountCents += delta;
      shopSummaries[0].transferAmountCents = Math.max(shopSummaries[0].amountCents - shopSummaries[0].platformFeeCents, 0);
    }
  }

  const totalPlatformFeeCents = shopSummaries.reduce((sum, s) => sum + s.platformFeeCents, 0);
  const transferGroup = `tg_${randomUUID()}`;

  const metadata: Record<string, string> = {
    userId: user.sub,
    discountCode: validateRes.discount?.code ?? '',
    shopSummary: JSON.stringify(shopSummaries),
    shopCount: String(shopSummaries.length),
    totalPlatformFeeCents: String(totalPlatformFeeCents),
    platformFeePercent: String(platformFeePercent),
  };

  try {
    const intent = await stripe.paymentIntents.create({
      amount: payableCents,
      currency: (validateRes.currency || 'eur').toLowerCase(),
      automatic_payment_methods: { enabled: true },
      transfer_group: transferGroup,
      metadata,
    });

    return res.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      transferGroup,
      shopSummaries,
    });
  } catch (e: any) {
    console.error('[checkout] payment-intent error', e);
    return res.status(500).json({ error: 'payment_intent_failed', message: 'Unable to create payment intent.' });
  }
});

// POST /api/v1/checkout/draft — create order draft from validated cart
router.post('/draft', requireAuth, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const schema = z.object({
    items: z.array(cartItemSchema).min(1),
    shipping: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1),
    }),
    billing: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1),
    }),
    discountCode: z.string().trim().min(3).max(64).optional(),
    paymentIntentId: z.string().trim().min(1).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });

  // Validate items locally
  let validateRes: Awaited<ReturnType<typeof validateItems>>;
  let intent: Stripe.PaymentIntent | null = null;
  try {
    validateRes = await validateItems(parsed.data.items, {
      discountCode: parsed.data.discountCode,
      userId: user.sub,
    });
  } catch (e: any) {
    return res.status(e?.status || 400).json(e);
  }

  const payableCents = validateRes.payableCents ?? validateRes.totalCents;

  let paymentIntentStatus: string | null = null;
  let shopSummariesFromIntent: ShopSummaryMeta[] = [];
  if (payableCents > 0) {
    if (!parsed.data.paymentIntentId) {
      return res.status(400).json({ error: 'payment_intent_required' });
    }
    try {
      intent = await stripe.paymentIntents.retrieve(parsed.data.paymentIntentId);
      if (intent.metadata?.userId && intent.metadata.userId !== user.sub) {
        return res.status(403).json({ error: 'payment_intent_mismatch' });
      }
      if (intent.currency.toLowerCase() !== (validateRes.currency || 'eur').toLowerCase()) {
        return res.status(400).json({ error: 'payment_currency_mismatch' });
      }
      if (intent.amount < payableCents) {
        return res.status(400).json({ error: 'payment_amount_mismatch' });
      }
      if (intent.status !== 'succeeded') {
        return res.status(400).json({ error: 'payment_not_completed', status: intent.status });
      }
      paymentIntentStatus = intent.status;
      if (intent.metadata?.shopSummary) {
        try {
          shopSummariesFromIntent = JSON.parse(intent.metadata.shopSummary) as ShopSummaryMeta[];
        } catch (err) {
          console.warn('[checkout] unable to parse shopSummary metadata', err);
        }
      }
    } catch (err) {
      console.error('[checkout] retrieve payment intent failed', err);
      return res.status(400).json({ error: 'invalid_payment_intent' });
    }
  }

  // Group by shop for multi-vendor (MVP: create one order per shop)
  const items = validateRes.items as Array<{ productId: string; variantId?: string; priceCents: number; qty: number; shopId: string }>;
  const byShop = new Map<string, typeof items>();
  for (const it of items) {
    const list = byShop.get(it.shopId) || [];
    list.push(it);
    byShop.set(it.shopId, list);
  }

  const [shippingAddress, billingAddress] = await Promise.all([
    prisma.address.create({ data: { userId: user.sub, ...parsed.data.shipping } }),
    prisma.address.create({ data: { userId: user.sub, ...parsed.data.billing } }),
  ]);

  const createdOrders = [] as any[];
  const emailPromises: Array<Promise<unknown>> = [];
  const paymentRecords = [] as { orderId: string; platformFeeCents: number; transferAmountCents: number }[];
  const platformFeePercent = Number.isFinite(ENV.stripePlatformFeePercent)
    ? Math.max(0, ENV.stripePlatformFeePercent)
    : 0;

  for (const [shopId, list] of byShop.entries()) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return res.status(400).json({ error: 'invalid_shop' });

    const rawTotalCents = list.reduce((sum, it) => sum + it.priceCents * it.qty, 0);
    const orderDiscountCents = validateRes.discount?.shopId === shopId
      ? Math.min(validateRes.discount.amountCents, rawTotalCents)
      : 0;
    const totalCents = Math.max(0, rawTotalCents - orderDiscountCents);

    const shopMeta = shopSummariesFromIntent.find((meta) => meta.shopId === shopId);
    const platformFeeCents = shopMeta?.platformFeeCents ?? Math.round((totalCents * platformFeePercent) / 100);
    const transferAmountCents = shopMeta?.transferAmountCents ?? Math.max(totalCents - platformFeeCents, 0);

    const order = await prisma.order.create({
      data: {
        buyerId: user.sub,
        shopId,
        totalCents,
        currency: validateRes.currency,
        status: paymentIntentStatus === 'succeeded' || payableCents === 0 ? 'PROCESSING' : 'PENDING_PAYMENT',
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress.id,
        discountCodeId: orderDiscountCents > 0 ? validateRes.discount?.id : null,
        discountCents: orderDiscountCents,
        items: {
          create: list.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            priceCents: it.priceCents,
            quantity: it.qty,
          })),
        },
      },
      include: { items: true },
    });
    createdOrders.push(order);
    paymentRecords.push({ orderId: order.id, platformFeeCents, transferAmountCents });

    if (orderDiscountCents > 0 && validateRes.discount) {
      await prisma.discountCodeRedemption.create({
        data: {
          discountCodeId: validateRes.discount.id,
          userId: user.sub,
          orderId: order.id,
        },
      });
    }

    // Queue order confirmation email for the buyer
    emailPromises.push(sendOrderConfirmationEmail(order.id));
  }

  if (intent) {
    const paymentStatus = paymentIntentStatus === 'succeeded' ? PaymentStatus.SUCCEEDED : PaymentStatus.PENDING;
    for (const record of paymentRecords) {
      await prisma.payment.create({
        data: {
          orderId: record.orderId,
          provider: 'stripe',
          providerPaymentIntentId: intent.id,
          providerChargeId: null,
          providerTransferId: null,
          status: paymentStatus,
          amountCents: createdOrders.find((o) => o.id === record.orderId)?.totalCents ?? 0,
          applicationFeeCents: record.platformFeeCents,
          transferAmountCents: record.transferAmountCents,
          netAmountCents: Math.max((createdOrders.find((o) => o.id === record.orderId)?.totalCents ?? 0) - record.platformFeeCents, 0),
          currency: (validateRes.currency || 'eur').toLowerCase(),
          clientSecret: intent.client_secret ?? null,
          transferGroup: intent.transfer_group ?? null,
          rawPayload: undefined,
        },
      });
    }

    const existingMetadata = intent.metadata ? Object.fromEntries(Object.entries(intent.metadata)) : {};
    existingMetadata.orderIds = JSON.stringify(createdOrders.map((order) => order.id));
    existingMetadata.orderCount = String(createdOrders.length);
    existingMetadata.orderStatus = paymentIntentStatus === 'succeeded' ? 'processing' : 'pending';

    try {
      await stripe.paymentIntents.update(intent.id, { metadata: existingMetadata as Stripe.MetadataParam });
    } catch (err) {
      console.warn('[checkout] failed to update payment intent metadata', err);
    }
  }

  // Wait for any queued emails (failures already logged)
  await Promise.allSettled(emailPromises);

  return res.status(201).json({ orders: createdOrders });
});

async function sendOrderConfirmationEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shop: { select: { name: true } },
      buyer: { select: { email: true, name: true } },
      items: {
        select: {
          product: { select: { title: true } },
          priceCents: true,
          quantity: true,
        },
      },
    },
  });

  if (!order || !order.buyer?.email) return;
  if (order.confirmationNotifiedAt) return;

  const currency = order.currency?.toUpperCase() ?? 'EUR';
  const formatMoney = (value: number | null | undefined) => `${((value ?? 0) / 100).toFixed(2)} ${currency}`;
  const email = renderOrderConfirmedEmail({
    orderId: order.id,
    buyerName: order.buyer.name,
    shopName: order.shop?.name,
    items: order.items.map((item) => ({
      title: item.product?.title ?? 'Product',
      quantity: item.quantity,
      price: formatMoney(item.priceCents),
    })),
    total: formatMoney(order.totalCents),
  });

  await enqueueEmail({
    to: order.buyer.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { confirmationNotifiedAt: new Date() },
  });
}

export default router;
