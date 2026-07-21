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
          <p>This code expires in 30 minutes som do the necessary before then.</p>
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
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(180deg,#f8fafc 0%, #f3f4f6 100%); padding: 36px; color: #0f172a;">
          <div style="max-width:680px; margin:0 auto; background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 30px 80px rgba(15,23,42,0.08);">
            <div style="padding:36px; text-align:center; background:linear-gradient(135deg,#6d28d9 0%, #4338ca 100%); color:#fff;">
              <h1 style="margin:0;font-size:26px;font-weight:700;">Welcome to Tribes Capital</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">You're one step away from accessing your account.</p>
            </div>
            <div style="padding:28px 36px;">
              <p style="margin:0 0 12px;font-size:15px;color:#0f172a;">Hi there,</p>
              <p style="margin:0 0 20px;font-size:15px;color:#475569;">Thanks for signing up. Confirm your email to finish setting up your account and get started.</p>
              <div style="text-align:center;margin:26px 0;">
                <a href="${verificationUrl}" target="_blank" rel="noreferrer noopener" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#6d28d9;color:#fff;text-decoration:none;font-weight:700;box-shadow:0 12px 30px rgba(99,102,241,0.16);font-size:15px;">Confirm your email</a>
              </div>
              <p style="margin:0 0 12px;font-size:13px;color:#64748b;">If the button doesn't work, paste this link into your browser:</p>
              <p style="margin:0;word-break:break-all;font-size:13px;color:#0f172a;">${verificationUrl}</p>
              <div style="margin-top:26px;padding:18px;border-radius:12px;background:#f8fafc;color:#475569;font-size:13px;">
                <strong style="display:block;margin-bottom:8px;color:#0f172a;">Need help?</strong>
                <span>If you didn’t sign up, ignore this message or contact our support team at support@tribes.capital.</span>
              </div>
            </div>
            <div style="padding:18px 36px 28px;background:#fbfbfe;color:#9ca3af;font-size:12px;text-align:center;">
              <span>Tribes Capital • Building community for clean energy leaders</span>
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
        <div style="font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f7f7fb; padding:28px; color:#0f172a;">
          <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(2,6,23,0.06);">
            <div style="padding:28px 36px;text-align:center;">
              <h2 style="margin:0;font-size:22px;color:#0f172a;">Welcome, ${firstName}!</h2>
              <p style="margin:8px 0 18px;color:#475569;font-size:14px;">Thanks for joining Tribes Capital — we’re thrilled to have you.</p>
              <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                <a href="${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/g, '')}" style="padding:10px 16px;border-radius:10px;background:#6d28d9;color:#fff;text-decoration:none;font-weight:700;">Get started</a>
                <a href="${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/g, '')}/learning" style="padding:10px 16px;border-radius:10px;border:1px solid #e6e6ff;color:#6d28d9;text-decoration:none;">Explore learning hub</a>
              </div>
            </div>
            <div style="padding:18px 36px 30px;color:#475569;font-size:14px;">
              <p style="margin:0 0 12px;">Here are a few next steps to get the most out of your account:</p>
              <ul style="margin:0 0 12px 18px;">
                <li>Complete your profile and settings.</li>
                <li>Join upcoming events and office hours.</li>
                <li>Browse due diligence resources and courses.</li>
              </ul>
              <p style="margin:0;">If you need help, reply to this email or visit our support center.</p>
            </div>
          </div>
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
