import { Router } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Utils
function slugify(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function uniqueSlug(base: string) {
  let slug = slugify(base);
  let i = 0;
  while (true) {
    const exists = await prisma.blogPost.findUnique({ where: { slug } });
    if (!exists) return slug;
    i += 1;
    slug = `${slug}-${i}`;
  }
}

// Schemas
const PostCreateSchema = z.object({
  title: z.string().min(3).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1), // markdown
  coverImageStorageKey: z.string().min(1).optional().nullable(),
  tags: z.array(z.string().min(1).max(32)).max(10).optional().default([]),
  shopId: z.string().optional().nullable(),
  status: z.enum(['DRAFT','PUBLISHED']).optional().default('DRAFT'),
  publishedAt: z.string().datetime().optional().nullable(),
});

const PostUpdateSchema = PostCreateSchema.partial().extend({
  title: z.string().min(3).max(200).optional(),
});

// Public: list
// GET /api/v1/blog?take&skip&authorId&shopSlug&tag&status
router.get('/', async (req, res) => {
  const take = Math.min(Number(req.query.take) || 10, 50);
  const skip = Number(req.query.skip) || 0;
  const authorId = typeof req.query.authorId === 'string' ? req.query.authorId : undefined;
  const shopSlug = typeof req.query.shopSlug === 'string' ? req.query.shopSlug : undefined;
  const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : 'PUBLISHED';

  const where: any = {};
  if (status) where.status = status;
  if (authorId) where.authorId = authorId;
  if (tag) where.tags = { has: tag };
  if (shopSlug) {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug }, select: { id: true } });
    if (!shop) return res.json({ items: [], total: 0 });
    where.shopId = shop.id;
  }

  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take,
      skip,
      select: {
        id: true, title: true, slug: true, excerpt: true, coverImageStorageKey: true,
        status: true, tags: true, publishedAt: true, createdAt: true,
        author: { select: { id: true, name: true } },
        shop: { select: { id: true, name: true, slug: true } },
      }
    }),
    prisma.blogPost.count({ where })
  ]);

  return res.json({ items, total });
});

// Public: detail by slug
router.get('/:slug', async (req, res) => {
  const slug = req.params.slug;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: {
      id: true, title: true, slug: true, excerpt: true, content: true,
      coverImageStorageKey: true, status: true, tags: true, publishedAt: true, createdAt: true,
      author: { select: { id: true, name: true } },
      shop: { select: { id: true, name: true, slug: true } },
    }
  });
  if (!post) return res.status(404).json({ error: 'not_found' });
  if (post.status !== 'PUBLISHED') return res.status(403).json({ error: 'forbidden' });
  return res.json(post);
});

// Vendor: get own post by id (includes drafts)
router.get('/id/:id', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const id = req.params.id;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: {
      id: true, title: true, slug: true, excerpt: true, content: true,
      coverImageStorageKey: true, status: true, tags: true, publishedAt: true, createdAt: true,
      authorId: true,
      shop: { select: { id: true, name: true, slug: true } },
    }
  });
  if (!post || post.authorId !== user.sub) return res.status(404).json({ error: 'not_found' });
  return res.json(post);
});

// Vendor: create
router.post('/', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const parsed = PostCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });

  const slug = await uniqueSlug(parsed.data.title);
  const data: any = {
    title: parsed.data.title,
    slug,
    excerpt: parsed.data.excerpt ?? null,
    content: parsed.data.content,
    coverImageStorageKey: parsed.data.coverImageStorageKey ?? null,
    status: parsed.data.status ?? 'DRAFT',
    tags: parsed.data.tags ?? [],
    publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : null,
    authorId: user.sub,
    shopId: parsed.data.shopId ?? null,
  };

  const created = await prisma.blogPost.create({ data, select: { id: true, slug: true } });
  return res.status(201).json(created);
});

// Vendor: update own post
router.patch('/:id', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const id = req.params.id;
  const existing = await prisma.blogPost.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing || existing.authorId !== user.sub) return res.status(404).json({ error: 'not_found' });

  const parsed = PostUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });

  const data: any = { ...parsed.data };
  if (data.title) {
    // Optional slug refresh when title changes (only if no custom slug support)
    const newSlug = await uniqueSlug(data.title);
    data.slug = newSlug;
  }
  if (typeof data.publishedAt === 'string') {
    data.publishedAt = new Date(data.publishedAt);
  }

  const updated = await prisma.blogPost.update({ where: { id }, data });
  return res.json({ id: updated.id, slug: updated.slug });
});

// Vendor: delete own post
router.delete('/:id', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const id = req.params.id;
  const existing = await prisma.blogPost.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing || existing.authorId !== user.sub) return res.status(404).json({ error: 'not_found' });
  await prisma.blogPost.delete({ where: { id } });
  return res.json({ ok: true });
});

export default router;
