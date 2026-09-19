import { Injectable, OnModuleDestroy } from "@nestjs/common";
import {
  AuthenticationService,
  PasswordResetService,
  PrismaIdentityStore,
  RegistrationService,
  RateLimitService,
  SessionService,
  UserManagementService,
  createPrismaClient,
  normalizeEmail,
  ResetMailCipher,
} from "@industrial-dashboard/backend";

@Injectable()
export class IdentityService implements OnModuleDestroy {
  private readonly prisma = createPrismaClient(process.env.DATABASE_URL ?? "postgresql://dashboard:dashboard@localhost:5432/industrial_dashboard");
  private readonly store = new PrismaIdentityStore(this.prisma);
  private readonly sessions = new SessionService(this.store);
  private readonly registration = new RegistrationService(this.store);
  private readonly authentication = new AuthenticationService(this.store, this.sessions);
  private readonly resets = new PasswordResetService(this.store);
  private readonly limits = new RateLimitService(this.store, process.env.TOKEN_HASH_SECRET ?? "");
  private readonly resetCipher = new ResetMailCipher();
  private readonly users = new UserManagementService(this.prisma);

  register(displayName: string, email: string, password: string, locale: "fa" | "en") {
    return this.registration.register(displayName, email, password, locale);
  }

  login(email: string, password: string) {
    return this.authentication.login(normalizeEmail(email), password);
  }

  async requestPasswordReset(email: string) {
    const account = await this.store.findByNormalizedEmail(normalizeEmail(email));
    if (account) {
      const reset = await this.resets.issue(account.id);
      const resetUrl = new URL("/reset-password", process.env.WEB_ORIGIN ?? "http://localhost:3000");
      resetUrl.searchParams.set("token", reset.token);
      await this.store.queueResetEmail(reset.resetId, this.resetCipher.encrypt({ recipient: account.email, resetUrl: resetUrl.toString(), locale: account.locale }));
    }
  }

  consumePasswordReset(token: string, password: string) {
    return this.resets.consume(token, password);
  }

  refresh(refreshToken: string) {
    return this.sessions.rotate(refreshToken);
  }

  logout(sessionId: string) {
    return this.sessions.revoke(sessionId);
  }

  verifyAccessToken(token: string) {
    return this.sessions.verifyAccessToken(token);
  }

  async currentAccount(userId: string, sessionId?: string, tokenAuthVersion?: number) {
    const account = await this.store.findAccountSummary(userId);
    if (!account || account.approval !== "APPROVED" || account.disabledAt) throw new Error("SESSION_INVALID");
    if (sessionId) {
      const session = await this.store.findActiveSession(sessionId, userId);
      if (!session || session.authVersionAtIssue !== tokenAuthVersion || account.authVersion !== tokenAuthVersion) throw new Error("SESSION_INVALID");
    }
    return { id: account.id, displayName: account.displayName, email: account.email, role: account.role, approval: account.approval, disabled: false, locale: account.locale, revision: account.revision, createdAt: account.createdAt, capabilities: account.role === "SUPER_ADMIN" ? ["MANAGE_ROLES", "VIEW_ALL_HISTORY"] : [] };
  }

  async updatePreferences(userId: string, locale: "fa" | "en") {
    await this.store.updateLocale(userId, locale);
    return this.currentAccount(userId);
  }

  rateLimit(scope: "loginIp" | "loginAccount" | "registerIp" | "resetAccount" | "resetIp" | "resetConsumeIp" | "refreshSession", subject: string) {
    return this.limits.check(scope, subject);
  }

  listUsers(actor: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" }, query: Parameters<UserManagementService["list"]>[1]) { return this.users.list(actor, query); }
  getUser(actor: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" }, id: string) { return this.users.get(actor, id); }
  setApproval(actor: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" }, id: string, decision: "APPROVED" | "REJECTED", revision?: number) { return this.users.setApproval(actor, id, decision, revision); }
  setAccess(actor: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" }, id: string, disabled: boolean, revision?: number) { return this.users.setAccess(actor, id, disabled, revision); }
  setRole(actor: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" }, id: string, role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER", revision?: number) { return this.users.setRole(actor, id, role, revision); }
  fixedRoles(actor: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER" }) { return this.users.fixedRoles(actor); }

  onModuleDestroy() {
    return this.prisma.$disconnect();
  }
}
