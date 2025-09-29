-- CreateIndex
CREATE INDEX "Order_shopId_status_createdAt_idx" ON "Order"("shopId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "Product_shopId_status_createdAt_idx" ON "Product"("shopId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Product_shopId_stock_idx" ON "Product"("shopId", "stock");

-- CreateIndex
CREATE INDEX "Product_shopId_createdAt_idx" ON "Product"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "Product_title_idx" ON "Product"("title");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");
