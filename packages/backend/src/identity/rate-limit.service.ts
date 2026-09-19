import { createHmac } from "node:crypto";
export const RATE_LIMITS = { loginIp: [10, 900], loginAccount: [5, 900], registerIp: [5, 3600], resetAccount: [3, 3600], resetIp: [10, 3600], resetConsumeIp: [10, 900], refreshSession: [60, 60], uploadsUser: [30, 60], generationUser: [10, 3600] } as const;
export const subjectHash = (secret: string, value: string) => createHmac("sha256", secret).update(value).digest("hex");
export type RateLimitScope = keyof typeof RATE_LIMITS;
export interface RateLimitStore { increment(scope: string, subjectHash: string, windowStart: Date, expiresAt: Date): Promise<number>; }
export class RateLimitService {
  constructor(private readonly store: RateLimitStore, private readonly secret: string) { if (secret.length < 32) throw new Error("TOKEN_HASH_SECRET_INVALID"); }
  async check(scope: RateLimitScope, subject: string, now = new Date()) {
    const [limit, seconds] = RATE_LIMITS[scope];
    const windowStart = new Date(Math.floor(now.getTime() / (seconds * 1000)) * seconds * 1000);
    const count = await this.store.increment(scope, subjectHash(this.secret, subject), windowStart, new Date(windowStart.getTime() + seconds * 1000));
    if (count > limit) throw new Error("RATE_LIMITED");
  }
}
