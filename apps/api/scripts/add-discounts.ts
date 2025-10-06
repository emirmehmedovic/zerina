import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding discount data to products...');

  // Get all products
  const products = await prisma.product.findMany({
    take: 10,
  });

  if (products.length === 0) {
    console.log('No products found. Please add products first.');
    return;
  }

  // Add discounts to first 4 products
  for (let i = 0; i < Math.min(4, products.length); i++) {
    const product = products[i];
    const discountPercent = [50, 60, 70, 75][i % 4];
    const originalPrice = product.priceCents;
    const discountedPrice = Math.floor(originalPrice * (1 - discountPercent / 100));

    await prisma.product.update({
      where: { id: product.id },
      data: {
        originalPriceCents: originalPrice,
        priceCents: discountedPrice,
        discountPercent,
        isOnSale: true,
      },
    });

    console.log(`✓ Added ${discountPercent}% discount to "${product.title}"`);
  }

  console.log('\n✅ Discount data added successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
