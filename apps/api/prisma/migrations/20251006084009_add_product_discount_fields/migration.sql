-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountPercent" INTEGER DEFAULT 0,
ADD COLUMN     "isOnSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalPriceCents" INTEGER;

-- CreateIndex
CREATE INDEX "Product_isOnSale_idx" ON "Product"("isOnSale");
