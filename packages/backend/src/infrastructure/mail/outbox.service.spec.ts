import { describe, expect, it } from "vitest";
import { MailService, ResetMailCipher } from "./mail.service.js";
import { ResetEmailOutboxService } from "./outbox.service.js";

describe("ResetEmailOutboxService", () => {
  it("sends a decrypted item then removes its ciphertext", async () => {
    const cipher = new ResetMailCipher("12345678901234567890123456789012");
    let sent = false;
    let marked = false;
    const service = new ResetEmailOutboxService({ claimNext: async () => ({ id: "outbox-1", encryptedPayload: cipher.encrypt({ recipient: "member@example.com", resetUrl: "https://app.example/reset", locale: "en" }) }), markSent: async () => { marked = true; }, markFailed: async () => undefined }, cipher, new MailService({ sendReset: async () => { sent = true; } }));
    await service.processOne();
    expect(sent && marked).toBe(true);
  });
});
