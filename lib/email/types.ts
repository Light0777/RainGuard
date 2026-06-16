export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailConfig {
  apiKey: string;
  fromAddress: string;
  fromName?: string;
}

export interface GmailConfig {
  user: string;
  appPassword: string;
  fromName?: string;
}
