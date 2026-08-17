import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

// Load env from API .env and repo root .env as fallback
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
  // Admin credentials - CHANGE THESE IN PRODUCTION
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@handmadelovefilled.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminSecure!2024';
  const adminName = process.env.SEED_ADMIN_NAME || 'Platform Admin';

  const adminPasswordHash = await argon2.hash(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
      name: adminName,
      emailVerifiedAt: new Date(),
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: adminName,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✅ Admin account created/updated:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('');
  console.log('⚠️  IMPORTANT: Change the admin password after first login!');

  // Seed basic categories (optional, remove if not needed)
  const categories = [
    'Art & Crafts',
    'Clothing & Accessories',
    'Home & Living',
    'Jewelry',
    'Toys & Games',
    'Food & Drinks',
    'Beauty & Personal Care',
    'Stationery',
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✅ Seeded ${categories.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
