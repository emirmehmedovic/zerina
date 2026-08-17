import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe';
import { ENV } from '../env';
import { prisma } from '../prisma';
import { PaymentStatus } from '@prisma/client';
import { notifyOrderPaid } from '../lib/notifications';

const toJson = (payload: unknown) => JSON.parse(JSON.stringify(payload ?? null));

const extractLatestChargeId = (paymentIntent: Stripe.PaymentIntent) => {
  const latest = paymentIntent.latest_charge;
  if (!latest) return null;
  if (typeof latest === 'string') return latest;
  return typeof latest === 'object' && 'id' in latest ? String(latest.id) : null;
};

export async function stripeWebhookHandler(req: Request, res: Response) {
  if (!ENV.stripeWebhookSecret) {
    console.error('[stripe-webhook] missing STRIPE_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'stripe_webhook_unconfigured' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    console.warn('[stripe-webhook] missing signature');
    return res.sendStatus(400);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, ENV.stripeWebhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error';
    console.error('[stripe-webhook] signature verification failed', message);
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      default:
        // Unhandled event types are fine; Stripe only needs a 2xx response
        break;
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error', err);
    return res.status(500).json({ error: 'webhook_handler_failed' });
  }

  return res.json({ received: true });
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;
  const paymentIntentId = paymentIntent.id;
  const amountReceived = paymentIntent.amount_received ?? paymentIntent.amount ?? 0;
  const applicationFee = paymentIntent.application_fee_amount ?? 0;
  const transferAmount = paymentIntent.transfer_data?.amount ?? amountReceived;
  const transferGroup = paymentIntent.transfer_group ?? null;
  const currency = paymentIntent.currency;

  if (!orderId) {
    console.warn('[stripe-webhook] payment_intent.succeeded without orderId metadata', paymentIntentId);
  }

  const data = {
    provider: 'stripe',
    providerChargeId: extractLatestChargeId(paymentIntent),
    status: PaymentStatus.SUCCEEDED,
    amountCents: amountReceived,
    applicationFeeCents: applicationFee,
    transferAmountCents: transferAmount ?? 0,
    netAmountCents: amountReceived - applicationFee,
    currency,
    clientSecret: paymentIntent.client_secret ?? null,
    transferGroup,
    rawPayload: toJson(paymentIntent),
  } as const;

  const existing = await prisma.payment.findUnique({
    where: { providerPaymentIntentId: paymentIntentId },
  });

  if (existing) {
    await prisma.payment.update({
      where: { providerPaymentIntentId: paymentIntentId },
      data,
    });
  } else if (orderId) {
    await prisma.payment.create({
      data: {
        orderId,
        providerPaymentIntentId: paymentIntentId,
        ...data,
      },
    });
  }

  if (orderId) {
    await prisma.order.updateMany({
      where: { id: orderId, status: { in: ['PENDING_PAYMENT', 'PROCESSING'] } },
      data: { status: 'PROCESSING', updatedAt: new Date() },
    });

    // Notify vendor of payment received
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        totalCents: true,
        currency: true,
        shop: { select: { ownerId: true } },
      },
    });
    if (order?.shop?.ownerId) {
      notifyOrderPaid({
        vendorUserId: order.shop.ownerId,
        orderId: order.id,
        orderNumber: order.id.slice(-8).toUpperCase(),
        totalCents: order.totalCents,
        currency: order.currency,
      }).catch((err) => console.error('[stripe-webhook] Failed to notify vendor:', err));
    }
  }

  // Create transfers to vendor connected accounts
  await createVendorTransfers(paymentIntent);
}

/**
 * Create Stripe transfers to each vendor's connected account
 * Platform fee is retained, rest goes to vendor
 */
async function createVendorTransfers(paymentIntent: Stripe.PaymentIntent) {
  const transferGroup = paymentIntent.transfer_group;
  const currency = paymentIntent.currency;
  const shopSummaryRaw = paymentIntent.metadata?.shopSummary;

  if (!transferGroup || !shopSummaryRaw) {
    console.warn('[stripe-webhook] missing transferGroup or shopSummary for transfers');
    return;
  }

  let shopSummaries: Array<{
    shopId: string;
    amountCents: number;
    platformFeeCents: number;
    transferAmountCents: number;
  }>;

  try {
    shopSummaries = JSON.parse(shopSummaryRaw);
  } catch {
    console.error('[stripe-webhook] failed to parse shopSummary metadata');
    return;
  }

  for (const summary of shopSummaries) {
    const { shopId, transferAmountCents } = summary;

    if (transferAmountCents <= 0) {
      console.log(`[stripe-webhook] skipping transfer for shop ${shopId} - zero amount`);
      continue;
    }

    // Get shop's connected Stripe account
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true, stripeAccountId: true, stripeChargesEnabled: true },
    });

    if (!shop?.stripeAccountId) {
      console.warn(`[stripe-webhook] shop ${shopId} has no connected Stripe account, skipping transfer`);
      continue;
    }

    if (!shop.stripeChargesEnabled) {
      console.warn(`[stripe-webhook] shop ${shopId} Stripe account not fully enabled, skipping transfer`);
      continue;
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: transferAmountCents,
        currency,
        destination: shop.stripeAccountId,
        transfer_group: transferGroup,
        metadata: {
          shopId,
          shopName: shop.name,
          paymentIntentId: paymentIntent.id,
        },
      });

      console.log(`[stripe-webhook] created transfer ${transfer.id} to shop ${shopId} for ${transferAmountCents} ${currency}`);
    } catch (err) {
      console.error(`[stripe-webhook] failed to create transfer for shop ${shopId}:`, err);
      // Don't throw - we don't want to fail the webhook for one failed transfer
      // In production, you'd want to queue this for retry
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;
  const update: Record<string, unknown> = {
    status: PaymentStatus.FAILED,
    rawPayload: toJson(paymentIntent),
  };

  await prisma.payment.updateMany({
    where: { providerPaymentIntentId: paymentIntentId },
    data: update,
  });
}

async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.id) return;
  const data = {
    stripeDetailsSubmitted: Boolean(account.details_submitted),
    stripeChargesEnabled: Boolean(account.charges_enabled),
    stripePayoutsEnabled: Boolean(account.payouts_enabled),
    stripeDefaultCurrency: account.default_currency ?? null,
  } as const;

  if (data.stripeDetailsSubmitted) {
    (data as Record<string, unknown>).stripeOnboardedAt = new Date();
  }

  await prisma.shop.updateMany({
    where: { stripeAccountId: account.id },
    data: data as Record<string, unknown>,
  });
}

export default stripeWebhookHandler;
