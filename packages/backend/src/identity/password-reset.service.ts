import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "./password.service.js";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export interface PasswordResetStore { issue(userId: string, tokenHash: string, expiresAt: Date): Promise<string>; consume(tokenHash: string, passwordHash: string, now: Date): Promise<boolean>; }
export class PasswordResetService {
  constructor(private readonly store: PasswordResetStore) {}
  async issue(userId: string) { const token = randomBytes(32).toString("base64url"); const resetId = await this.store.issue(userId, hash(token), new Date(Date.now() + 30 * 60 * 1000)); return { token, resetId }; }
  async consume(token: string, password: string) { return this.store.consume(hash(token), await hashPassword(password), new Date()); }
}
