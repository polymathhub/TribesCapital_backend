import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock } };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    configService = { get: jest.fn(() => 'development') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { sign: jest.fn(() => 'token') } },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('allows demo login without a database hit when the demo user is not found', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockImplementationOnce(async (data) => ({
      id: 'demo-id',
      email: data.data.email,
      firstName: data.data.firstName,
      lastName: data.data.lastName,
      password: data.data.password,
      isActive: true,
      emailVerified: true,
    }));
    prisma.user.update.mockResolvedValueOnce({});

    const result = await service.login({
      email: 'demo@tribes.capital',
      password: 'DemoPass123!',
    });

    expect(result.user.email).toBe('demo@tribes.capital');
    expect(prisma.user.create).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('falls back to a demo token when the database is unavailable', async () => {
    prisma.user.findUnique.mockRejectedValueOnce(new Error('db unavailable'));

    const result = await service.login({
      email: 'demo@tribes.capital',
      password: 'DemoPass123!',
    });

    expect(result.user.email).toBe('demo@tribes.capital');
    expect(result.accessToken).toBeDefined();
  });

  it('registers a new user and returns tokens', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValueOnce({
      id: 'new-user-id',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      isActive: true,
      emailVerified: true,
    });

    const result = await service.register({
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe('new@example.com');
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('allows login in production even when verification is configured as required', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'app.environment') return 'production';
      if (key === 'app.requireEmailVerification') return 'true';
      return 'development';
    });

    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'verified-user-id',
      email: 'verified@example.com',
      firstName: 'Verified',
      lastName: 'User',
      password: await bcrypt.hash('Password123!', 10),
      isActive: true,
      emailVerified: false,
    });
    prisma.user.update.mockResolvedValueOnce({});

    const result = await service.login({
      email: 'verified@example.com',
      password: 'Password123!',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe('verified@example.com');
  });

  it('rejects invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.login({ email: 'someone@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
