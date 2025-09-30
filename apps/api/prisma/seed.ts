import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// Load env from API .env and repo root .env as fallback
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function slugify(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  // 1) Seed base categories (idempotent)
  const categories = [
    'Art & Crafts',
    'Clothing',
    'Home & Living',
    'Jewelry',
    'Toys & Games',
  ];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Seeded categories:', categories.length);

  // 2) Prepare image pool from apps/web/public (files starting with 'pexels')
  // apps/api/prisma -> ../../web/public
  const webPublicDir = path.resolve(__dirname, '../../web/public');
  const apiUploadsDir = path.resolve(__dirname, '../uploads');
  const repoUploadsDir = path.resolve(__dirname, '../../uploads');

  // Ensure uploads directory exists (match server static config primary path: ../../uploads)
  if (!fs.existsSync(repoUploadsDir)) fs.mkdirSync(repoUploadsDir, { recursive: true });

  // Collect candidate images from web/public
  let pool: string[] = [];
  try {
    const all = fs.readdirSync(webPublicDir);
    pool = all.filter((f) => f.toLowerCase().startsWith('pexels') && /(\.jpg|\.jpeg|\.png|\.webp)$/i.test(f));
  } catch (e) {
    console.warn('Warning: Could not read web/public directory for images:', e);
  }
  if (pool.length === 0) {
    console.warn('No pexels* images found in web/public. Products will be created without images.');
  }

  // Helper to copy a random image to uploads and return storageKey
  const pickImageStorageKey = (): string | null => {
    if (pool.length === 0) return null;
    const pick = pool[randomInt(0, pool.length - 1)];
    const src = path.join(webPublicDir, pick);
    const fileBase = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${pick}`;
    const dest = path.join(repoUploadsDir, fileBase);
    try {
      fs.copyFileSync(src, dest);
      // storageKey expected across the app as '/uploads/<file>'
      return `/uploads/${fileBase}`;
    } catch (e) {
      console.warn('Failed to copy image to uploads:', e);
      return null;
    }
  };

  // 3) Create shops and products
  const SHOP_COUNT = 5; // adjust as needed
  const PRODUCTS_PER_SHOP = 10;

  const shopNames = [
    'Aurora Atelier',
    'Mosaic Market',
    'Velvet & Vine',
    'Rustic Roots',
    'Stellar Goods',
    'Willow Workshop',
    'Echo Emporium',
    'Cedar & Clay',
    'Lumen Lane',
    'Woven Wonders',
  ];

  const productNames = [
    'Handmade Mug',
    'Organic Cotton Tote',
    'Ceramic Vase',
    'Wool Knit Scarf',
    'Scented Soy Candle',
    'Leather Journal',
    'Bamboo Cutting Board',
    'Art Print',
    'Beaded Bracelet',
    'Linen Tea Towel',
    'Planter Pot',
    'Wooden Spoon Set',
    'Minimalist Poster',
  ];

  for (let i = 0; i < SHOP_COUNT; i++) {
    const name = shopNames[i % shopNames.length] + ' ' + (i + 1);
    // Create a vendor user for this shop (ownerId is required & unique)
    const email = `${slugify(name)}@seed.local`;
    const owner = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: {
        email,
        name,
        passwordHash: 'seed',
        role: 'VENDOR' as any,
      },
      select: { id: true },
    });

    // Create shop with ACTIVE status (idempotent: reuse if exists for owner)
    let shop = await prisma.shop.findUnique({ where: { ownerId: owner.id }, select: { id: true, name: true } });
    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          ownerId: owner.id,
          name,
          description: 'Curated handcrafted goods and essentials.',
          slug: slugify(name),
          status: 'ACTIVE' as any,
        },
        select: { id: true, name: true },
      });
    }

    // For each shop create products (top up to PRODUCTS_PER_SHOP)
    const existingCount = await prisma.product.count({ where: { shopId: shop.id } });
    const toCreate = Math.max(0, PRODUCTS_PER_SHOP - existingCount);
    for (let p = 0; p < toCreate; p++) {
      const pName = productNames[randomInt(0, productNames.length - 1)] + ' #' + randomInt(1000, 9999);
      const priceCents = randomInt(500, 10000); // 5.00 - 100.00
      const stock = randomInt(3, 50);
      const storageKey = pickImageStorageKey();

      const product = await prisma.product.create({
        data: {
          shopId: shop.id,
          title: pName,
          slug: slugify(pName + '-' + Date.now().toString(36)),
          description: 'A beautiful, handcrafted item perfect for everyday use.',
          priceCents,
          currency: 'EUR',
          stock,
          status: 'PUBLISHED' as any,
        },
        select: { id: true },
      });

      if (storageKey) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            storageKey,
            position: 0,
          },
        });
      }

      // Optionally attach a random existing category
      const cat = await prisma.category.findFirst();
      if (cat) {
        await prisma.productCategory.create({
          data: { productId: product.id, categoryId: cat.id },
        });
      }
    }
    console.log(`Ensured shop: ${name} with at least ${PRODUCTS_PER_SHOP} products`);
  }

  // 4) Globally ensure every product has at least one image
  const missingImages = await prisma.product.findMany({
    where: { images: { none: {} } },
    select: { id: true },
    take: 1000,
  });
  for (const prod of missingImages) {
    const storageKey = pickImageStorageKey();
    if (storageKey) {
      await prisma.productImage.create({ data: { productId: prod.id, storageKey, position: 0 } });
    }
  }
  if (missingImages.length) {
    console.log(`Attached images to ${missingImages.length} existing products missing images.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
