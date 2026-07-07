jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;

  const createService = async (values: Record<string, string>) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => values[key]),
          },
        },
      ],
    }).compile();

    return module.get<MailService>(MailService);
  };

  it('builds a reset password email with MAIL_* configuration', async () => {
    service = await createService({
      MAIL_HOST: 'smtp.example.com',
      MAIL_PORT: '465',
      MAIL_SECURE: 'true',
      MAIL_USER: 'test@example.com',
      MAIL_PASS: 'secret',
      MAIL_FROM: 'noreply@example.com',
    });

    const result = await service.sendPasswordResetEmail('user@example.com', '123456');
    expect(result).toBe(true);
  });

  it('uses SMTP_* configuration when MAIL_* values are absent', async () => {
    service = await createService({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'test@example.com',
      SMTP_PASSWORD: 'secret',
      SMTP_FROM: 'noreply@example.com',
    });

    const result = await service.sendVerificationEmail('user@example.com', 'https://example.com/verify');
    expect(result).toBe(true);
  });
});
