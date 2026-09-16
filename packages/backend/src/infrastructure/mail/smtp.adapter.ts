import type { MailTransport, ResetMail } from "./mail.service.js";
export class LocalMailAdapter implements MailTransport { readonly deliveries: ResetMail[] = []; async sendReset(message: ResetMail) { this.deliveries.push({ ...message }); } }
