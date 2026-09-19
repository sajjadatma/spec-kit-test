import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export type SessionRecord = { id: string; userId: string; familyExpiresAt: Date; revokedAt: Date | null; authVersionAtIssue: number };
export interface SessionStore { createSession(data: { userId: string; authVersion: number; expiresAt: Date; tokenHash: string }): Promise<SessionRecord>; rotate(tokenHash: string, replacementHash: string, now: Date): Promise<SessionRecord | "REPLAY" | null>; revoke(sessionId: string, reason: string): Promise<void>; }
export type AccessTokenClaims = { sub: string; sid: string; ver: number; iat: number; exp: number; iss: string; aud: string };
const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");
const sign = (input: string, secret: string) => createHmac("sha256", secret).update(input).digest("base64url");

export class SessionService {
  private readonly accessSecret: string;
  constructor(private readonly store: SessionStore, accessSecret = process.env.JWT_ACCESS_SECRET) {
    if (!accessSecret || accessSecret.length < 32) throw new Error("JWT_ACCESS_SECRET_INVALID");
    this.accessSecret = accessSecret;
  }

  private issueAccessToken(session: SessionRecord, now = new Date()) {
    const claims: AccessTokenClaims = { sub: session.userId, sid: session.id, ver: session.authVersionAtIssue, iat: Math.floor(now.getTime() / 1000), exp: Math.floor((now.getTime() + 15 * 60 * 1000) / 1000), iss: "industrial-dashboard", aud: "industrial-dashboard-web" };
    const unsigned = `${base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${base64url(JSON.stringify(claims))}`;
    return { token: `${unsigned}.${sign(unsigned, this.accessSecret)}`, expiresAt: new Date(claims.exp * 1000) };
  }

  verifyAccessToken(token: string, now = new Date()): AccessTokenClaims {
    const [headerPart, payloadPart, signature] = token.split(".");
    if (!headerPart || !payloadPart || !signature) throw new Error("ACCESS_TOKEN_INVALID");
    const expected = sign(`${headerPart}.${payloadPart}`, this.accessSecret);
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error("ACCESS_TOKEN_INVALID");
    const header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8")) as { alg?: string };
    const claims = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as AccessTokenClaims;
    if (header.alg !== "HS256" || claims.iss !== "industrial-dashboard" || claims.aud !== "industrial-dashboard-web" || !claims.sub || !claims.sid || !Number.isInteger(claims.ver) || claims.exp * 1000 <= now.getTime()) throw new Error("ACCESS_TOKEN_INVALID");
    return claims;
  }

  async create(userId: string, authVersion: number) {
    const refreshToken = randomBytes(48).toString("base64url");
    const familyExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await this.store.createSession({ userId, authVersion, expiresAt: familyExpiresAt, tokenHash: hash(refreshToken) });
    const access = this.issueAccessToken(session);
    return { session, refreshToken, accessToken: access.token, accessExpiresAt: access.expiresAt };
  }

  async rotate(refreshToken: string) {
    const replacement = randomBytes(48).toString("base64url");
    const result = await this.store.rotate(hash(refreshToken), hash(replacement), new Date());
    if (result === "REPLAY") throw new Error("REFRESH_REPLAY");
    if (!result) throw new Error("SESSION_INVALID");
    const access = this.issueAccessToken(result);
    return { session: result, refreshToken: replacement, accessToken: access.token, accessExpiresAt: access.expiresAt };
  }
  revoke(sessionId: string, reason = "LOGOUT") { return this.store.revoke(sessionId, reason); }
}
