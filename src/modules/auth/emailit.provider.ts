import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider, EmailSendOptions } from './email-provider.interface';

@Injectable()
export class EmailitProvider implements EmailProvider {
  readonly name = 'emailit';
  private readonly logger = new Logger(EmailitProvider.name);
  private readonly maxRetries = 3;
  private readonly timeoutMs = 10000;

  constructor(private readonly configService: ConfigService) {}

  async send(options: EmailSendOptions): Promise<boolean> {
    const apiKey = this.getStringConfig('EMAILIT_API_KEY');
    const apiUrl = this.getStringConfig('EMAILIT_API_URL') || 'https://api.emailit.com/v2/emails';
    const fromAddress = this.getFromAddress();

    if (!apiKey) {
      this.logger.warn('Emailit API key is not configured. Email delivery will be skipped.');
      return false;
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await this.request(
          apiUrl,
          {
            from: fromAddress,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text ?? this.stripHtml(options.html),
          },
          apiKey,
        );

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Emailit API returned ${response.status}: ${body}`);
        }

        this.logger.log(`Email sent successfully to ${options.to} via Emailit API on attempt ${attempt}.`);
        return true;
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === this.maxRetries;
        this.logger.warn(`Emailit attempt ${attempt}/${this.maxRetries} failed for ${options.to}: ${error instanceof Error ? error.message : String(error)}`);
        if (isLastAttempt) {
          break;
        }
        await this.delay(250 * attempt);
      }
    }

    this.logger.error(`Failed to send email to ${options.to} via Emailit API`, lastError instanceof Error ? lastError.stack : String(lastError));
    return false;
  }

  private async request(url: string, payload: Record<string, unknown>, apiKey: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getFromAddress(): string {
    return this.getStringConfig('MAIL_FROM') || this.getStringConfig('EMAILIT_FROM') || 'noreply@tribescapital.com';
  }

  private getStringConfig(key: string): string | undefined {
    const value = this.configService.get<string>(key) ?? process.env[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
}
