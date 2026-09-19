ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "primaryImageId" uuid;
CREATE UNIQUE INDEX IF NOT EXISTS "Product_primaryImageId_key" ON "Product"("primaryImageId");
