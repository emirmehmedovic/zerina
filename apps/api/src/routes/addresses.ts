import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/v1/addresses — list current user's addresses
router.get('/', requireAuth, async (req, res) => {
  const userId = (req as any).user?.sub as string | undefined;
  if (!userId) return res.status(401).json({ error: 'unauthenticated' });
  const items = await prisma.address.findMany({ where: { userId }, orderBy: { id: 'desc' } });
  res.json({ items });
});

// POST /api/v1/addresses — create new address for current user
router.post('/', requireAuth, async (req, res) => {
  const userId = (req as any).user?.sub as string | undefined;
  if (!userId) return res.status(401).json({ error: 'unauthenticated' });
  const schema = z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
    isDefault: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  const created = await prisma.address.create({ data: { userId, ...parsed.data } });
  res.status(201).json(created);
});

// DELETE /api/v1/addresses/:id — delete address belonging to current user
router.delete('/:id', requireAuth, async (req, res) => {
  const userId = (req as any).user?.sub as string | undefined;
  if (!userId) return res.status(401).json({ error: 'unauthenticated' });
  const { id } = req.params;
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== userId) return res.status(404).json({ error: 'not_found' });
  await prisma.address.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
