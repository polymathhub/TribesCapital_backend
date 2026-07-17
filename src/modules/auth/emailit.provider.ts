import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider, EmailSendOptions } from './email-provider.interface';

@Injectable()
export class EmailitProvider implements EmailProvider {
  readonly name = 'emailit';
  private readonly logger = new Logger(EmailitProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async send(options: EmailSendOptions): Promise<boolean> {
    const apiKey = this.getStringConfig('EMAILIT_API_KEY');
    const apiUrl = this.getStringConfig('EMAILIT_API_URL') || 'https://api.emailit.com/v1/send';
    const fromAddress = this.getFromAddress();

    if (!apiKey) {
      this.logger.warn('Emailit API key is not configured. Email delivery will be skipped.');
      return false;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Emailit API returned ${response.status}: ${body}`);
      }

      this.logger.log(`Email sent successfully to ${options.to} via Emailit API.`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to} via Emailit API`, error instanceof Error ? error.stack : String(error));
      return false;
    }
  }

  private getFromAddress(): string {
    return this.getStringConfig('MAIL_FROM') || this.getStringConfig('EMAILIT_FROM') || 'noreply@tribescapital.com';
  }

  private getStringConfig(key: string): string | undefined {
    const value = this.configService.get<string>(key) ?? process.env[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
}
