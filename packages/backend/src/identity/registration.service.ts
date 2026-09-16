import { hashPassword, normalizeEmail } from "./password.service.js";
export class RegistrationService {
  constructor(private readonly users: { user: { findUnique(input: unknown): Promise<unknown>; create(input: unknown): Promise<unknown> } }) {}
  async register(displayName: string, email: string, password: string, locale: "fa" | "en") { const emailNormalized = normalizeEmail(email); if (await this.users.user.findUnique({ where: { emailNormalized } })) throw new Error("EMAIL_TAKEN"); return this.users.user.create({ data: { displayName: displayName.trim(), email: email.trim(), emailNormalized, passwordHash: await hashPassword(password), role: "USER", approval: "PENDING", locale } }); }
}
