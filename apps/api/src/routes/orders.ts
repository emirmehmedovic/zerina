import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/v1/orders/mine — list current user's orders with items and shop
router.get('/mine', requireAuth, async (req, res) => {
  const userId = (req as any).user?.sub as string | undefined;
  if (!userId) return res.status(401).json({ error: 'unauthenticated' });
  const items = await prisma.order.findMany({
    where: { buyerId: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      shopId: true,
      totalCents: true,
      currency: true,
      status: true,
      createdAt: true,
      shop: { select: { id: true, name: true, slug: true } },
      items: { select: { id: true, productId: true, variantId: true, priceCents: true, quantity: true } },
    },
  });
  res.json({ items });
});

export default router;
