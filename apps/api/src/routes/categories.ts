import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const items = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
  res.json({ items });
});

function slugifyName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
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
