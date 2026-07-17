<<<<<<< HEAD
import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, EmailSendOptions } from './email-provider.interface';
=======
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EMAIL_PROVIDER, EmailProvider, EmailSendOptions } from './email-provider.interface';
>>>>>>> f8bdf42 (a lot of work compiled and done under pressure)

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

<<<<<<< HEAD
  constructor(private readonly emailProvider: EmailProvider) {}
=======
  constructor(@Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider) {}
>>>>>>> f8bdf42 (a lot of work compiled and done under pressure)

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
      subject: 'Verify your Tribes Capital account',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Welcome to Tribes Capital</h2>
          <p>Verify your email address to get started.</p>
          <p><a href="${verificationUrl}" target="_blank" rel="noreferrer">Verify email</a></p>
        </div>
      `,
      text: `Verify your email address by visiting ${verificationUrl}`,
    });
  }

  async sendWelcomeEmail(to: string, firstName = 'there'): Promise<boolean> {
    return this.sendMail({
      to,
      subject: 'Welcome to Tribes Capital',
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Welcome, ${firstName}!</h2>
<<<<<<< HEAD
          <p>Thank you for joining Tribes Capital. Your account is now active and ready to use.</p>
          <p>Here are a few next steps to get started:</p>
          <ul>
            <li>Complete your profile and sign in.</li>
            <li>Explore the learning hub, events, and due diligence resources.</li>
            <li>Connect with other members and engage with the community.</li>
          </ul>
          <p>If you need help, please visit our support page or reply to this email.</p>
          <p>Welcome aboard,</p>
=======
          <p>Welcome to Tribes Capital where ideas grow, communities thrive, and opportunities have a funny habit of finding the right people.</p>
          <p>Here’s what you can do next:</p>
          <ul>
            <li>Complete your signup and sign in</li>
            <li>Explore the learning hub</li>
            <li>Join office hours and events</li>
            <li>Review due diligence materials</li>
          </ul>
          <p>We’re excited to have you here.</p>
>>>>>>> f8bdf42 (a lot of work compiled and done under pressure)
          <p>The Tribes Capital Team</p>
        </div>
      `,
      text: `Welcome, ${firstName}! We’re excited to have you here at Tribes Capital.`,
    });
  }

<<<<<<< HEAD
=======
  async sendGenericEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    return this.sendMail({ to, subject, html, text });
  }

>>>>>>> f8bdf42 (a lot of work compiled and done under pressure)
  private async sendMail(options: EmailSendOptions): Promise<boolean> {
    try {
      return await this.emailProvider.send(options);
    } catch (error) {
      this.logger.error(`Email provider failed for ${options.to}`, error instanceof Error ? error.stack : String(error));
      return false;
    }
  }
}
