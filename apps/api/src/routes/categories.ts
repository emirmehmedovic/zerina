import { Router } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res) => {
  const items = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
  res.json({ items });
});

// POST /api/v1/categories — create a category (ADMIN only)
router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const schema = z.object({ name: z.string().min(1).max(100) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  const { name } = parsed.data;
  try {
    const cat = await prisma.category.create({ data: { name } });
    return res.status(201).json(cat);
  } catch (err: any) {
    // If unique constraint exists on name
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'category_exists' });
    }
    console.error('Failed to create category:', err);
    return res.status(500).json({ error: 'failed_to_create_category' });
  }
});

function slugifyName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/v1/categories/:slug/products — list products for a given category slug
router.get('/:slug/products', async (req, res) => {
  const { slug } = req.params;
  const categories = await prisma.category.findMany();
  const category = categories.find((c: { name: string }) => slugifyName(c.name) === slug);
  if (!category) return res.json({ items: [], total: 0 });

  const { take = '20', skip = '0' } = req.query as Record<string, string>;
  const where = {
    categories: { some: { categoryId: category.id } },
    status: 'PUBLISHED' as const,
  };
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(take) || 20,
      skip: Number(skip) || 0,
      select: {
        id: true,
        title: true,
        slug: true,
        priceCents: true,
        currency: true,
        shopId: true,
        images: { orderBy: { position: 'asc' }, take: 1, select: { storageKey: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);
  res.json({ items, total, category: { id: category.id, name: category.name } });
});

export default router;
