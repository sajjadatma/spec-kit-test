import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "./password.service.js";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export class PasswordResetService {
  constructor(private readonly store: { issue(userId: string, tokenHash: string, expiresAt: Date): Promise<void>; consume(tokenHash: string, passwordHash: string, now: Date): Promise<boolean> }) {}
  async issue(userId: string) { const token = randomBytes(32).toString("base64url"); await this.store.issue(userId, hash(token), new Date(Date.now() + 30 * 60 * 1000)); return token; }
  async consume(token: string, password: string) { return this.store.consume(hash(token), await hashPassword(password), new Date()); }
}
