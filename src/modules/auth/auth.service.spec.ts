import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { AuthService } from './auth.service';
import { JwtTokenService } from './jwt-token.service';
import { MailService } from './mail.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('AuthService', () => {
  beforeEach(() => {
    delete process.env.DB_SKIP;
  });

  afterEach(() => {
    delete process.env.DB_SKIP;
  });

  it('returns a 503 when the database is unavailable during login', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockRejectedValue(new Error('Can\'t reach database server at localhost:5432')),
      },
    } as unknown as PrismaService;

    const service = new AuthService(
      prisma,
      {} as JwtTokenService,
      {} as MailService,
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
    );

    await expect(service.login({ email: 'user@example.com', password: 'Password123!' })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('returns unauthorized for invalid password hashes instead of crashing', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          password: 'not-a-valid-bcrypt-hash',
          isActive: true,
          emailVerified: true,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as unknown as PrismaService;

    const service = new AuthService(
      prisma,
      {} as JwtTokenService,
      {} as MailService,
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
    );

    await expect(service.login({ email: 'user@example.com', password: 'Password123!' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns auth tokens immediately when email verification is disabled', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          emailVerified: false,
          emailVerificationToken: 'token',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as unknown as PrismaService;

    const jwtTokenService = {
      issueTokenPair: jest.fn().mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: 3600 }),
    } as unknown as JwtTokenService;

    const service = new AuthService(
      prisma,
      jwtTokenService,
      {
        sendWelcomeEmail: jest.fn().mockResolvedValue(true),
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
      } as unknown as MailService,
      { get: jest.fn((key: string) => (key === 'REQUIRE_EMAIL_VERIFICATION' ? 'false' : undefined)) } as unknown as ConfigService,
    );

    const response = await service.register({
      email: 'user@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(response).toEqual(expect.objectContaining({ accessToken: 'access-token' }));
    expect(response).toEqual(expect.objectContaining({ refreshToken: 'refresh-token' }));
  });

  it('defaults to allowing immediate sign-in when the verification setting is missing', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          emailVerified: false,
          emailVerificationToken: 'token',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as unknown as PrismaService;

    const jwtTokenService = {
      issueTokenPair: jest.fn().mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: 3600 }),
    } as unknown as JwtTokenService;

    const service = new AuthService(
      prisma,
      jwtTokenService,
      {
        sendWelcomeEmail: jest.fn().mockResolvedValue(true),
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
      } as unknown as MailService,
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
    );

    const response = await service.register({
      email: 'user@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(response).toEqual(expect.objectContaining({ accessToken: 'access-token' }));
    expect(response).toEqual(expect.objectContaining({ refreshToken: 'refresh-token' }));
  });

  it('still issues auth tokens when verification is enabled and a verification email is sent', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          emailVerified: false,
          emailVerificationToken: 'token',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    } as unknown as PrismaService;

    const jwtTokenService = {
      issueTokenPair: jest.fn().mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: 3600 }),
    } as unknown as JwtTokenService;

    const mail = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(true),
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
    } as unknown as MailService;

    const service = new AuthService(
      prisma,
      jwtTokenService,
      mail,
      { get: jest.fn((key: string) => (key === 'REQUIRE_EMAIL_VERIFICATION' ? 'true' : undefined)) } as unknown as ConfigService,
    );

    const response = await service.register({
      email: 'user@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(response).toEqual(expect.objectContaining({ accessToken: 'access-token' }));
    expect(response).toEqual(expect.objectContaining({ refreshToken: 'refresh-token' }));
    expect(mail.sendVerificationEmail).toHaveBeenCalled();
  });

  it('returns a 503 when the database is skipped or unavailable during register and login', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockRejectedValue(new Error('Can\'t reach database server at localhost:5432')),
        create: jest.fn().mockRejectedValue(new Error('Can\'t reach database server at localhost:5432')),
        update: jest.fn().mockRejectedValue(new Error('Can\'t reach database server at localhost:5432')),
      },
    } as unknown as PrismaService;

    const service = new AuthService(
      prisma,
      {} as JwtTokenService,
      {
        sendWelcomeEmail: jest.fn().mockResolvedValue(true),
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
      } as unknown as MailService,
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
    );

    process.env.DB_SKIP = 'true';
    await expect(service.register({
      email: 'local@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
      firstName: 'Local',
      lastName: 'User',
    })).rejects.toBeInstanceOf(ServiceUnavailableException);

    await expect(service.login({ email: 'local@example.com', password: 'Password123!' })).rejects.toBeInstanceOf(ServiceUnavailableException);
    delete process.env.DB_SKIP;
  });
});
