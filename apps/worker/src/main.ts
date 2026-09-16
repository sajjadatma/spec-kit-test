import "reflect-metadata";
import { randomUUID } from "node:crypto";
console.info(JSON.stringify({ event: "worker.started", workerId: randomUUID(), queues: ["mail", "image", "cleanup"] }));
