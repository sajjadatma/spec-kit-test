import { createPrismaClient } from "../packages/backend/src/infrastructure/prisma/prisma.service.js";
import { hashPassword, normalizeEmail } from "../packages/backend/src/identity/password.service.js";

const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const displayName = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Initial administrator";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !email || !password) {
  console.error("Set DATABASE_URL, ADMIN_BOOTSTRAP_EMAIL, and ADMIN_BOOTSTRAP_PASSWORD to bootstrap the initial SUPER_ADMIN.");
  process.exitCode = 1;
} else {
  const prisma = createPrismaClient(databaseUrl);
  try {
    const existingAdministrator = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN", disabledAt: null } });
    if (existingAdministrator) throw new Error("An enabled SUPER_ADMIN already exists; bootstrap is single-use.");

    const emailNormalized = normalizeEmail(email);
    const existingAccount = await prisma.user.findUnique({ where: { emailNormalized } });
    if (existingAccount) throw new Error("The bootstrap email already belongs to an account.");

    await prisma.user.create({
      data: {
        displayName,
        email: email.trim(),
        emailNormalized,
        passwordHash: await hashPassword(password),
        role: "SUPER_ADMIN",
        approval: "APPROVED",
        locale: process.env.ADMIN_BOOTSTRAP_LOCALE === "fa" ? "fa" : "en",
      },
    });
    console.info("Initial SUPER_ADMIN created.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Bootstrap failed.");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
