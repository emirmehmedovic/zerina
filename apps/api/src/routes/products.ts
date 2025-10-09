import { Router } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { badRequest, notFound } from '../utils/errors';
import { validateQuery } from '../utils/validate';

const router = Router();

function slugify(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function uniqueProductSlug(shopId: string, base: string) {
  let slug = slugify(base);
  let i = 0;
  while (true) {
    const exists = await prisma.product.findFirst({ where: { shopId, slug } });
    if (!exists) return slug;
    i += 1;
    slug = `${slug}-${i}`;
  }
}

// GET /api/v1/products - public list with basic filters
const productsPublicQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(['DRAFT','PUBLISHED','ARCHIVED','SUSPENDED']).optional(),
  take: z.string().transform((v) => Number(v || '20')).optional(),
  skip: z.string().transform((v) => Number(v || '0')).optional(),
  categoryId: z.string().optional(),
  categoryIds: z.string().optional(),
  onSale: z.string().optional(),
  latest: z.string().optional(),
  noCount: z.string().optional(),
});

router.get('/', validateQuery(productsPublicQuerySchema), async (req, res) => {
  const { q, status, take = 20, skip = 0, categoryId, categoryIds, onSale, latest, noCount } = (req as any).validated as any;
  const where: any = {};
  if (q) where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { description: { contains: q, mode: 'insensitive' } },
  ];
  if (status) where.status = status as any;
  
  // Filter for products on sale
  if (onSale === 'true' || onSale === '1') {
    where.isOnSale = true;
  }
  
  // Category filtering
  let catIds: string[] = [];
  if (categoryIds) catIds = categoryIds.split(',').map((s: string) => s.trim()).filter(Boolean);
  else if (categoryId) catIds = [categoryId];
  if (catIds.length > 0) {
    where.categories = { some: { categoryId: { in: catIds } } };
  }
  
  // Determine order by
  let orderBy: any = { createdAt: 'desc' };
  if (latest === 'true' || latest === '1') {
    orderBy = { createdAt: 'desc' };
  }
  
  const promises: any[] = [
    prisma.product.findMany({
      where,
      orderBy,
      take: Math.max(1, Math.min(100, Number(take) || 20)),
      skip: Math.max(0, Number(skip) || 0),
      select: {
        id: true,
        title: true,
        slug: true,
        priceCents: true,
        originalPriceCents: true,
        discountPercent: true,
        isOnSale: true,
        currency: true,
        shop: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { position: 'asc' }, take: 1 },
      },
    })
  ];
  const skipCount = (noCount === '1' || noCount === 'true');
  if (!skipCount) promises.push(prisma.product.count({ where }));
  const results = await Promise.all(promises);
  const items = results[0];
  const total = skipCount ? undefined : results[1];
  res.json({ items, total });
});

// GET /api/v1/products/admin/list - admin list with more filters
const productsAdminQuerySchema = z.object({
  status: z.enum(['DRAFT','PUBLISHED','ARCHIVED','SUSPENDED']).optional(),
  shopId: z.string().optional(),
  q: z.string().optional(),
  lowStock: z.string().optional(),
  lowStockThreshold: z.string().optional(),
  take: z.string().transform((v)=> Number(v||'50')).optional(),
  skip: z.string().transform((v)=> Number(v||'0')).optional(),
});

router.get('/admin/list', requireAuth, requireRole('ADMIN'), validateQuery(productsAdminQuerySchema), async (req, res) => {
  const { status, shopId, q, lowStock, lowStockThreshold = '5', take = 50, skip = 0 } = (req as any).validated as any;
  const where: any = {};
  if (status) where.status = status as any;
  if (shopId) where.shopId = shopId;
  if (q) where.title = { contains: q, mode: 'insensitive' };
  if (lowStock) {
    const thr = Number(lowStockThreshold) || 5;
    where.stock = { lt: thr };
  }
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(100, Number(take) || 50)),
      skip: Math.max(0, Number(skip) || 0),
      select: {
        id: true,
        title: true,
        slug: true,
        priceCents: true,
        currency: true,
        stock: true,
        status: true,
        shop: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { position: 'asc' }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);
  res.json({ items, total });
});

// GET /api/v1/products/vendor/list - vendor list for their own products
const productsVendorQuerySchema = z.object({
  status: z.enum(['DRAFT','PUBLISHED','ARCHIVED','SUSPENDED']).optional(),
  q: z.string().optional(),
  lowStock: z.string().optional(),
  lowStockThreshold: z.string().optional(),
  take: z.string().transform((v)=> Number(v||'50')).optional(),
  skip: z.string().transform((v)=> Number(v||'0')).optional(),
  archived: z.string().optional(),
});

router.get('/vendor/list', requireAuth, requireRole('VENDOR'), validateQuery(productsVendorQuerySchema), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { status, q, lowStock, lowStockThreshold = '5', take = 50, skip = 0, archived = '' } = (req as any).validated as any;
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return notFound(res, 'shop_not_found');
  const where: any = { shopId: shop.id };
  if (archived === 'true' || archived === '1') {
    where.archived = true;
  } else if (archived !== 'only') {
    where.archived = false;
    if (status) where.status = status as any;
  }
  if (q) where.title = { contains: q, mode: 'insensitive' };
  if (lowStock) {
    const thr = Number(lowStockThreshold) || 5;
    where.stock = { lt: thr };
  }
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(100, Number(take) || 50)),
      skip: Math.max(0, Number(skip) || 0),
      select: {
        id: true,
        title: true,
        slug: true,
        priceCents: true,
        currency: true,
        stock: true,
        status: true,
        createdAt: true,
        images: { orderBy: { position: 'asc' }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);
  res.json({ items, total });
});

// GET /api/v1/products/slug/:slug - deprecated, kept for compatibility
router.get('/slug/:slug', async (req, res) => {
  const { slug } = req.params;
  const product = await prisma.product.findFirst({
    where: { slug },
    include: {
      images: { orderBy: { position: 'asc' } },
      categories: { include: { category: true } },
      variants: true,
    },
  });
  res.json(product);
});

// GET /api/v1/products/:slug - direct slug lookup
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  
  // Check if the slug is a valid ID (for backward compatibility)
  if (slug.length === 25 && slug.includes('_')) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: slug },
        include: {
          images: { orderBy: { position: 'asc' } },
          categories: { include: { category: true } },
          variants: true,
        },
      });
      if (product) return res.json(product);
    } catch {}
  }
  
  // Otherwise look up by slug
  const product = await prisma.product.findFirst({
    where: { slug },
    include: {
      images: { orderBy: { position: 'asc' } },
      categories: { include: { category: true } },
      variants: true,
    },
  });
  
  if (!product) return notFound(res, 'Product not found');
  res.json(product);
});

// GET /api/v1/products/id/:id - get by ID
router.get('/id/:id', async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: 'asc' } },
      categories: { include: { category: true } },
      variants: true,
    },
  });
  if (!product) return notFound(res, 'Product not found');
  res.json(product);
});

// POST /api/v1/products - create a product
router.post('/', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return notFound(res, 'shop_not_found');
  const schema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().optional(),
    priceCents: z.number().int().min(0),
    currency: z.string().min(1).max(3),
    stock: z.number().int().min(0).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
    categoryIds: z.array(z.string()).optional(),
    imagePaths: z.array(z.string()).optional(), // Add support for image paths
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', code: 'INVALID_BODY', details: parsed.error.flatten() });
  const { title, description, priceCents, currency, stock = 0, status = 'DRAFT', categoryIds = [], imagePaths = [] } = parsed.data;
  const slug = await uniqueProductSlug(shop.id, title);
  const product = await prisma.product.create({
    data: {
      title,
      description: description ?? '',
      priceCents,
      currency,
      stock,
      status,
      slug,
      shopId: shop.id,
      categories: {
        create: categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
  });
  
  // Add images if provided
  if (imagePaths.length > 0) {
    const images = [];
    for (let i = 0; i < imagePaths.length; i++) {
      const path = imagePaths[i];
      // Extract storage key from full URL
      let storageKey;
      if (path.includes('/uploads/')) {
        // Format: http://localhost:4000/uploads/image.jpg ili /uploads/image.jpg
        const parts = path.split('/uploads/');
        storageKey = parts[parts.length - 1];
      } else if (path.startsWith('http')) {
        // Format: http://localhost:4000/image.jpg
        const url = new URL(path);
        storageKey = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
      } else {
        // Format: image.jpg ili /image.jpg
        storageKey = path.startsWith('/') ? path.substring(1) : path;
      }
      if (!storageKey) continue;
      
      try {
        const image = await prisma.productImage.create({
          data: {
            productId: product.id,
            storageKey: storageKey,
            position: i,
          },
        });
        images.push(image);
      } catch (err) {
        console.error('Failed to create product image:', err);
      }
    }
    
    // Return product with images
    return res.json({ ...product, images });
  }
  
  res.json(product);
});

// PATCH /api/v1/products/:id - update a product
router.patch('/:id', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id } = req.params;
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) return res.status(404).json({ error: 'Product not found or not owned by you' });
  const schema = z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    priceCents: z.number().int().min(0).optional(),
    currency: z.string().min(1).max(3).optional(),
    stock: z.number().int().min(0).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
    archived: z.boolean().optional(),
    categoryIds: z.array(z.string()).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const { title, description, priceCents, currency, stock, status, archived, categoryIds } = parsed.data;
  const data: any = {};
  if (title !== undefined) {
    data.title = title;
    data.slug = await uniqueProductSlug(shop.id, title);
  }
  if (description !== undefined) data.description = description;
  if (priceCents !== undefined) data.priceCents = priceCents;
  if (currency !== undefined) data.currency = currency;
  if (stock !== undefined) data.stock = stock;
  if (status !== undefined) data.status = status;
  if (archived !== undefined) data.archived = archived;
  const updated = await prisma.product.update({
    where: { id },
    data,
  });
  if (categoryIds) {
    await prisma.productCategory.deleteMany({ where: { productId: id } });
    await prisma.productCategory.createMany({
      data: categoryIds.map((categoryId) => ({ productId: id, categoryId })),
    });
  }
  res.json(updated);
});

// DELETE /api/v1/products/:id - delete a product
router.delete('/:id', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id } = req.params;
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) return res.status(404).json({ error: 'Product not found or not owned by you' });
  
  try {
    // First delete all related records to avoid foreign key constraint violations
    await prisma.$transaction([
      // Delete product-category relationships
      prisma.productCategory.deleteMany({ where: { productId: id } }),
      
      // Delete product variants
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      
      // Delete product images
      prisma.productImage.deleteMany({ where: { productId: id } }),
      
      // Finally delete the product itself
      prisma.product.delete({ where: { id } })
    ]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
