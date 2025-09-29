import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../prisma';
import { z } from 'zod';
import { badRequest, notFound } from '../utils/errors';

const router = Router();

// GET /api/v1/products/:id/variants - get product variants
router.get('/:id/variants', async (req, res) => {
  const { id } = req.params;
  
  // Check if product exists
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return notFound(res, 'product_not_found');
  
  // Get variants
  const variants = await prisma.productVariant.findMany({
    where: { productId: id },
    orderBy: { id: 'asc' }, // Koristimo id umjesto createdAt jer je to sigurno dostupno polje
  });
  
  res.json(variants);
});

// POST /api/v1/products/:id/variants - add variant to product
router.post('/:id/variants', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id } = req.params;
  
  // Validate request body
  const schema = z.object({
    attributes: z.record(z.string(), z.any()),
    priceCents: z.number().int().min(0),
    stock: z.number().int().min(0).optional(),
    sku: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, 'invalid_body');
  const { attributes, priceCents, stock = 0, sku = '' } = parsed.data;
  
  // Check if product exists and belongs to user's shop
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return notFound(res, 'shop_not_found');
  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) return notFound(res, 'product_not_found');
  
  // Create variant
  const variant = await prisma.productVariant.create({
    data: {
      productId: id,
      attributes,
      priceCents,
      stock,
      sku,
    },
  });
  
  res.json(variant);
});

// DELETE /api/v1/products/:id/variants/:variantId - delete product variant
router.delete('/:id/variants/:variantId', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id, variantId } = req.params;
  
  // Check if product exists and belongs to user's shop
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return notFound(res, 'shop_not_found');
  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) return notFound(res, 'product_not_found');
  
  // Check if variant exists
  const variant = await prisma.productVariant.findFirst({ 
    where: { 
      id: variantId,
      productId: id,
    } 
  });
  if (!variant) return notFound(res, 'variant_not_found');
  
  // Delete variant
  await prisma.productVariant.delete({ where: { id: variantId } });
  
  res.json({ success: true });
});

// PATCH /api/v1/products/:id/variants/:variantId - update product variant
router.patch('/:id/variants/:variantId', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id, variantId } = req.params;
  
  // Validate request body
  const schema = z.object({
    attributes: z.record(z.string(), z.any()).optional(),
    priceCents: z.number().int().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    sku: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, 'invalid_body');
  const { attributes, priceCents, stock, sku } = parsed.data;
  
  // Check if product exists and belongs to user's shop
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return notFound(res, 'shop_not_found');
  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) return notFound(res, 'product_not_found');
  
  // Check if variant exists
  const variant = await prisma.productVariant.findFirst({ 
    where: { 
      id: variantId,
      productId: id,
    } 
  });
  if (!variant) return notFound(res, 'variant_not_found');
  
  // Update variant
  const data: any = {};
  if (attributes !== undefined) data.attributes = attributes;
  if (priceCents !== undefined) data.priceCents = priceCents;
  if (stock !== undefined) data.stock = stock;
  if (sku !== undefined) data.sku = sku;
  
  const updatedVariant = await prisma.productVariant.update({
    where: { id: variantId },
    data,
  });
  
  res.json(updatedVariant);
});

export default router;
