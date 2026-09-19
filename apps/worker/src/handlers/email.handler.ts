import { ResetMailCipher, type MailService, type ResetMail } from "@industrial-dashboard/backend";
export async function deliverReset(mail: MailService, message: ResetMail) { await mail.sendReset(message); }
export async function deliverEncryptedReset(mail: MailService, encryptedPayload: string, cipher = new ResetMailCipher()) { await mail.sendReset(cipher.decrypt(encryptedPayload)); }
