import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createPrismaClient } from "../packages/backend/src/infrastructure/prisma/prisma.service.js";
import { hashPassword } from "../packages/backend/src/identity/password.service.js";

if (process.env.NODE_ENV === "production") throw new Error("Development seed is disabled in production.");
const prisma = createPrismaClient(process.env.DATABASE_URL ?? "postgresql://dashboard:dashboard@127.0.0.1:5433/industrial_dashboard");
const email = "visualization@example.test";
const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9J+U8AAAAASUVORK5CYII=", "base64");
const hash = createHash("sha256").update(bytes).digest("hex");
const main = async () => {
  const user = await prisma.user.upsert({ where: { emailNormalized: email }, update: { approval: "APPROVED", disabledAt: null }, create: { displayName: "Visualization Tester", email, emailNormalized: email, passwordHash: await hashPassword("Development-Only-Password-123!"), role: "USER", approval: "APPROVED" } });
  const asset = await prisma.fileAsset.upsert({ where: { storageKey: "seed/tile.png" }, update: {}, create: { storageKey: "seed/tile.png", contentHash: hash, mediaType: "image/png", byteSize: bytes.length, width: 256, height: 256, status: "READY", validatedAt: new Date(), creatorId: user.id } });
  const product = await prisma.product.upsert({ where: { skuNormalized: "seed-floor-tile" }, update: { active: true }, create: { name: "Seed Floor Tile", sku: "SEED-FLOOR-TILE", skuNormalized: "seed-floor-tile", category: "PORCELAIN_TILE", color: "GRAY", material: "PORCELAIN", widthMm: "600", heightMm: "600", finish: "MATTE", floorCompatible: true, wallCompatible: true, suitability: "BOTH", rectified: false, unitOfSale: "SQUARE_METER", active: true, createdById: user.id, updatedById: user.id } });
  const image = await prisma.productImage.upsert({ where: { productId_contentHash: { productId: product.id, contentHash: hash } }, update: {}, create: { productId: product.id, assetId: asset.id, contentHash: hash, position: 0 } });
  await prisma.product.update({ where: { id: product.id }, data: { primaryImageId: image.id } });
  await mkdir("storage/seed", { recursive: true }); await writeFile("storage/seed/tile.png", bytes);
  console.log(JSON.stringify({ email, password: "Development-Only-Password-123!", userId: user.id, productId: product.id, assetId: asset.id }));
};
main().finally(() => prisma.$disconnect());
