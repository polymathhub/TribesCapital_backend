import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { AuthService } from './auth.service';
import { JwtTokenService } from './jwt-token.service';
import { MailService } from './mail.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('AuthService', () => {
  it('returns a 503 when the database is unavailable during login', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockRejectedValue(new Error('Can\'t reach database server at localhost:5432')),
      },
      isDatabaseAvailable: jest.fn().mockReturnValue(true),
    } as unknown as PrismaService;

    const service = new AuthService(
      prisma,
      {} as JwtTokenService,
      {} as MailService,
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
      {} as NotificationsService,
    );

    await expect(service.login({ email: 'user@example.com', password: 'Password123!' })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
