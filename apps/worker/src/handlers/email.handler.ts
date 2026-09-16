import type { MailService, ResetMail } from "@industrial-dashboard/backend";
export async function deliverReset(mail: MailService, message: ResetMail) { await mail.sendReset(message); }
