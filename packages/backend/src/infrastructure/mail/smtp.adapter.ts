import type { MailTransport, ResetMail } from "./mail.service.js";
import nodemailer, { type Transporter } from "nodemailer";

export class LocalMailAdapter implements MailTransport { readonly deliveries: ResetMail[] = []; async sendReset(message: ResetMail) { this.deliveries.push({ ...message }); } }

/** SMTP transport for production and the local Mailpit SMTP listener. */
export class SmtpMailAdapter implements MailTransport {
  private readonly transport: Transporter;

  constructor(options: { host?: string; port?: number; secure?: boolean; user?: string; password?: string; from?: string } = {}) {
    const port = options.port ?? Number(process.env.SMTP_PORT ?? 1025);
    this.transport = nodemailer.createTransport({
      host: options.host ?? process.env.SMTP_HOST ?? "127.0.0.1",
      port,
      secure: options.secure ?? process.env.SMTP_SECURE === "true",
      auth: options.user ?? process.env.SMTP_USER ? { user: options.user ?? process.env.SMTP_USER, pass: options.password ?? process.env.SMTP_PASSWORD } : undefined,
      requireTLS: process.env.SMTP_REQUIRE_TLS === "true",
    });
    this.from = options.from ?? process.env.SMTP_FROM ?? "no-reply@industrial-dashboard.local";
  }

  private readonly from: string;

  async sendReset(message: ResetMail): Promise<void> {
    const isPersian = message.locale === "fa";
    await this.transport.sendMail({
      from: this.from,
      to: message.recipient,
      subject: isPersian ? "بازیابی گذرواژه داشبورد صنعتی" : "Reset your Industrial Dashboard password",
      text: isPersian
        ? `برای تعیین گذرواژه جدید، این پیوند را تا ۳۰ دقیقه باز کنید:\n${message.resetUrl}`
        : `Use this link within 30 minutes to set a new password:\n${message.resetUrl}`,
    });
  }
}
