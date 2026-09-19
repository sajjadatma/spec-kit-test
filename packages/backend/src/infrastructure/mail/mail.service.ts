import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
export type ResetMail = { recipient: string; resetUrl: string; locale: "fa" | "en" };
export interface MailTransport { sendReset(message: ResetMail): Promise<void>; }
export class MailService { constructor(private readonly transport: MailTransport) {} async sendReset(message: ResetMail) { await this.transport.sendReset(message); } }
export class ResetMailCipher {
  private readonly key: Buffer;
  constructor(key = process.env.MAIL_OUTBOX_ENCRYPTION_KEY) { if (!key || Buffer.byteLength(key, "utf8") !== 32) throw new Error("MAIL_OUTBOX_ENCRYPTION_KEY_INVALID"); this.key = Buffer.from(key, "utf8"); }
  encrypt(message: ResetMail) { const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", this.key, iv); const body = Buffer.concat([cipher.update(JSON.stringify(message), "utf8"), cipher.final()]); return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${body.toString("base64url")}`; }
  decrypt(payload: string): ResetMail { const [iv, tag, body] = payload.split("."); if (!iv || !tag || !body) throw new Error("OUTBOX_PAYLOAD_INVALID"); const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(iv, "base64url")); decipher.setAuthTag(Buffer.from(tag, "base64url")); return JSON.parse(Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8")) as ResetMail; }
}
