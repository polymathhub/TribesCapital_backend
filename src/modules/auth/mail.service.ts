import { BrevoClient } from '@getbrevo/brevo';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly client: BrevoClient;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.getStringConfig('BREVO_API_KEY') || this.getStringConfig('SENDINBLUE_API_KEY') || this.getStringConfig('BREVO_KEY');
    this.client = new BrevoClient({ apiKey: apiKey ?? '' });
  }

  async sendPasswordResetEmail(to: string, code: string): Promise<boolean> {
    return this.sendMail({
      to,
      subject: 'Reset your Tribes Capital password',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Password reset requested</h2>
          <p>Use the verification code below to reset your password:</p>
          <div style="display: inline-block; padding: 12px 16px; border-radius: 8px; background: #f3f4f6; font-size: 24px; font-weight: 700; letter-spacing: 2px;">
            ${code}
          </div>
          <p>This code expires in 30 minutes.</p>
        </div>
      `,
    });
  }

  async sendVerificationEmail(to: string, verificationUrl: string): Promise<boolean> {
    return this.sendMail({
      to,
      subject: 'Verify your Tribes Capital account',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Welcome to Tribes Capital</h2>
          <p>Verify your email address to get started.</p>
          <p><a href="${verificationUrl}" target="_blank" rel="noreferrer">Verify email</a></p>
        </div>
      `,
    });
  }

  async sendWelcomeEmail(to: string, firstName = 'there'): Promise<boolean> {
    return this.sendMail({
      to,
      subject: 'Welcome to Tribes Capital',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Welcome, ${firstName}!</h2>
          <p> Look who just joined the tribe!

        Welcome to Tribes Capital where ideas grow, communities thrive, and opportunities have a funny habit of finding the right people.

        We'd love to tell you this email comes with free money... but our lawyers strongly suggested we don't.

        What you do get is access to a community built for builders, investors, founders, creators, and curious minds who believe the future is better when we build it together.

        Here's what you can do next:
        Complete your signup.go and log in 
        Connect with other members and learn about energy on the learnighub.
        Join conversations that matter on the office hour and events .
        Explore resources and opportunities on due diligence.
        Start making an impact!.

        If you ever get lost, don't panic. We have buttons, menus, and a support team that's much friendlier than a "404 Not Found" page.

       We're genuinely excited to have you here, and we can't wait to see what you'll build, share, and achieve with the community.

      Welcome aboard!

    The Tribes Capital Team

    P.S. If you suddenly become wildly successful after joining, we'd like to think we had something to do with it.
          </p>
        </div>
      `,
    });
  }

  private async sendMail(options: { to: string; subject: string; html: string }): Promise<boolean> {
    const apiKey = this.getStringConfig('BREVO_API_KEY') || this.getStringConfig('SENDINBLUE_API_KEY') || this.getStringConfig('BREVO_KEY');
    const fromAddress = this.getFromAddress();

    if (!apiKey) {
      this.logger.warn('Brevo API key is not configured. Email delivery will be skipped.');
      return false;
    }

    try {
      await this.client.transactionalEmails.sendTransacEmail({
        sender: {
          name: this.getSenderName(fromAddress),
          email: this.getSenderEmail(fromAddress),
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
      });

      this.logger.log(`Email sent successfully to ${options.to} via Brevo API.`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error instanceof Error ? error.stack : String(error));
      return false;
    }
  }

  private getFromAddress(): string {
    return this.getStringConfig('BREVO_FROM') || this.getStringConfig('MAIL_FROM') || this.getStringConfig('SMTP_FROM') || 'noreply@tribescapital.com';
  }

  private getSenderName(fromAddress: string): string {
    const explicitName = this.getStringConfig('MAIL_FROM_NAME') || this.getStringConfig('BREVO_FROM_NAME');
    if (explicitName) {
      return explicitName;
    }

    const match = fromAddress.match(/^\s*"?([^"<]+)"?\s*<([^>]+)>\s*$/i);
    return match?.[1]?.trim() || 'TribesCapital';
  }

  private getSenderEmail(fromAddress: string): string {
    const explicitEmail = this.getStringConfig('MAIL_FROM_EMAIL') || this.getStringConfig('BREVO_FROM_EMAIL');
    if (explicitEmail) {
      return explicitEmail;
    }

    const match = fromAddress.match(/^\s*"?([^"<]+)"?\s*<([^>]+)>\s*$/i);
    return match?.[2]?.trim() || fromAddress;
  }

  private getStringConfig(key: string): string | undefined {
    const value = this.configService.get<string>(key) ?? process.env[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private getBooleanConfig(key: string, fallback = false): boolean {
    const value = this.getStringConfig(key);
    if (!value) {
      return fallback;
    }

    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
}
