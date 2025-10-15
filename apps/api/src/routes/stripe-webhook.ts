import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe';
import { ENV } from '../env';
import { prisma } from '../prisma';
import { PaymentStatus } from '@prisma/client';

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
    currency: paymentIntent.currency,
    clientSecret: paymentIntent.client_secret ?? null,
    transferGroup: paymentIntent.transfer_group ?? null,
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
