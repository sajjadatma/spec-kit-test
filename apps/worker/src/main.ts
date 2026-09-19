import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { createPrismaClient, LocalMailAdapter, MailService, PrismaIdentityStore, ResetEmailOutboxService, ResetMailCipher, SmtpMailAdapter } from "@industrial-dashboard/backend";

const prisma = createPrismaClient(process.env.DATABASE_URL ?? "postgresql://dashboard:dashboard@localhost:5432/industrial_dashboard");
const store = new PrismaIdentityStore(prisma);
const transport = process.env.MAIL_TRANSPORT === "local" ? new LocalMailAdapter() : new SmtpMailAdapter();
const outbox = new ResetEmailOutboxService(store, new ResetMailCipher(), new MailService(transport));
const workerId = randomUUID();

async function processMail() {
  try { while (await outbox.processOne()) { /* drain the currently ready queue */ } }
  catch { console.error(JSON.stringify({ event: "worker.mail.failed", workerId })); }
}

console.info(JSON.stringify({ event: "worker.started", workerId, queues: ["mail", "image", "cleanup"] }));
void processMail();
const timer = setInterval(() => void processMail(), 5_000);
const shutdown = async () => { clearInterval(timer); await prisma.$disconnect(); process.exit(0); };
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
