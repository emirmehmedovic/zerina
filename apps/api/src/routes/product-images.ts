import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { prisma } from '../prisma';
import { z } from 'zod';
import { badRequest, notFound } from '../utils/errors';

const router = Router();

// POST /api/v1/products/:id/images - add image to product
router.post('/:id/images', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id } = req.params;
  
  // Validate request body
  const schema = z.object({
    imagePath: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, 'invalid_body');
  const { imagePath } = parsed.data;
  
  // Check if product exists and belongs to user's shop
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return notFound(res, 'shop_not_found');
  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) return notFound(res, 'product_not_found');
  
  // Extract storage key from path
  let storageKey;
  if (imagePath.includes('/uploads/')) {
    // Format: http://localhost:4000/uploads/image.jpg ili /uploads/image.jpg
    const parts = imagePath.split('/uploads/');
    storageKey = parts[parts.length - 1];
  } else if (imagePath.startsWith('http')) {
    // Format: http://localhost:4000/image.jpg
    const url = new URL(imagePath);
    storageKey = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
  } else {
    // Format: image.jpg ili /image.jpg
    storageKey = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  }
  
  // Get current max position
  const maxPos = await prisma.productImage.findFirst({
    where: { productId: id },
    orderBy: { position: 'desc' },
  });
  const position = maxPos ? maxPos.position + 1 : 0;
  
  // Create image
  const image = await prisma.productImage.create({
    data: {
      productId: id,
      storageKey: storageKey,
      position,
    },
  });
  
  res.json(image);
});

// GET /api/v1/products/:id/images - get product images
router.get('/:id/images', async (req, res) => {
  const { id } = req.params;
  
  // Check if product exists
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return notFound(res, 'product_not_found');
  
  // Get images
  const images = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { position: 'asc' },
  });
  
  res.json(images);
});

// DELETE /api/v1/products/:id/images/:imageId - delete product image
router.delete('/:id/images/:imageId', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id, imageId } = req.params;
  
  // Check if product exists and belongs to user's shop
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return notFound(res, 'shop_not_found');
  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) return notFound(res, 'product_not_found');
  
  // Check if image exists
  const image = await prisma.productImage.findFirst({ 
    where: { 
      id: imageId,
      productId: id,
    } 
  });
  if (!image) return notFound(res, 'image_not_found');
  
  // Delete image
  await prisma.productImage.delete({ where: { id: imageId } });
  
  res.json({ success: true });
});

// POST /api/v1/products/:id/images/reorder - reorder product images
router.post('/:id/images/reorder', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id } = req.params;
  
  // Validate request body
  const schema = z.object({
    order: z.array(z.string()),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, 'invalid_body');
  const { order } = parsed.data;
  
  // Check if product exists and belongs to user's shop
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return notFound(res, 'shop_not_found');
  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) return notFound(res, 'product_not_found');
  
  // Update positions
  for (let i = 0; i < order.length; i++) {
    await prisma.productImage.updateMany({
      where: { id: order[i], productId: id },
      data: { position: i },
    });
  }
  
  // Get updated images
  const images = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { position: 'asc' },
  });
  
  res.json(images);
});

// POST /api/v1/products/:id/images/cover - set cover image
router.post('/:id/images/cover', requireAuth, requireRole('VENDOR'), async (req, res) => {
  const user = (req as any).user as { sub: string };
  const { id } = req.params;
  
  // Validate request body
  const schema = z.object({
    imageId: z.string(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, 'invalid_body');
  const { imageId } = parsed.data;
  
  // Check if product exists and belongs to user's shop
  const shop = await prisma.shop.findFirst({ where: { ownerId: user.sub } });
  if (!shop) return notFound(res, 'shop_not_found');
  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id } });
  if (!product) return notFound(res, 'product_not_found');
  
  // Check if image exists
  const image = await prisma.productImage.findFirst({ 
    where: { 
      id: imageId,
      productId: id,
    } 
  });
  if (!image) return notFound(res, 'image_not_found');
  
  // Get all images
  const images = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { position: 'asc' },
  });
  
  // Reorder images to put cover first
  const newOrder = [
    imageId,
    ...images.filter((img: { id: string }) => img.id !== imageId).map((img: { id: string }) => img.id),
  ];
  
  // Update positions
  for (let i = 0; i < newOrder.length; i++) {
    await prisma.productImage.updateMany({
      where: { id: newOrder[i], productId: id },
      data: { position: i },
    });
  }
  
  // Get updated images
  const updatedImages = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { position: 'asc' },
  });
  
  res.json(updatedImages);
});

export default router;
