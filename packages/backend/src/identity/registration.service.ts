import { hashPassword, normalizeEmail } from "./password.service.js";

export type RegisteredUser = {
  id: string;
  displayName: string;
  email: string;
  emailNormalized: string;
  role: "USER";
  approval: "PENDING";
  locale: "fa" | "en";
};

export interface RegistrationStore {
  findByNormalizedEmail(emailNormalized: string): Promise<RegisteredUser | null>;
  createPendingUser(data: Omit<RegisteredUser, "id"> & { passwordHash: string }): Promise<RegisteredUser>;
}

export class RegistrationService {
  constructor(private readonly users: RegistrationStore) {}

  async register(displayName: string, email: string, password: string, locale: "fa" | "en") {
    const normalizedDisplayName = displayName.trim();
    const emailNormalized = normalizeEmail(email);
    if (!normalizedDisplayName || normalizedDisplayName.length > 100 || !emailNormalized) {
      throw new Error("REGISTRATION_INVALID");
    }
    if (await this.users.findByNormalizedEmail(emailNormalized)) throw new Error("EMAIL_TAKEN");

    return this.users.createPendingUser({
      displayName: normalizedDisplayName,
      email: email.trim(),
      emailNormalized,
      passwordHash: await hashPassword(password),
      role: "USER",
      approval: "PENDING",
      locale,
    });
  }
}
