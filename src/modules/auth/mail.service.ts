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
    const targetUrl = verificationUrl.replace(/\/+$/, '');

    return this.sendMail({
      to,
      subject: 'Verify your Tribes Capital account',
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f4f7fb; padding:24px 12px; color:#0f172a;">
          <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 16px 40px rgba(15, 23, 42, 0.09); border:1px solid #e5e7eb;">
            <div style="padding:32px 24px 24px; text-align:center; background:linear-gradient(135deg,#0f172a 0%, #4f46e5 55%, #2563eb 100%); color:#fff;">
              <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.16);font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Almost there</div>
              <h1 style="margin:12px 0 8px;font-size:26px;font-weight:800;line-height:1.2;">Verify your email</h1>
              <p style="margin:0 auto;max-width:520px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.92);">You’re almost ready to unlock your Tribes Capital workspace.</p>
            </div>
            <div style="padding:28px 24px 24px;">
              <p style="margin:0 0 8px;font-size:15px;color:#0f172a;">Hi there,</p>
              <p style="margin:0 0 18px;font-size:15px;color:#475569;line-height:1.7;">Thanks for joining Tribes Capital. Please open the website to continue and get started.</p>
              <div style="text-align:center;margin:22px 0 20px;">
                <a href="${targetUrl}" target="_blank" rel="noreferrer noopener" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 10px 24px rgba(37, 99, 235, 0.22);">Open Tribes Capital</a>
              </div>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;">
                <p style="margin:0 0 8px;font-size:13px;color:#64748b;">If the button doesn’t work, use this link:</p>
                <p style="margin:0;word-break:break-all;font-size:13px;color:#0f172a;">${targetUrl}</p>
              </div>
              <div style="margin-top:20px;padding:16px 18px;border-radius:12px;background:#fefce8;border:1px solid #fde68a;color:#854d0e;font-size:13px;line-height:1.6;">
                <strong style="display:block;margin-bottom:6px;color:#713f12;">Need help?</strong>
                If this wasn’t you, you can safely ignore this email or contact support@tribes.capital.
              </div>
            </div>
            <div style="padding:18px 24px 24px;background:#fbfdff;color:#94a3b8;font-size:12px;text-align:center;border-top:1px solid #eef2f7;">
              <span>Tribes Capital • Building community for clean energy leaders</span>
            </div>
          </div>
        </div>
      `,
      text: `Welcome to Tribes Capital! Open the site to continue: ${targetUrl}`,
    });
  }

  async sendWelcomeEmail(to: string, firstName = 'there'): Promise<boolean> {
    const frontendUrl = (process.env.FRONTEND_URL || 'https://community.tribes.capital').replace(/\/+$/g, '');
    const siteUrl = frontendUrl;

    return this.sendMail({
      to,
      subject: 'Welcome to Tribes Capital',
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f4f7fb; padding:24px 12px; color:#0f172a;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 16px 40px rgba(2,6,23,0.08);border:1px solid #e5e7eb;">
            <div style="padding:32px 24px 24px;text-align:center;background:linear-gradient(135deg,#0f172a 0%, #4f46e5 55%, #2563eb 100%);color:#fff;">
              <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.16);font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Welcome aboard</div>
              <h2 style="margin:12px 0 8px;font-size:26px;font-weight:800;">Welcome, ${firstName}!</h2>
              <p style="margin:0 auto;max-width:520px;color:rgba(255,255,255,0.92);font-size:15px;line-height:1.6;">You’ve joined a vibrant community focused on learning, momentum, and clean energy opportunities.</p>
            </div>
            <div style="padding:28px 24px 24px;">
              <div style="text-align:center;margin-bottom:20px;">
                <a href="${siteUrl}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 10px 24px rgba(37, 99, 235, 0.22);">Open Tribes Capital</a>
              </div>
              <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:24px;">
                <a href="${siteUrl}" style="padding:10px 16px;border-radius:999px;border:1px solid #e2e8f0;color:#2563eb;text-decoration:none;font-weight:700;background:#f8fbff;">Explore the community</a>
                <a href="${siteUrl}" style="padding:10px 16px;border-radius:999px;border:1px solid #e2e8f0;color:#334155;text-decoration:none;font-weight:700;background:#ffffff;">See what’s next</a>
              </div>
              <div style="padding:18px 20px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;">
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f172a;">Here’s how to get started:</p>
                <ul style="margin:0;padding-left:18px;color:#475569;font-size:14px;line-height:1.7;">
                  <li>Sign in and complete your profile.</li>
                  <li>Join community events and office hours.</li>
                  <li>Explore learning resources and opportunities.</li>
                </ul>
              </div>
            </div>
            <div style="padding:16px 20px 24px;background:#fbfdff;color:#94a3b8;font-size:12px;text-align:center;border-top:1px solid #eef2f7;">
              <span>Need help? Reply to this email or contact support@tribes.capital.</span>
            </div>
          </div>
        </div>
      `,
      text: `Welcome, ${firstName}! We’re excited to have you here at Tribes Capital. Go to ${siteUrl} to get started.`,
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
