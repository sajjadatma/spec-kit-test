import type { PrismaClient } from "@prisma/client";
import type { AccountForAuthentication, AuthenticationStore } from "./authentication.service.js";
import type { PasswordResetStore } from "./password-reset.service.js";
import type { RegisteredUser, RegistrationStore } from "./registration.service.js";
import type { SessionRecord, SessionStore } from "./session.service.js";
import type { ClaimedResetEmail, ResetEmailOutboxStore } from "../infrastructure/mail/outbox.service.js";
import type { RateLimitStore } from "./rate-limit.service.js";

const toRegisteredUser = (user: {
  id: string; displayName: string; email: string; emailNormalized: string; role: "USER"; approval: "PENDING"; locale: "fa" | "en";
}): RegisteredUser => user;

/** Prisma-backed identity persistence. It deliberately stores only token hashes. */
export class PrismaIdentityStore implements RegistrationStore, AuthenticationStore, SessionStore, PasswordResetStore, ResetEmailOutboxStore, RateLimitStore {
  constructor(private readonly prisma: PrismaClient) {}

  async findByNormalizedEmail(emailNormalized: string): Promise<(RegisteredUser & AccountForAuthentication & { passwordHash: string; disabledAt: Date | null; authVersion: number }) | null> {
    const user = await this.prisma.user.findUnique({ where: { emailNormalized } });
    return user as (RegisteredUser & AccountForAuthentication & { passwordHash: string; disabledAt: Date | null; authVersion: number }) | null;
  }

  async createPendingUser(data: Omit<RegisteredUser, "id"> & { passwordHash: string }): Promise<RegisteredUser> {
    const user = await this.prisma.user.create({ data });
    return toRegisteredUser(user as RegisteredUser);
  }

  async findAccountSummary(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true, displayName: true, email: true, role: true, approval: true, disabledAt: true, locale: true, revision: true, createdAt: true, authVersion: true } });
  }

  async findActiveSession(id: string, userId: string, now = new Date()) {
    return this.prisma.authenticationSession.findFirst({
      where: { id, userId, revokedAt: null, familyExpiresAt: { gt: now } },
      select: { id: true, userId: true, authVersionAtIssue: true },
    });
  }

  async updateLocale(id: string, locale: "fa" | "en") {
    return this.prisma.user.update({ where: { id }, data: { locale, revision: { increment: 1 } }, select: { id: true, displayName: true, email: true, role: true, approval: true, disabledAt: true, locale: true, revision: true, createdAt: true } });
  }

  async createSession(data: { userId: string; authVersion: number; expiresAt: Date; tokenHash: string }): Promise<SessionRecord> {
    const session = await this.prisma.authenticationSession.create({
      data: {
        userId: data.userId,
        authVersionAtIssue: data.authVersion,
        familyExpiresAt: data.expiresAt,
        refreshTokens: { create: { tokenHash: data.tokenHash, expiresAt: data.expiresAt } },
      },
    });
    return session;
  }

  async rotate(tokenHash: string, replacementHash: string, now: Date): Promise<SessionRecord | "REPLAY" | null> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.refreshToken.findUnique({ include: { session: true }, where: { tokenHash } });
      if (!current || current.expiresAt <= now || current.session.familyExpiresAt <= now || current.session.revokedAt) return null;
      if (current.consumedAt) {
        await tx.authenticationSession.update({ where: { id: current.sessionId }, data: { revokedAt: now, revokedReason: "REFRESH_REPLAY" } });
        return "REPLAY";
      }
      // The conditional update is the serialization point: exactly one request can consume a
      // verifier. A competing request turns into a replay and revokes the whole family.
      const consumed = await tx.refreshToken.updateMany({ where: { id: current.id, consumedAt: null }, data: { consumedAt: now } });
      if (consumed.count !== 1) {
        await tx.authenticationSession.update({ where: { id: current.sessionId }, data: { revokedAt: now, revokedReason: "REFRESH_REPLAY" } });
        return "REPLAY";
      }
      const replacement = await tx.refreshToken.create({ data: { sessionId: current.sessionId, tokenHash: replacementHash, expiresAt: current.session.familyExpiresAt } });
      await tx.refreshToken.update({ where: { id: current.id }, data: { replacementId: replacement.id } });
      return current.session;
    });
  }

  async revoke(sessionId: string, reason: string): Promise<void> {
    await this.prisma.authenticationSession.update({ where: { id: sessionId }, data: { revokedAt: new Date(), revokedReason: reason } });
  }

  async issue(userId: string, tokenHash: string, expiresAt: Date): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      await tx.passwordReset.updateMany({ where: { userId, consumedAt: null, supersededAt: null }, data: { supersededAt: new Date() } });
      const reset = await tx.passwordReset.create({ data: { userId, tokenHash, expiresAt } });
      return reset.id;
    });
  }

  async queueResetEmail(resetId: string, encryptedPayload: string) {
    await this.prisma.emailOutbox.create({ data: { resetId, encryptedPayload, encryptionKeyVersion: 1 } });
  }

  async claimNext(now: Date): Promise<ClaimedResetEmail | null> {
    return this.prisma.$transaction(async (tx) => {
      await tx.emailOutbox.updateMany({
        where: { status: { in: ["QUEUED", "SENDING", "FAILED"] }, reset: { OR: [{ expiresAt: { lte: now } }, { consumedAt: { not: null } }, { supersededAt: { not: null } }] } },
        data: { status: "EXPIRED", encryptedPayload: null, leaseUntil: null, leaseToken: null },
      });
      const item = await tx.emailOutbox.findFirst({
        where: {
          status: "QUEUED",
          nextAttemptAt: { lte: now },
          attemptCount: { lt: 2 },
          reset: { expiresAt: { gt: now }, consumedAt: null, supersededAt: null },
        },
        orderBy: { createdAt: "asc" },
      });
      if (!item?.encryptedPayload) return null;
      const claimed = await tx.emailOutbox.updateMany({ where: { id: item.id, status: item.status }, data: { status: "SENDING", leaseUntil: new Date(now.getTime() + 60_000), attemptCount: { increment: 1 } } });
      return claimed.count === 1 ? { id: item.id, encryptedPayload: item.encryptedPayload } : null;
    });
  }

  async markSent(id: string): Promise<void> {
    await this.prisma.emailOutbox.update({ where: { id }, data: { status: "SENT", encryptedPayload: null, leaseUntil: null, leaseToken: null } });
  }

  async markFailed(id: string, now: Date): Promise<void> {
    const item = await this.prisma.emailOutbox.findUnique({ where: { id }, select: { attemptCount: true } });
    if (!item) return;
    if (item.attemptCount >= 2) {
      await this.prisma.emailOutbox.update({ where: { id }, data: { status: "EXPIRED", encryptedPayload: null, leaseUntil: null, leaseToken: null, lastSafeErrorCode: "MAIL_DELIVERY_FAILED" } });
      return;
    }
    await this.prisma.emailOutbox.update({ where: { id }, data: { status: "QUEUED", nextAttemptAt: new Date(now.getTime() + 60_000), leaseUntil: null, leaseToken: null, lastSafeErrorCode: "MAIL_DELIVERY_FAILED" } });
  }

  async increment(scope: string, subjectHash: string, windowStart: Date, expiresAt: Date): Promise<number> {
    const bucket = await this.prisma.rateLimitBucket.upsert({ where: { scope_subjectHash_windowStart: { scope, subjectHash, windowStart } }, create: { scope, subjectHash, windowStart, expiresAt, count: 1 }, update: { count: { increment: 1 }, expiresAt } });
    return bucket.count;
  }

  async consume(tokenHash: string, passwordHash: string, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const reset = await tx.passwordReset.findUnique({ where: { tokenHash } });
      if (!reset || reset.consumedAt || reset.supersededAt || reset.expiresAt <= now) return false;
      await tx.passwordReset.update({ where: { id: reset.id }, data: { consumedAt: now } });
      await tx.passwordReset.updateMany({ where: { userId: reset.userId, id: { not: reset.id }, consumedAt: null, supersededAt: null }, data: { supersededAt: now } });
      await tx.user.update({ where: { id: reset.userId }, data: { passwordHash, authVersion: { increment: 1 } } });
      await tx.authenticationSession.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: now, revokedReason: "PASSWORD_RESET" } });
      return true;
    });
  }
}
