import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  qty: z.number().int().positive(),
});

// Shared validator
async function validateItems(items: Array<{ productId: string; variantId?: string; qty: number }>) {
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
      const variant = product.variants.find((v) => v.id === it.variantId);
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
  return { items: results, totalCents, currency: results[0]?.currency || 'EUR' };
}

// POST /api/v1/checkout/validate — validate cart and return normalized items + totals
router.post('/validate', async (req, res) => {
  const schema = z.object({ items: z.array(cartItemSchema).min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  try {
    const result = await validateItems(parsed.data.items);
    return res.json(result);
  } catch (e: any) {
    if (e && e.error) return res.status(400).json(e);
    return res.status(500).json({ error: 'server_error' });
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
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });

  // Validate items locally
  let validateRes: Awaited<ReturnType<typeof validateItems>>;
  try {
    validateRes = await validateItems(parsed.data.items);
  } catch (e: any) {
    return res.status(400).json(e);
  }

  // Group by shop for multi-vendor (MVP: create one order per shop)
  const items = validateRes.items as Array<{ productId: string; variantId?: string; priceCents: number; qty: number; shopId: string }>;
  const byShop = new Map<string, typeof items>();
  for (const it of items) {
    const list = byShop.get(it.shopId) || [];
    list.push(it);
    byShop.set(it.shopId, list);
  }

  const createdOrders = [] as any[];
  for (const [shopId, list] of byShop.entries()) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return res.status(400).json({ error: 'invalid_shop' });

    const shippingAddress = await prisma.address.create({ data: { userId: user.sub, ...parsed.data.shipping } });
    const billingAddress = await prisma.address.create({ data: { userId: user.sub, ...parsed.data.billing } });

    const totalCents = list.reduce((sum, it) => sum + it.priceCents * it.qty, 0);

    const order = await prisma.order.create({
      data: {
        buyerId: user.sub,
        shopId,
        totalCents,
        currency: validateRes.currency,
        status: 'PENDING_PAYMENT',
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress.id,
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
  }

  return res.status(201).json({ orders: createdOrders });
});

export default router;
