import { createHash, randomBytes } from "node:crypto";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export type SessionRecord = { id: string; userId: string; familyExpiresAt: Date; revokedAt: Date | null; authVersionAtIssue: number };
export class SessionService {
  constructor(private readonly store: { createSession(data: { userId: string; authVersion: number; expiresAt: Date; tokenHash: string }): Promise<SessionRecord>; rotate(tokenHash: string, replacementHash: string, now: Date): Promise<SessionRecord | "REPLAY" | null>; revoke(sessionId: string, reason: string): Promise<void> }) {}
  async create(userId: string, authVersion: number) { const refreshToken = randomBytes(48).toString("base64url"); const familyExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); const session = await this.store.createSession({ userId, authVersion, expiresAt: familyExpiresAt, tokenHash: hash(refreshToken) }); return { session, refreshToken, accessExpiresAt: new Date(Date.now() + 15 * 60 * 1000) }; }
  async rotate(refreshToken: string) { const replacement = randomBytes(48).toString("base64url"); const result = await this.store.rotate(hash(refreshToken), hash(replacement), new Date()); if (result === "REPLAY") throw new Error("REFRESH_REPLAY"); if (!result) throw new Error("SESSION_INVALID"); return { session: result, refreshToken: replacement, accessExpiresAt: new Date(Date.now() + 15 * 60 * 1000) }; }
  revoke(sessionId: string, reason = "LOGOUT") { return this.store.revoke(sessionId, reason); }
}
