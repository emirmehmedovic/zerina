import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load env from API .env and repo root .env as fallback
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
