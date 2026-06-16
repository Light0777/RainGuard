import nodemailer from "nodemailer";
import { withRetry } from "@/lib/weather/retry";
import type { SendEmailParams, EmailResult, GmailConfig } from "./types";

export class GmailClient {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;
  private fromName: string;

  constructor(config: GmailConfig) {
    if (!config.user || !config.appPassword) {
      throw new Error("Gmail user and app password are required");
    }
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.user,
        pass: config.appPassword,
      },
    });
    this.fromAddress = config.user;
    this.fromName = config.fromName ?? "RainGuard";
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      const result = await withRetry(
        () => this.doSend(params),
        { maxRetries: 2, baseDelayMs: 2000, maxDelayMs: 10000 }
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async doSend(params: SendEmailParams): Promise<EmailResult> {
    const info = await this.transporter.sendMail({
      from: `${this.fromName} <${this.fromAddress}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  }
}
