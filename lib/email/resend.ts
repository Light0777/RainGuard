import { Resend } from "resend";
import { withRetry } from "@/lib/weather/retry";
import type { SendEmailParams, EmailResult, EmailConfig } from "./types";

export class ResendClient {
  private client: Resend;
  private fromAddress: string;
  private fromName: string;

  constructor(config: EmailConfig) {
    if (!config.apiKey) {
      throw new Error("Resend API key is required");
    }
    if (!config.fromAddress) {
      throw new Error("Resend fromAddress is required");
    }
    this.client = new Resend(config.apiKey);
    this.fromAddress = config.fromAddress;
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
    const res = await this.client.emails.send({
      from: `${this.fromName} <${this.fromAddress}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (res.error) {
      throw new Error(res.error.message);
    }

    return {
      success: true,
      messageId: res.data?.id,
    };
  }
}
