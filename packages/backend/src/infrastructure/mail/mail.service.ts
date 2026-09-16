export type ResetMail = { recipient: string; resetUrl: string; locale: "fa" | "en" };
export interface MailTransport { sendReset(message: ResetMail): Promise<void>; }
export class MailService { constructor(private readonly transport: MailTransport) {} async sendReset(message: ResetMail) { await this.transport.sendReset(message); } }
