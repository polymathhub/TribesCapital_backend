import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { sign: jest.fn(() => 'token') } },
        { provide: ConfigService, useValue: { get: jest.fn(() => 'development') } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('allows demo login without a database hit when the demo user is not found', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValueOnce({
      id: 'demo-id',
      email: 'demo@tribes.capital',
      firstName: 'Demo',
      lastName: 'User',
      password: 'hashed',
      isActive: true,
      emailVerified: true,
    });
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

  it('rejects invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.login({ email: 'someone@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
