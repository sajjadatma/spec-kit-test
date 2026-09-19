import { verifyPassword } from "./password.service.js";
import type { SessionService } from "./session.service.js";

export type AccountAccess = "APPROVED" | "PENDING" | "REJECTED" | "DISABLED";
export type AccountForAuthentication = {
  id: string;
  passwordHash: string;
  role: "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER";
  approval: "PENDING" | "APPROVED" | "REJECTED";
  disabledAt: Date | null;
  authVersion: number;
};

export interface AuthenticationStore {
  findByNormalizedEmail(email: string): Promise<AccountForAuthentication | null>;
}

export class AuthenticationService {
  constructor(
    private readonly accounts: AuthenticationStore,
    private readonly sessions: SessionService,
  ) {}

  async login(emailNormalized: string, password: string) {
    const account = await this.accounts.findByNormalizedEmail(emailNormalized);
    if (!account || !(await verifyPassword(account.passwordHash, password))) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const access: AccountAccess = account.disabledAt
      ? "DISABLED"
      : account.approval;
    if (access !== "APPROVED") return { access };

    return {
      access,
      account: { id: account.id, role: account.role, authVersion: account.authVersion },
      ...(await this.sessions.create(account.id, account.authVersion)),
    };
  }
}
