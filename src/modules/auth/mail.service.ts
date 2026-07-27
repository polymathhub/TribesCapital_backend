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
      subject: 'Verify your Tribes Capital account',
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%); padding: 32px; color: #0f172a;">
          <div style="max-width:680px; margin:0 auto; background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 24px 70px rgba(15, 23, 42, 0.08); border:1px solid #e2e8f0;">
            <div style="padding:32px 36px 20px; text-align:center; background:linear-gradient(135deg,#6d28d9 0%, #2563eb 100%); color:#fff;">
              <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.16);font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Almost there</div>
              <h1 style="margin:12px 0 8px;font-size:28px;font-weight:800;line-height:1.2;">Verify your email</h1>
              <p style="margin:0;color:rgba(255,255,255,0.92);font-size:15px;">You’re one step away from unlocking your Tribes Capital workspace.</p>
            </div>
            <div style="padding:28px 36px 24px;">
              <p style="margin:0 0 10px;font-size:15px;color:#0f172a;">Hi there,</p>
              <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">Thanks for joining Tribes Capital. Please verify your email address to finish setting up your account and start exploring.</p>
              <div style="text-align:center;margin:24px 0 20px;">
                <a href="${verificationUrl}" target="_blank" rel="noreferrer noopener" style="display:inline-block;padding:14px 28px;border-radius:999px;background:linear-gradient(135deg,#6d28d9 0%, #4338ca 100%);color:#fff;text-decoration:none;font-weight:800;font-size:15px;box-shadow:0 12px 30px rgba(99,102,241,0.2);">Verify my email</a>
              </div>
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">If the button does not work, copy and paste this link into your browser:</p>
              <p style="margin:0;word-break:break-all;font-size:13px;color:#0f172a;background:#f8fafc;padding:10px 12px;border-radius:10px;">${verificationUrl}</p>
              <div style="margin-top:24px;padding:16px 18px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;font-size:13px;line-height:1.6;">
                <strong style="display:block;margin-bottom:6px;color:#0f172a;">Need help?</strong>
                If this wasn’t you, you can safely ignore this email or reach out to our support team at support@tribes.capital.
              </div>
            </div>
            <div style="padding:18px 36px 28px;background:#fbfdff;color:#94a3b8;font-size:12px;text-align:center;border-top:1px solid #eef2f7;">
              <span>Tribes Capital • Building community for clean energy leaders</span>
            </div>
          </div>
        </div>
      `,
      text: `Welcome to Tribes Capital! Verify your email by visiting ${verificationUrl}. If the button doesn't work, copy this link into your browser: ${verificationUrl}`,
    });
  }

  async sendWelcomeEmail(to: string, firstName = 'there'): Promise<boolean> {
    const frontendUrl = (process.env.FRONTEND_URL || 'https://community.tribes.capital').replace(/\/+$/g, '');

    return this.sendMail({
      to,
      subject: 'Welcome to Tribes Capital',
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%); padding: 32px; color: #0f172a;">
          <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(2,6,23,0.08);border:1px solid #e2e8f0;">
            <div style="padding:32px 36px 24px;text-align:center;background:linear-gradient(135deg,#6d28d9 0%, #2563eb 100%);color:#fff;">
              <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.16);font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Welcome aboard</div>
              <h2 style="margin:12px 0 8px;font-size:28px;font-weight:800;">Welcome, ${firstName}!</h2>
              <p style="margin:0;color:rgba(255,255,255,0.92);font-size:15px;line-height:1.6;">You’ve joined a vibrant community focused on learning, momentum, and clean energy opportunities.</p>
            </div>
            <div style="padding:28px 36px 24px;">
              <div style="text-align:center;margin-bottom:22px;">
                <a href="${frontendUrl}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:linear-gradient(135deg,#6d28d9 0%, #4338ca 100%);color:#fff;text-decoration:none;font-weight:800;font-size:15px;box-shadow:0 12px 30px rgba(99,102,241,0.2);">Open my dashboard</a>
              </div>
              <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:24px;">
                <a href="${frontendUrl}/learning" style="padding:10px 16px;border-radius:999px;border:1px solid #e2e8f0;color:#2563eb;text-decoration:none;font-weight:700;background:#f8fbff;">Explore learning hub</a>
                <a href="${frontendUrl}/events" style="padding:10px 16px;border-radius:999px;border:1px solid #e2e8f0;color:#334155;text-decoration:none;font-weight:700;background:#ffffff;">Join upcoming events</a>
              </div>
              <div style="padding:18px 20px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;">
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f172a;">Here’s how to get started:</p>
                <ul style="margin:0;padding-left:18px;color:#475569;font-size:14px;line-height:1.7;">
                  <li>Complete your profile and personalize your experience.</li>
                  <li>Join office hours and upcoming community events.</li>
                  <li>Browse courses, due diligence resources, and project opportunities.</li>
                </ul>
              </div>
            </div>
            <div style="padding:18px 36px 28px;background:#fbfdff;color:#94a3b8;font-size:12px;text-align:center;border-top:1px solid #eef2f7;">
              <span>Need help? Reply to this email or contact support@tribes.capital.</span>
            </div>
          </div>
        </div>
      `,
      text: `Welcome, ${firstName}! We’re excited to have you here at Tribes Capital. Open your dashboard to get started and explore the learning hub.`,
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
