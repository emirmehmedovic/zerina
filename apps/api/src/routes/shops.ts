import { Router } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { badRequest, forbidden, notFound } from '../utils/errors';

const router = Router();

function slugify(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function uniqueSlug(base: string) {
  let slug = slugify(base);
  let i = 0;
  while (true) {
    const exists = await prisma.shop.findUnique({ where: { slug } });
    if (!exists) return slug;
    i += 1;
    slug = `${slug}-${i}`;
  }
}

// POST /api/v1/shops — create shop (VENDOR only, one shop per user)
router.post('/', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const schema = z.object({ name: z.string().min(3).max(100), description: z.string().max(2000).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });

  const existing = await prisma.shop.findUnique({ where: { ownerId: user.sub } });
  if (existing) return res.status(409).json({ error: 'shop_exists' });

  const slug = await uniqueSlug(parsed.data.name);
  const shop = await prisma.shop.create({
    data: {
      ownerId: user.sub,
      name: parsed.data.name,
      description: parsed.data.description,
      slug,
    },
    select: { id: true, name: true, slug: true, description: true, status: true },
  });
  res.status(201).json(shop);
});

// PATCH /api/v1/shops/:id — update name/description (owner only)
router.patch('/:id', requireAuth, requireRole('VENDOR', 'ADMIN'), async (req, res) => {
  const user = (req as any).user as { sub: string; role: 'BUYER' | 'VENDOR' | 'ADMIN' };
  const { id } = req.params;
  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop) return res.status(404).json({ error: 'not_found' });
  if (user.role !== 'ADMIN' && shop.ownerId !== user.sub) return res.status(403).json({ error: 'forbidden' });

  const schema = z.object({ name: z.string().min(3).max(100).optional(), description: z.string().max(2000).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });

  const data: any = {};
  if (parsed.data.name && parsed.data.name !== shop.name) {
    data.name = parsed.data.name;
    data.slug = await uniqueSlug(parsed.data.name);
  }
  if (parsed.data.description !== undefined) data.description = parsed.data.description;

  const updated = await prisma.shop.update({ where: { id }, data, select: { id: true, name: true, slug: true, description: true, status: true } });
  res.json(updated);
});

// GET /api/v1/shops/mine — retrieve current user's shop
router.get('/mine', requireAuth, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.sub }, select: { id: true, name: true, slug: true, description: true, status: true } });
  if (!shop) return res.status(404).json({ error: 'not_found' });
  res.json(shop);
});

// GET /api/v1/shops — admin list with optional status filter
router.get('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const querySchema = z.object({
    status: z.enum(['PENDING_APPROVAL','ACTIVE','SUSPENDED','CLOSED']).optional(),
    take: z.string().transform((v)=> Number(v||'50')).optional(),
    skip: z.string().transform((v)=> Number(v||'0')).optional(),
  });
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return badRequest(res, parsed.error.flatten());
  const { status, take = 50, skip = 0 } = parsed.data as any;
  const where: any = {};
  if (status) where.status = status;
  const [items, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(100, Number(take) || 50)),
      skip: Math.max(0, Number(skip) || 0),
      select: { id: true, name: true, slug: true, description: true, status: true, ownerId: true },
    }),
    prisma.shop.count({ where }),
  ]);
  res.json({ items, total });
});

// PATCH /api/v1/shops/:id/status — admin status update
router.patch('/:id/status', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const schema = z.object({ status: z.enum(['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'CLOSED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop) return res.status(404).json({ error: 'not_found' });
  const updated = await prisma.shop.update({ where: { id }, data: { status: parsed.data.status }, select: { id: true, name: true, slug: true, status: true } });
  res.json(updated);
});

// GET /api/v1/shops/id/:id — admin shop detail by ID
router.get('/id/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const shop = await prisma.shop.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      ownerId: true,
      products: {
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          title: true,
          slug: true,
          priceCents: true,
          currency: true,
          stock: true,
          status: true,
          images: { orderBy: { position: 'asc' }, take: 1, select: { storageKey: true } },
          createdAt: true,
        },
      },
      _count: { select: { products: true } },
    },
  });
  if (!shop) return res.status(404).json({ error: 'not_found' });
  res.json(shop);
});

// GET /api/v1/shops/:slug — public shop by slug with a few latest products
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      products: {
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          slug: true,
          priceCents: true,
          currency: true,
          images: { orderBy: { position: 'asc' }, take: 1, select: { storageKey: true } },
        },
      },
    },
  });
  if (!shop) return res.status(404).json({ error: 'not_found' });
  res.json(shop);
});

export default router;
