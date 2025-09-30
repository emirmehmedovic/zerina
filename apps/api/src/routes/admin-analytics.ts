import { Router } from 'express';
import { requireRole } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();

// Middleware to ensure only admins can access these routes
router.use(requireRole('ADMIN'));

// GET /api/v1/admin/analytics/kpis
router.get('/kpis', async (req, res) => {
  const days = Number(req.query.days) || 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const totalRevenue = await prisma.order.aggregate({
    _sum: { totalCents: true },
    where: { status: { notIn: ['CANCELLED', 'REFUNDED'] }, createdAt: { gte: since } },
  });

  const totalOrders = await prisma.order.count({
    where: { createdAt: { gte: since } },
  });

  const activeShops = await prisma.shop.count({
    where: { status: 'ACTIVE' },
  });

  const totalProducts = await prisma.product.count();

  res.json({
    totalRevenueCents: totalRevenue._sum.totalCents || 0,
    totalOrders,
    activeShops,
    totalProducts,
  });
});

// GET /api/v1/admin/analytics/sales-over-time
router.get('/sales-over-time', async (req, res) => {
  const days = Number(req.query.days) || 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const sales = await prisma.order.groupBy({
    by: ['createdAt'],
    _sum: { totalCents: true },
    where: { status: { notIn: ['CANCELLED', 'REFUNDED'] }, createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' },
  });

  // This is a simplified aggregation. For a real-world scenario, you'd group by day.
    const dailyData = sales.reduce((acc: Record<string, number>, { createdAt, _sum }: { createdAt: Date; _sum: { totalCents: number | null } }) => {
    const date = createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + (_sum.totalCents || 0);
    return acc;
  }, {});

  const series = Object.entries(dailyData).map(([date, totalCents]) => ({ date, totalCents }));

  res.json(series);
});

// GET /api/v1/admin/analytics/top-performers
router.get('/top-performers', async (req, res) => {
  const days = Number(req.query.days) || 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { priceCents: true },
    _count: { quantity: true },
    where: { order: { createdAt: { gte: since } } },
    orderBy: { _sum: { priceCents: 'desc' } },
    take: 5,
  });

  const topShops = await prisma.order.groupBy({
    by: ['shopId'],
    _sum: { totalCents: true },
    where: { createdAt: { gte: since } },
    orderBy: { _sum: { totalCents: 'desc' } },
    take: 5,
  });

  res.json({ topProducts, topShops });
});

// GET /api/v1/admin/analytics/geo-sales
router.get('/geo-sales', async (req, res) => {
  const days = Number(req.query.days) || 90;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, shippingAddress: { isNot: null } },
    select: { shippingAddress: true },
  });

  const geo = new Map<string, number>();
  for (const order of orders) {
    const country = order.shippingAddress?.country;
    if (country) {
      geo.set(country, (geo.get(country) || 0) + 1);
    }
  }

  res.json(Array.from(geo.entries()).map(([country, orders]) => ({ country, orders })));
});

export default router;
