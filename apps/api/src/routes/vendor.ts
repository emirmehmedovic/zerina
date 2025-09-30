import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';
import { badRequest, notFound } from '../utils/errors';
import { validateQuery } from '../utils/validate';

const router = Router();

// GET /api/v1/vendor/overview — stats for the current vendor's shop
router.get('/overview', requireAuth, async (req, res) => {
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
router.get('/products', requireAuth, validateQuery(vendorProductsQuerySchema), async (req, res) => {
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
router.get('/analytics/customer-insights', requireAuth, async (req, res) => {
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
router.get('/orders', requireAuth, validateQuery(vendorOrdersQuerySchema), async (req, res) => {
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
        items: { select: { id: true, productId: true, variantId: true, quantity: true, priceCents: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);
  res.json({ items, total });
});

// PATCH /api/v1/vendor/orders/:id/status — update order status (owner shop only)
router.patch('/orders/:id/status', requireAuth, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id } = req.params;
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.status(403).json({ error: 'forbidden' });
  const order = await prisma.order.findUnique({ where: { id }, select: { id: true, shopId: true } });
  if (!order || order.shopId !== shop.id) return res.status(404).json({ error: 'not_found' });
  const schema = z.object({ status: z.enum(['PROCESSING','SHIPPED','DELIVERED','CANCELLED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  const updated = await prisma.order.update({ where: { id }, data: { status: parsed.data.status }, select: { id: true, status: true } });
  res.json(updated);
});

// GET /api/v1/vendor/analytics/sales?days=30 — sales totals per day and top products
router.get('/analytics/sales', requireAuth, async (req, res) => {
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
    const daySum = o.items.reduce((s, it) => s + it.priceCents * it.quantity, 0);
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
    .map((id) => ({ id, title: products.find((p) => p.id === id)?.title || id, slug: products.find((p) => p.id === id)?.slug || '', qty: productTotals.get(id)!.qty, revenueCents: productTotals.get(id)!.revenueCents }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 10);
  const series = Array.from(seriesMap.entries()).map(([date, totalCents]) => ({ date, totalCents }));
  res.json({ days, series, topProducts });
});

// GET /api/v1/vendor/analytics/kpis?days=30 — overall KPIs for period
router.get('/analytics/kpis', requireAuth, async (req, res) => {
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
  const revenueCents = orders.reduce((s, o) => s + (o.totalCents || 0), 0);
  const ordersCount = orders.length;
  const items = orders.reduce((s, o) => s + o.items.reduce((a, it) => a + it.quantity, 0), 0);
  const avgOrderValueCents = ordersCount ? Math.round(revenueCents / ordersCount) : 0;
  res.json({ days, revenueCents, orders: ordersCount, items, avgOrderValueCents });
});

// GET /api/v1/vendor/analytics/top-products?limit=10&days=30 — top products by revenue
router.get('/analytics/top-products', requireAuth, async (req, res) => {
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
    .map((id) => ({ id, title: products.find((p) => p.id === id)?.title || id, slug: products.find((p) => p.id === id)?.slug || '', qty: totals.get(id)!.qty, revenueCents: totals.get(id)!.revenueCents }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, limit);
  res.json({ items });
});

// GET /api/v1/vendor/analytics/top-customers?limit=10&days=30 — top customers by revenue (buyerId only)
router.get('/analytics/top-customers', requireAuth, async (req, res) => {
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
router.get('/analytics/product/:productId', requireAuth, async (req, res) => {
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
router.get('/analytics/seasonal', requireAuth, async (req, res) => {
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
    monthEntry.items += order.items.reduce((sum, item) => sum + item.quantity, 0);
    monthEntry.revenueCents += order.totalCents;
    monthlyData.set(month, monthEntry);
    
    // Weekday aggregation
    const weekdayEntry = weekdayData.get(weekday)!;
    weekdayEntry.orders += 1;
    weekdayEntry.items += order.items.reduce((sum, item) => sum + item.quantity, 0);
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
router.get('/analytics/projections', requireAuth, async (req, res) => {
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
    entry.items += order.items.reduce((sum, item) => sum + item.quantity, 0);
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
    
    const firstAvg = firstPeriod.reduce((sum, day) => sum + day.revenueCents, 0) / firstPeriod.length;
    const secondAvg = secondPeriod.reduce((sum, day) => sum + day.revenueCents, 0) / secondPeriod.length;
    
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
router.get('/analytics/status-counts', requireAuth, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true } });
  if (!shop) return res.json({ counts: {} });
  const statuses = ['PENDING_PAYMENT','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED'] as const;
  const results = await Promise.all(statuses.map(async (s) => [s, await prisma.order.count({ where: { shopId: shop.id, status: s as any } })] as const));
  const counts = Object.fromEntries(results);
  res.json({ counts });
});

// GET /api/v1/vendor/inventory/low-stock?threshold=5&take=10 — low stock products for vendor's shop
router.get('/inventory/low-stock', requireAuth, async (req, res) => {
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
