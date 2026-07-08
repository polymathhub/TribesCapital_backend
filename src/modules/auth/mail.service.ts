import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly configService: ConfigService) {
    this.transporter = this.createTransporter();
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
          <p>Your Tribes Capital account is ready. Sign in and continue your learning journey.</p>
        </div>
      `,
    });
  }

  private async sendMail(options: { to: string; subject: string; html: string }): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email delivery is disabled because SMTP is not configured.');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.getFromAddress(),
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to send email', error instanceof Error ? error.stack : String(error));
      return false;
    }
  }

  private createTransporter(): Transporter | null {
    const skipTransport = this.getBooleanConfig('MAIL_SKIP_TRANSPORT') || this.getBooleanConfig('SMTP_SKIP_TRANSPORT');
    if (skipTransport) {
      return null;
    }

    const host = this.getStringConfig('MAIL_HOST') || this.getStringConfig('SMTP_HOST');
    const port = Number(this.getStringConfig('MAIL_PORT') || this.getStringConfig('SMTP_PORT') || '465');
    const secure = this.getBooleanConfig('MAIL_SECURE', this.getBooleanConfig('SMTP_SECURE', true));
    const user = this.getStringConfig('MAIL_USER') || this.getStringConfig('SMTP_USER');
    const pass = this.getStringConfig('MAIL_PASS') || this.getStringConfig('SMTP_PASSWORD');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP credentials are missing. Email delivery will be skipped.');
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      requireTLS: true,
      connectionTimeout: 10000,
    });
  }

  private getFromAddress(): string {
    return this.getStringConfig('MAIL_FROM') || this.getStringConfig('SMTP_FROM') || this.getStringConfig('MAIL_USER') || this.getStringConfig('SMTP_USER') || 'noreply@tribes.capital';
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
