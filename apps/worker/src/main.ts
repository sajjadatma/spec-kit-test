import "reflect-metadata";
import { persistStoredGeneration } from "./handlers/generation.handler.js";
import { randomUUID } from "node:crypto";
import { createPrismaClient, FakeImageGenerationAdapter, JobRunner, LocalStorageAdapter, PrismaJobPort, StorageService, LocalMailAdapter, MailService, PrismaIdentityStore, ResetEmailOutboxService, ResetMailCipher, SmtpMailAdapter } from "@industrial-dashboard/backend";

const prisma = createPrismaClient(process.env.DATABASE_URL ?? "postgresql://dashboard:dashboard@localhost:5432/industrial_dashboard");
const store = new PrismaIdentityStore(prisma);
const transport = process.env.MAIL_TRANSPORT === "local" ? new LocalMailAdapter() : new SmtpMailAdapter();
const outbox = new ResetEmailOutboxService(store, new ResetMailCipher(), new MailService(transport));
const workerId = randomUUID();
const imageRunner = new JobRunner(new PrismaJobPort(prisma), workerId);
const imageStorage = new StorageService(new LocalStorageAdapter(process.env.STORAGE_ROOT ?? "storage"));
const imageService = new FakeImageGenerationAdapter();
async function processImages() { await imageRunner.runOnce("image", async (job) => { const outcome = await persistStoredGeneration(prisma, imageStorage, job, imageService); if (outcome === "FAILED") throw new Error("GENERATION_FAILED"); }); }

async function processMail() {
  try { while (await outbox.processOne()) { /* drain the currently ready queue */ } }
  catch { console.error(JSON.stringify({ event: "worker.mail.failed", workerId })); }
}

console.info(JSON.stringify({ event: "worker.started", workerId, queues: ["mail", "image", "cleanup"] }));
void processMail();
void processImages();
const timer = setInterval(() => { void processMail(); void processImages(); }, 5_000);
const shutdown = async () => { clearInterval(timer); await prisma.$disconnect(); process.exit(0); };
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
