import { Router } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { badRequest, notFound } from '../utils/errors';
import { validateQuery } from '../utils/validate';
import { badRequest as badReq } from '../utils/errors';

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
        variants: { select: { priceCents: true } },
      },
    })
  ];
  const skipCount = (noCount === '1' || noCount === 'true');
  if (!skipCount) promises.push(prisma.product.count({ where }));
  const results = await Promise.all(promises);
  const items = (results[0] as any[]).map((p) => {
    const variantPrices: number[] = Array.isArray(p?.variants) ? p.variants.map((v: any) => v.priceCents) : [];
    const hasVariants = variantPrices.length > 0;
    const minPriceCents = hasVariants ? Math.min(...variantPrices) : p.priceCents;
    const maxPriceCents = hasVariants ? Math.max(...variantPrices) : p.priceCents;
    const { variants, ...rest } = p;
    return { ...rest, hasVariants, minPriceCents, maxPriceCents };
  });
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
    variants: z.array(z.object({
      sku: z.string().optional(),
      priceCents: z.number().int().min(0),
      stock: z.number().int().min(0).default(0),
      attributes: z.record(z.string()).default({}),
    })).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body', code: 'INVALID_BODY', details: parsed.error.flatten() });
  const { title, description, priceCents, currency, stock = 0, status = 'DRAFT', categoryIds = [], imagePaths = [], variants = [] } = parsed.data;
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

  // Create variants if provided, else create a default variant mirroring the base fields
  try {
    if (Array.isArray(variants) && variants.length > 0) {
      await prisma.productVariant.createMany({
        data: variants.map(v => ({
          productId: product.id,
          sku: v.sku,
          priceCents: v.priceCents,
          stock: v.stock ?? 0,
          attributes: v.attributes || {},
        })),
      });
      // Derive product summary fields from variants
      const created = await prisma.productVariant.findMany({ where: { productId: product.id }, select: { priceCents: true, stock: true } });
      const minPrice = created.length ? Math.min(...created.map(c => c.priceCents)) : priceCents;
      const totalStock = created.reduce((s, c) => s + (c.stock || 0), 0);
      await prisma.product.update({ where: { id: product.id }, data: { priceCents: minPrice, stock: totalStock } });
    } else {
      await prisma.productVariant.create({
        data: { productId: product.id, priceCents, stock: stock ?? 0, attributes: {} },
      });
    }
  } catch (err) {
    console.error('Failed to create variants:', err);
  }
  
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

// Helper: recalc product summary fields from variants
async function recalcProductSummary(productId: string) {
  const vars = await prisma.productVariant.findMany({ where: { productId }, select: { priceCents: true, stock: true } });
  if (vars.length === 0) return;
  const minPrice = Math.min(...vars.map(v => v.priceCents));
  const totalStock = vars.reduce((s, v) => s + (v.stock || 0), 0);
  await prisma.product.update({ where: { id: productId }, data: { priceCents: minPrice, stock: totalStock } });
}

// GET /api/v1/products/:id/variants - list variants (public)
router.get('/:id/variants', async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return notFound(res, 'Product not found');
  const items = await prisma.productVariant.findMany({ where: { productId: id }, orderBy: { priceCents: 'asc' } });
  res.json({ items });
});

// POST /api/v1/products/:id/variants - create (vendor-owned)
router.post('/:id/variants', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id } = req.params;
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return notFound(res, 'shop_not_found');
  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) return notFound(res, 'product_not_found');
  const schema = z.object({
    attributes: z.record(z.union([z.string(), z.number()])).default({}),
    priceCents: z.number().int().min(0),
    stock: z.number().int().min(0).default(0),
    sku: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, 'invalid_body');
  const v = await prisma.productVariant.create({
    data: { productId: id, attributes: parsed.data.attributes, priceCents: parsed.data.priceCents, stock: parsed.data.stock, sku: parsed.data.sku },
  });
  await recalcProductSummary(id);
  res.status(201).json(v);
});

// PATCH /api/v1/products/:id/variants/:variantId - update
router.patch('/:id/variants/:variantId', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id, variantId } = req.params;
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return notFound(res, 'shop_not_found');
  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) return notFound(res, 'product_not_found');
  const schema = z.object({
    priceCents: z.number().int().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    sku: z.string().optional(),
    attributes: z.record(z.union([z.string(), z.number()])).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, 'invalid_body');
  const v = await prisma.productVariant.update({ where: { id: variantId }, data: parsed.data });
  await recalcProductSummary(id);
  res.json(v);
});

// DELETE /api/v1/products/:id/variants/:variantId - delete
router.delete('/:id/variants/:variantId', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id, variantId } = req.params;
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return notFound(res, 'shop_not_found');
  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) return notFound(res, 'product_not_found');
  await prisma.productVariant.delete({ where: { id: variantId } });
  await recalcProductSummary(id);
  res.json({ success: true });
});

export default router;

// --- Reviews ---
// GET /api/v1/products/:id/reviews - public list of reviews with average
router.get('/:id/reviews', async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return notFound(res, 'Product not found');
  const items = await prisma.review.findMany({
    where: { productId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  const avgAgg = await prisma.review.aggregate({ _avg: { rating: true }, _count: { _all: true }, where: { productId: id } });
  res.json({ items, average: avgAgg._avg.rating ?? null, count: avgAgg._count._all });
});

// POST /api/v1/products/:id/reviews - create or update current user's review
router.post('/:id/reviews', requireAuth, async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id } = req.params;
  const schema = z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().max(120).optional(),
    body: z.string().max(2000).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return badReq(res, 'invalid_body');
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return notFound(res, 'product_not_found');

  const data = parsed.data;
  // Upsert by (productId, userId)
  const review = await prisma.review.upsert({
    where: { productId_userId: { productId: id, userId: user.sub } },
    update: { rating: data.rating, title: data.title, body: data.body },
    create: { productId: id, userId: user.sub, rating: data.rating, title: data.title, body: data.body },
  });
  res.status(201).json(review);
});
