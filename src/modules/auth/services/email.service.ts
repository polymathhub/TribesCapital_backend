import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailVerificationEmailData {
  email: string;
  firstName: string;
  verificationLink: string;
  expiresIn: string;
}

export interface PasswordResetEmailData {
  email: string;
  firstName: string;
  resetLink: string;
  expiresIn: string;
}

export interface WelcomeEmailData {
  email: string;
  firstName: string;
}

export interface PasswordChangedEmailData {
  email: string;
  firstName: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter?: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const emailConfig = this.configService.get('email');

    if (!emailConfig || !emailConfig.enabled) {
      this.logger.warn('Email service disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.password,
      },
    });
  }

  async sendVerificationEmail(
    data: EmailVerificationEmailData,
  ): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn('Email service not initialized, skipping verification email');
        return true;
      }

      const html = this.getVerificationEmailTemplate(data);

      await this.transporter.sendMail({
        from: this.configService.get('email.from'),
        to: data.email,
        subject: 'Verify Your Email Address - Tribes Capital',
        html,
      });

      this.logger.debug(`Verification email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(
    data: PasswordResetEmailData,
  ): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn('Email service not initialized, skipping reset email');
        return true;
      }

      const html = this.getPasswordResetEmailTemplate(data);

      await this.transporter.sendMail({
        from: this.configService.get('email.from'),
        to: data.email,
        subject: 'Reset Your Password - Tribes Capital',
        html,
      });

      this.logger.debug(`Password reset email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send password reset email', error);
      throw error;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn('Email service not initialized, skipping welcome email');
        return true;
      }

      const html = this.getWelcomeEmailTemplate(data);

      await this.transporter.sendMail({
        from: this.configService.get('email.from'),
        to: data.email,
        subject: 'Welcome to Tribes Capital',
        html,
      });

      this.logger.debug(`Welcome email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send welcome email', error);
      throw error;
    }
  }

  async sendPasswordChangedEmail(data: PasswordChangedEmailData): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn('Email service not initialized, skipping password changed email');
        return true;
      }

      const html = this.getPasswordChangedEmailTemplate(data);

      await this.transporter.sendMail({
        from: this.configService.get('email.from'),
        to: data.email,
        subject: 'Your password has been changed',
        html,
      });

      this.logger.debug(`Password changed email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send password changed email', error);
      throw error;
    }
  }

  private getVerificationEmailTemplate(
    data: EmailVerificationEmailData,
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      max-width: 600px;
      width: 100%;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
    }
    
    .tagline {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
    }
    
    .content {
      padding: 40px;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    
    .description {
      color: #6b7280;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 14px 40px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      margin-bottom: 30px;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
    }
    
    .or-text {
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
      margin-bottom: 20px;
    }
    
    .link-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      word-break: break-all;
      font-size: 12px;
      color: #667eea;
      font-family: 'Courier New', monospace;
      margin-bottom: 30px;
    }
    
    .security-notice {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 30px;
    }
    
    .security-notice-title {
      color: #1e40af;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .security-notice-text {
      color: #1e3a8a;
      font-size: 13px;
      line-height: 1.5;
    }
    
    .divider {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 30px 0;
    }
    
    .footer {
      background: #f9fafb;
      padding: 30px 40px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    
    .footer-text {
      color: #6b7280;
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    
    .footer-links {
      font-size: 12px;
    }
    
    .footer-links a {
      color: #667eea;
      text-decoration: none;
      margin: 0 10px;
    }
    
    .footer-links a:hover {
      text-decoration: underline;
    }
    
    .expiration {
      color: #dc2626;
      font-weight: 600;
      font-size: 14px;
      background: #fee2e2;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      text-align: center;
    }
    
    @media (max-width: 600px) {
      .container {
        border-radius: 0;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .greeting {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">🏛️ Tribes Capital</div>
      <div class="tagline">Welcome to the Future of Investment</div>
    </div>
    
    <!-- Content -->
    <div class="content">
      <div class="greeting">Welcome, ${data.firstName}!</div>
      
      <p class="description">
        Thank you for creating your account with Tribes Capital. We're excited to have you on board!
      </p>
      
      <p class="description">
        To get started, please verify your email address by clicking the button below:
      </p>
      
      <a href="${data.verificationLink}" class="cta-button">Verify Email Address</a>
      
      <div class="or-text">OR copy and paste this link in your browser:</div>
      
      <div class="link-box">${data.verificationLink}</div>
      
      <div class="expiration">
        ⏰ This link expires in ${data.expiresIn}
      </div>
      
      <div class="security-notice">
        <div class="security-notice-title">🔒 Security Notice</div>
        <div class="security-notice-text">
          If you didn't create this account, please ignore this email. Your account won't be activated until you verify your email.
        </div>
      </div>
    </div>
    
    <hr class="divider" />
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">
        © 2024 Tribes Capital. All rights reserved.
      </div>
      <div class="footer-text">
        Need help? <a href="mailto:support@tribescapital.com" style="color: #667eea;">Contact our support team</a>
      </div>
      <div class="footer-links">
        <a href="https://tribescapital.com/privacy">Privacy Policy</a>
        <a href="https://tribescapital.com/terms">Terms of Service</a>
        <a href="https://tribescapital.com/help">Help Center</a>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getPasswordResetEmailTemplate(data: PasswordResetEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      max-width: 600px;
      width: 100%;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
    }
    
    .tagline {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
    }
    
    .content {
      padding: 40px;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    
    .description {
      color: #6b7280;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 14px 40px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      margin-bottom: 30px;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
    }
    
    .or-text {
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
      margin-bottom: 20px;
    }
    
    .link-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      word-break: break-all;
      font-size: 12px;
      color: #667eea;
      font-family: 'Courier New', monospace;
      margin-bottom: 30px;
    }
    
    .security-notice {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 30px;
    }
    
    .security-notice-title {
      color: #991b1b;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .security-notice-text {
      color: #7f1d1d;
      font-size: 13px;
      line-height: 1.5;
    }
    
    .divider {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 30px 0;
    }
    
    .footer {
      background: #f9fafb;
      padding: 30px 40px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    
    .footer-text {
      color: #6b7280;
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    
    .footer-links {
      font-size: 12px;
    }
    
    .footer-links a {
      color: #667eea;
      text-decoration: none;
      margin: 0 10px;
    }
    
    .footer-links a:hover {
      text-decoration: underline;
    }
    
    .expiration {
      color: #dc2626;
      font-weight: 600;
      font-size: 14px;
      background: #fee2e2;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      text-align: center;
    }
    
    @media (max-width: 600px) {
      .container {
        border-radius: 0;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .greeting {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">🏛️ Tribes Capital</div>
      <div class="tagline">Secure Account Recovery</div>
    </div>
    
    <!-- Content -->
    <div class="content">
      <div class="greeting">Reset Your Password</div>
      
      <p class="description">
        We received a request to reset the password for your Tribes Capital account. If this wasn't you, please disregard this email.
      </p>
      
      <p class="description">
        To reset your password, click the button below:
      </p>
      
      <a href="${data.resetLink}" class="cta-button">Reset Password</a>
      
      <div class="or-text">OR copy and paste this link in your browser:</div>
      
      <div class="link-box">${data.resetLink}</div>
      
      <div class="expiration">
        ⏰ This link expires in ${data.expiresIn}
      </div>
      
      <div class="security-notice">
        <div class="security-notice-title">⚠️ Security Warning</div>
        <div class="security-notice-text">
          If you didn't request a password reset, don't click the link above. Your password will remain the same. If you believe someone is trying to access your account, please contact our support team immediately.
        </div>
      </div>
    </div>
    
    <hr class="divider" />
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">
        © 2024 Tribes Capital. All rights reserved.
      </div>
      <div class="footer-text">
        Need help? <a href="mailto:support@tribescapital.com" style="color: #667eea;">Contact our support team</a>
      </div>
      <div class="footer-links">
        <a href="https://tribescapital.com/privacy">Privacy Policy</a>
        <a href="https://tribescapital.com/terms">Terms of Service</a>
        <a href="https://tribescapital.com/help">Help Center</a>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}

  private getWelcomeEmailTemplate(data: WelcomeEmailData): string {
    return `
<html><body style="font-family: sans-serif;">
  <h2>Welcome, ${data.firstName}!</h2>
  <p>Thanks for joining Tribes Capital. We're excited to have you.</p>
  <p>Get started by exploring your dashboard and completing your profile.</p>
  <p>If you need help, reply to this email or visit our Help Center.</p>
  <hr />
  <p style="font-size:12px;color:#666;">© Tribes Capital</p>
</body></html>
    `;
  }

  private getPasswordChangedEmailTemplate(data: PasswordChangedEmailData): string {
    return `
<html><body style="font-family: sans-serif;">
  <h2>Password changed</h2>
  <p>Hi ${data.firstName},</p>
  <p>This is a confirmation that your account password was successfully changed.</p>
  <p>If you didn't make this change, please contact support immediately.</p>
  <hr />
  <p style="font-size:12px;color:#666;">© Tribes Capital</p>
</body></html>
    `;
  }
