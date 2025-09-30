import { Router } from 'express';
import { requireRole } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();
router.use(requireRole('ADMIN'));

// GET /api/v1/admin/analytics-v2/shops
router.get('/shops', async (req, res) => {
  const { q, take = 10, skip = 0, sortBy = 'revenue', sortDir = 'desc' } = req.query;

  const where: any = {};
  if (q) {
    where.name = { contains: q as string, mode: 'insensitive' };
  }

  const shops = await prisma.shop.findMany({
    where,
    take: Number(take),
    skip: Number(skip),
    include: {
      _count: {
        select: { products: true, orders: true },
      },
    },
  });

  const shopIds = shops.map((s: { id: string }) => s.id);

  const revenueByShop = await prisma.order.groupBy({
    by: ['shopId'],
    where: { shopId: { in: shopIds }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    _sum: { totalCents: true },
  });

  const revenueMap = new Map(revenueByShop.map((r: { shopId: string; _sum: { totalCents: number | null } }) => [r.shopId, r._sum.totalCents || 0]));

  const results = shops.map((s: { id: string; _count: { orders: number; products: number; }; name: string; }) => ({
    ...s,
    revenue: revenueMap.get(s.id) || 0,
    orderCount: s._count.orders,
    productCount: s._count.products,
  }));

  // Manual sort because Prisma can't sort by aggregated relations directly yet
  results.sort((a: { revenue: number; orderCount: number; productCount: number; name: string; }, b: { revenue: number; orderCount: number; productCount: number; name: string; }) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'revenue') return (a.revenue - b.revenue) * dir;
    if (sortBy === 'orders') return (a.orderCount - b.orderCount) * dir;
    if (sortBy === 'products') return (a.productCount - b.productCount) * dir;
    return a.name.localeCompare(b.name) * dir;
  });
  
  const total = await prisma.shop.count({ where });

  res.json({ items: results, total });
});

export default router;
