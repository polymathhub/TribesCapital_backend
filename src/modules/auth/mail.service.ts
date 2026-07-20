import { Inject, Injectable, Logger } from '@nestjs/common';
import { EMAIL_PROVIDER, EmailProvider, EmailSendOptions } from './email-provider.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(@Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider) {}

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
      text: `Password reset requested. Use code ${code} to reset your password. This code expires in 30 minutes.`,
    });
  }

  async sendVerificationEmail(to: string, verificationUrl: string): Promise<boolean> {
    return this.sendMail({
      to,
      subject: 'Confirm your Tribes Capital account',
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f7f8fb; padding: 32px; color: #111827;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);">
            <div style="padding: 32px 32px 16px; background: linear-gradient(135deg, #7c3aed 0%, #4338ca 100%); color: #ffffff; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; letter-spacing: -0.03em;">Welcome to Tribes Capital</h1>
              <p style="margin: 8px 0 0; font-size: 15px; color: rgba(255,255,255,0.85);">Your next step is confirming your email so you can sign in.</p>
            </div>
            <div style="padding: 32px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #334155;">Hi there,</p>
              <p style="margin: 0 0 20px; font-size: 15px; color: #475569;">Thanks for creating an account at Tribes Capital. Tap the button below to confirm your email and continue to the login page.</p>
              <div style="text-align: center; margin: 28px 0;">
                <a
                  href="${verificationUrl}"
                  target="_blank"
                  rel="noreferrer noopener"
                  style="display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 26px; border-radius: 999px; background: #7c3aed; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; box-shadow: 0 12px 30px rgba(124, 58, 237, 0.24);"
                >
                  Confirm email & sign in
                </a>
              </div>
              <p style="margin: 0 0 12px; font-size: 14px; color: #64748b;">If the button does not work, copy and paste the link below into your browser:</p>
              <p style="margin: 0; word-break: break-all; font-size: 13px; color: #475569;">${verificationUrl}</p>
              <div style="margin-top: 32px; padding: 20px; background: #f8fafc; border-radius: 16px; color: #64748b; font-size: 13px;">
                <p style="margin: 0 0 8px; font-weight: 600; color: #334155;">Need help?</p>
                <p style="margin: 0;">If you did not sign up for Tribes Capital, please ignore this message or contact support.</p>
              </div>
            </div>
          </div>
        </div>
      `,
      text: `Welcome to Tribes Capital! Confirm your email by visiting ${verificationUrl}. If the button doesn't work, copy this link into your browser: ${verificationUrl}`,
    });
  }

  async sendWelcomeEmail(to: string, firstName = 'there'): Promise<boolean> {
    return this.sendMail({
      to,
      subject: 'Welcome to Tribes Capital',
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Welcome, ${firstName}!</h2>
          <p>Thank you for joining Tribes Capital. Your account is now active and ready to use.</p>
          <p>Here are a few next steps to get started:</p>
          <ul>
            <li>Complete your profile and sign in.</li>
            <li>Explore the learning hub, events, and due diligence resources.</li>
            <li>Connect with other members and engage with the community.</li>
          </ul>
          <p>If you need help, please visit our support page or reply to this email.</p>
          <p>Welcome aboard,</p>
          <p>The Tribes Capital Team</p>
        </div>
      `,
      text: `Welcome, ${firstName}! We’re excited to have you here at Tribes Capital.`,
    });
  }

  async sendGenericEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    return this.sendMail({ to, subject, html, text });
  }

  private async sendMail(options: EmailSendOptions): Promise<boolean> {
    try {
      return await this.emailProvider.send(options);
    } catch (error) {
      this.logger.error(`Email provider failed for ${options.to}`, error instanceof Error ? error.stack : String(error));
      return false;
    }
  }
}
