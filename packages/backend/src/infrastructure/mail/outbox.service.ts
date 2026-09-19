import type { MailService, ResetMailCipher } from "./mail.service.js";

export type ClaimedResetEmail = { id: string; encryptedPayload: string };
export interface ResetEmailOutboxStore {
  claimNext(now: Date): Promise<ClaimedResetEmail | null>;
  markSent(id: string): Promise<void>;
  markFailed(id: string, now: Date): Promise<void>;
}

/** Sends at most two attempts for a leased reset-email outbox item. */
export class ResetEmailOutboxService {
  constructor(private readonly store: ResetEmailOutboxStore, private readonly cipher: ResetMailCipher, private readonly mail: MailService) {}
  async processOne(now = new Date()) {
    const item = await this.store.claimNext(now);
    if (!item) return false;
    try { await this.mail.sendReset(this.cipher.decrypt(item.encryptedPayload)); await this.store.markSent(item.id); }
    catch { await this.store.markFailed(item.id, now); }
    return true;
  }
}
